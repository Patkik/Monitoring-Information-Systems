require('dotenv').config();
const express = require('express');
const dns = require('dns');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const passport = require('./config/passport');
const helmet = require('helmet');
const { startSessionReminderWorker } = require('./services/sessionReminderWorker');
const { startFeedbackRetentionWorker } = require('./services/feedbackRetentionWorker');
const { startMentorFeedbackAggregationWorker } = require('./services/mentorFeedbackAggregationWorker');
const compression = require('compression');

const app = express();

// Build CORS allowlist from env; supports comma-separated values
const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((s) => s.trim()).filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (no origin) and any in the allowlist
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "http://localhost:4000", "ws://localhost:4000"], // for dev tools/hot reload
      },
    },
  })
);

// HTTP compression for JSON/text responses (minimal risk, boosts throughput)
app.use(compression());

// Silence .well-known 404s for devtools/chrome probes
app.use('/.well-known', (req, res) => {
  res.status(204).send();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', require('./routes/authRoutes'));
app.use('/api', require('./routes/applicationRoutes'));
app.use('/api', require('./routes/mentorRoutes'));
app.use('/api', require('./routes/adminRoutes'));
app.use('/api', require('./routes/profileRoutes'));
app.use('/api', require('./routes/sessionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api', require('./routes/goalRoutes'));
app.use('/api', require('./routes/progressRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api', require('./routes/mentorFeedbackRoutes'));
app.use('/api', require('./routes/feedbackRoutes'));
app.use('/api', require('./routes/certificateRoutes'));
app.use('/api', require('./routes/integrationRoutes'));
app.use('/api', require('./routes/matchRoutes'));
app.use('/api', require('./routes/reportRoutes'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Global error handler to ensure JSON responses (e.g., multer/file upload errors)
// Must come after routes and static handlers
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Basic content negotiation: default to JSON
  logger.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred';
  return res.status(status).json({ success: false, error: 'SERVER_ERROR', message });
});

const start = async () => {
  const primaryUri = process.env.MONGODB_URI;
  const fallbackUri = process.env.MONGODB_URI_FALLBACK;

  if (!primaryUri) {
    logger.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  const configuredDnsServers = String(process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configuredDnsServers.length > 0) {
    try {
      dns.setServers(configuredDnsServers);
      logger.info('Configured custom DNS servers for MongoDB resolution', { dnsServers: configuredDnsServers });
    } catch (dnsErr) {
      logger.warn('Failed to apply MONGODB_DNS_SERVERS; continuing with system DNS', {
        message: dnsErr && dnsErr.message ? dnsErr.message : String(dnsErr),
      });
    }
  }

  const sanitizeMongoUri = (value) => String(value).replace(/(mongodb(?:\+srv)?:\/\/)([^@/]+)@/i, '$1<credentials>@');

  const connOptions = {
    // rely on modern mongoose defaults
    serverSelectionTimeoutMS: 10000,
    retryWrites: true,
    appName: process.env.APP_NAME || 'MentoringSystem',
  };

  const getConnOptionsForUri = (mongoUri) => {
    const options = { ...connOptions };
    // Enable TLS only for SRV (Atlas) URIs or when explicitly requested via env.
    if (String(mongoUri).startsWith('mongodb+srv://') || process.env.MONGODB_TLS === 'true') {
      options.tls = true;
      options.tlsAllowInvalidCertificates = process.env.MONGODB_TLS_ALLOW_INVALID === 'true';
    }
    return options;
  };

  // Connection event handlers for better observability
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('close', () => logger.warn('MongoDB connection closed'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error:', err && err.message ? err.message : err));

  // Retry logic with exponential backoff for transient network errors (ECONNRESET etc.)
  const maxRetries = Number(process.env.MONGODB_CONNECT_RETRIES || 5);
  const baseDelayMs = Number(process.env.MONGODB_CONNECT_BACKOFF_MS || 1000);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let activeUri = primaryUri;
  let usingFallbackUri = false;

  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      attempt += 1;
      logger.info(`Attempting MongoDB connection (attempt ${attempt}/${maxRetries + 1})`, {
        uriType: usingFallbackUri ? 'fallback' : 'primary',
      });
      await mongoose.connect(activeUri, getConnOptionsForUri(activeUri));
      logger.info('MongoDB connection established');
      break;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      logger.error(`MongoDB connection attempt ${attempt} failed: ${msg}`);

      const lowerMsg = msg.toLowerCase();
      const isSrvLookupFailure = lowerMsg.includes('querysrv');

      if (
        !usingFallbackUri
        && String(primaryUri).startsWith('mongodb+srv://')
        && isSrvLookupFailure
        && fallbackUri
      ) {
        usingFallbackUri = true;
        activeUri = fallbackUri;
        logger.warn('MongoDB SRV lookup failed; switching to fallback MongoDB URI for subsequent retries', {
          fallbackUri: sanitizeMongoUri(fallbackUri),
        });
      }

      // If we've exhausted retries, exit with error
      if (attempt > maxRetries) {
        logger.error('Exceeded maximum MongoDB connection attempts; exiting');
        // Give the logger a brief moment to flush
        await sleep(200);
        process.exit(1);
      }

      // If error looks like a transient network/DNS issue, backoff and retry
      const isTransient = msg.includes('ECONNRESET')
        || msg.includes('ECONNREFUSED')
        || lowerMsg.includes('timed out')
        || msg.includes('ENOTFOUND')
        || lowerMsg.includes('failed to connect')
        || isSrvLookupFailure;
      const delay = Math.min(30000, baseDelayMs * Math.pow(2, attempt - 1));
      if (isSrvLookupFailure) {
        logger.warn('MongoDB SRV lookup failed; retrying after delay. Hint: verify DNS resolution and SRV URI format (mongodb+srv://...).', { delay });
      } else if (isTransient) {
        logger.warn('MongoDB transient connection error; retrying after delay', { delay });
      } else {
        logger.warn('MongoDB connection error; retrying after delay', { delay });
      }
      await sleep(delay);
    }
  }

  // Gracefully handle termination signals to close DB connection
  const shutdown = async (signal) => {
    try {
      logger.info(`Received ${signal}; closing MongoDB connection`);
      await mongoose.connection.close(false);
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (closeErr) {
      logger.error('Error during MongoDB shutdown:', closeErr && closeErr.message ? closeErr.message : closeErr);
      process.exit(1);
    }
  };

  // Only handle signals in production
  if (process.env.NODE_ENV === 'production') {
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    logger.info(`API running on :${port}`);
    startSessionReminderWorker();
    startFeedbackRetentionWorker();
    startMentorFeedbackAggregationWorker();
  });
};

start();


