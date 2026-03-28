---
name: enterprise-realtime-cloud
description: Enterprise-grade Socket.IO and Google Drive API integration patterns for high-concurrency, distributed systems. Use when implementing real-time communications at scale, optimizing WebSocket performance, designing distributed Socket.IO clusters with Redis adapters, managing Google Drive API rate limits, implementing webhook-based synchronization, handling OAuth token lifecycle, or building fault-tolerant cloud storage integrations. Covers memory optimization, transport layer tuning, multi-node orchestration, advanced Drive API querying, and zero-trust security patterns.
---

# Enterprise System Architecture: Real-Time Communications and Cloud Storage APIs

Advanced integration strategies for Socket.IO and Google Drive API at enterprise scale.

## Table of Contents

- [Socket.IO Transport Layer Optimization](#socketio-transport-layer-optimization)
  - [WebSocket Engine and Memory Profiling](#websocket-engine-and-memory-profiling)
  - [Custom Parsers and Compression](#custom-parsers-and-compression)
  - [Distributed State Management](#distributed-state-management)
  - [Transport Layer Diagnostics](#transport-layer-diagnostics)
- [Google Drive API Integration](#google-drive-api-integration)
  - [Authentication and Security](#authentication-and-security)
  - [Rate Limit Mitigation](#rate-limit-mitigation)
  - [Webhook Lifecycle Management](#webhook-lifecycle-management)
  - [Advanced Query Patterns](#advanced-query-patterns)
- [Production Deployment Patterns](#production-deployment-patterns)

---

## Socket.IO Transport Layer Optimization

### WebSocket Engine and Memory Profiling

**Problem:** Default Socket.IO configurations suffer from significant memory bloat under extreme concurrency (10,000+ concurrent connections).

**Solution:** Optimize the underlying WebSocket engine and eliminate memory leaks.

#### 1. High-Performance Engine Replacement

```javascript
// Replace default 'ws' with C++-backed alternatives
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  // Option 1: Use uWebSockets.js (highest performance)
  wsEngine: require('uws').Server,
  
  // Option 2: Keep 'ws' but install native add-ons
  // npm install bufferutil utf-8-validate
  // These are auto-detected by 'ws' package
});
```

**Memory Impact:**
- Default `ws`: ~10MB per 1,000 connections
- With `bufferutil` + `utf-8-validate`: ~6MB per 1,000 connections  
- `uWebSockets.js`: ~3MB per 1,000 connections

#### 2. HTTP Request Reference Leak Prevention

```javascript
// CRITICAL: Prevent memory leak from retained HTTP handshake
io.engine.on("connection", (rawSocket) => {
  // Sever reference to massive IncomingMessage object
  rawSocket.request = null;
});

// Why: Default behavior retains entire HTTP request in memory
// for duration of WebSocket connection (for express-session compat).
// In JWT-based auth, this is unnecessary and causes heap exhaustion.
```

**Heap Reduction:** ~30-40% reduction in baseline memory usage.

---

### Custom Parsers and Compression

#### MessagePack Parser (Binary Optimization)

```javascript
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';

// Server
const io = new Server(httpServer, {
  parser: customParser
});

// Client
const socket = ioClient('https://example.com', {
  parser: customParser
});
```

**Benefits:**
- Reduces payload size by 20-30% vs JSON
- Eliminates per-buffer WebSocket framing overhead
- Ideal for binary-heavy workloads (file uploads, media streams)

**Trade-off:** ~5% CPU increase vs 30% bandwidth reduction

#### perMessageDeflate: When NOT to Use

```javascript
// ❌ DANGEROUS in high-concurrency environments
const io = new Server(httpServer, {
  perMessageDeflate: {
    threshold: 1024
  }
});

// Problem: Compression buffers allocated PER connection
// During massive broadcast -> instant OOM crash

// ✅ SAFE: Disable for stability
const io = new Server(httpServer, {
  perMessageDeflate: false
});
```

**Rule:** Only enable `perMessageDeflate` if:
- Peak concurrent connections < 5,000
- Broadcast frequency is low
- You have robust heap monitoring

---

### Distributed State Management

#### Scaling Strategy Decision Tree

```
Single Machine (Multi-Core)?
  ├─ Yes → @socket.io/cluster-adapter (IPC-based)
  └─ No → Redis-based adapter
           ├─ Redis < 7.0 → @socket.io/redis-adapter (Pub/Sub)
           ├─ Redis >= 7.0 → @socket.io/redis-adapter (Sharded)
           └─ Need zero packet loss? → @socket.io/redis-streams-adapter
```

#### Cluster Adapter (Single-Machine Optimization)

```javascript
// primary.js
import cluster from 'cluster';
import { setupPrimary } from '@socket.io/cluster-adapter';

if (cluster.isPrimary) {
  // Enable advanced serialization for binary buffers
  cluster.setupPrimary({
    serialization: 'advanced'
  });
  
  setupPrimary();
  
  // Fork workers
  for (let i = 0; i < require('os').cpus().length; i++) {
    cluster.fork();
  }
}

// worker.js
import { Server } from 'socket.io';
import { setupWorker } from '@socket.io/cluster-adapter';

const io = new Server(httpServer);
setupWorker(io);
```

**When to use:**
- Maximizing single-machine resource utilization
- No external Redis required
- Lower latency (IPC vs network)

#### Redis Sharded Adapter (Multi-Machine Scale)

```javascript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient, {
    // Subscription mode optimization
    subscriptionMode: 'dynamic-private', // For 1:1 messaging apps
    // subscriptionMode: 'dynamic',       // For room-based apps
    // subscriptionMode: 'static',        // For massive namespace apps
  })
});
```

**Subscription Modes Explained:**

| Mode | Redis Channels | Best For |
|------|----------------|----------|
| `static` | 2 per namespace | Thousands of dynamic namespaces |
| `dynamic` | 2 + 1 per public room | Standard multi-room apps |
| `dynamic-private` | 2 + 1 per room + private | Heavy 1:1 messaging (DMs) |

**Critical:** Requires Redis 7.0+ for sharded Pub/Sub (`SSUBSCRIBE`/`SPUBLISH`)

#### Redis Streams Adapter (Zero Packet Loss)

```javascript
import { createAdapter } from '@socket.io/redis-streams-adapter';

const io = new Server(httpServer, {
  adapter: createAdapter(pubClient, subClient, {
    streamName: 'socket.io',
    // Prevent infinite memory growth
    maxLen: 10000, // Keep last 10k events
    readCount: 100  // Events per read
  })
});
```

**Use Case:** Prevents data loss during temporary Redis disconnections.

**Trade-off:** ~10% higher Redis memory usage vs Pub/Sub.

---

### Inter-Node Communication

#### serverSideEmit (Cluster Coordination)

```javascript
// Node A: Broadcast to all other nodes
io.serverSideEmit('cache:invalidate', { key: 'user:123' });

// All nodes (including A): Receive the event
io.on('cache:invalidate', ({ key }) => {
  redis.del(key);
});

// With acknowledgements (async/await)
const responses = await io.serverSideEmitWithAck('metrics:collect');
console.log('Collected from', responses.length, 'nodes');
```

**Constraints:**
- ❌ Cannot send binary buffers (JSON.stringify limitation)
- ❌ Reserved names: `connection`, `connect`, `new_namespace`
- ✅ Acknowledgements supported (with timeout handling)

**Use Cases:**
- Distributed cache invalidation
- Cluster-wide metric aggregation
- Admin commands broadcast

---

### Session Affinity (Sticky Sessions)

**Problem:** HTTP long-polling requires all requests from same client hit same server.

**Symptom:** `{"code":1,"message":"Session ID unknown"}` errors.

#### Solution 1: NGINX Load Balancer

```nginx
upstream socket_nodes {
  ip_hash; # Session affinity by client IP
  server 192.168.1.10:3000;
  server 192.168.1.11:3000;
  server 192.168.1.12:3000;
}

server {
  location /socket.io/ {
    proxy_pass http://socket_nodes;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    # CRITICAL: Must exceed Socket.IO heartbeat
    proxy_read_timeout 90s; # pingInterval (25s) + pingTimeout (20s) + buffer
  }
}
```

#### Solution 2: PM2 with Sticky Module

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'socket-app',
    script: 'server.js',
    instances: 4,
    exec_mode: 'cluster'
  }]
};

// server.js
import { setupMaster, setupWorker } from '@socket.io/sticky';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';
import cluster from 'cluster';

if (cluster.isMaster) {
  setupMaster(httpServer, {
    loadBalancingMethod: 'least-connection' // or 'round-robin'
  });
  
  setupPrimary();
  
  cluster.fork();
  cluster.fork();
  cluster.fork();
  cluster.fork();
} else {
  setupWorker(io);
}
```

**Rule:** ALWAYS enable sticky sessions unless:
- You disable long-polling entirely: `transports: ['websocket']`
- You use a single server (no load balancer)

---

### Transport Layer Diagnostics

#### "Transport Close" Error Resolution

**Root Cause:** Proxy timeout < Socket.IO heartbeat interval.

**Default Timings:**
- Socket.IO `pingInterval`: 25s
- Socket.IO `pingTimeout`: 20s
- **Combined silence tolerance**: 45s

**Fix:**

```javascript
// 1. Increase proxy timeout (NGINX example)
// nginx.conf
proxy_read_timeout 90s; // Must be > 45s

// 2. OR reduce Socket.IO heartbeat
const io = new Server(httpServer, {
  pingInterval: 15000, // 15s
  pingTimeout: 10000   // 10s
  // Combined: 25s (fits in default 60s proxy timeout)
});
```

**Advanced:** Namespace Collision Race Condition

```javascript
// Problem: Multiple namespaces on same transport can collide
const socket1 = io('/chat');
const socket2 = io('/feed'); // Uses SAME physical connection

// Solution: Force separate connections
const socket1 = io('/chat', { forceNew: true });
const socket2 = io('/feed', { forceNew: true });
```

**Trade-off:** Slightly higher connection overhead for guaranteed isolation.

---

### Observability and Memory Management

#### Admin UI Instrumentation

```javascript
import { instrument } from '@socket.io/admin-ui';
import { RedisStore } from '@socket.io/admin-ui';

instrument(io, {
  auth: {
    type: 'basic',
    username: 'admin',
    password: '$2b$10$...' // bcrypt hash
  },
  
  // CRITICAL: Production mode prevents memory leak
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Distributed auth store (prevents logouts on node switch)
  store: new RedisStore(redisClient),
  
  // Unique server identifier in cluster
  serverId: `${require('os').hostname()}#${process.pid}`
});
```

**Access:** Navigate to `https://admin.socket.io` → Connect to your server

**Memory Impact:**
- `development` mode: Tracks ALL socket details → Memory grows linearly
- `production` mode: Aggregated stats only → Fixed memory footprint

#### Dynamic Namespace Cleanup

```javascript
const io = new Server(httpServer, {
  // ENABLE to prevent namespace memory leak
  cleanupEmptyChildNamespaces: true
});

// Now safe to create thousands of dynamic namespaces
io.of(/^\/workspace-\w+$/).on('connection', (socket) => {
  // When last client disconnects, namespace is auto-destroyed
});
```

**Impact:** Prevents heap exhaustion in tenant-isolated SaaS architectures.

---

## Google Drive API Integration

### Authentication and Security

#### Service Account vs OAuth Decision Tree

```
Who owns the files?
  ├─ Application (background jobs, no user) → Service Account (2-legged OAuth)
  │   └─ Need user file access? → Domain-Wide Delegation
  │
  └─ Individual users → 3-legged OAuth
      └─ Multiple services? → Centralized Token Management Service (TMS)
```

#### Service Account with Domain-Wide Delegation

```javascript
import { google } from 'googleapis';

const auth = new google.auth.JWT({
  keyFile: '/path/to/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/drive'],
  
  // CRITICAL: Impersonate a user (requires Domain-Wide Delegation)
  subject: 'user@domain.com'
});

const drive = google.drive({ version: 'v3', auth });

// Now acts as 'user@domain.com'
const files = await drive.files.list();
```

**Security Constraints:**
1. Service Account must be granted Domain-Wide Delegation in Workspace Admin Console
2. Restrict OAuth scopes to minimum required
3. **NEVER** expose Service Account key in client-side code or version control

#### Token Management Service (TMS) Architecture

```javascript
// Centralized TMS microservice
import express from 'express';
import { google } from 'googleapis';

const app = express();
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Internal endpoint (not public)
app.get('/internal/token/:userId', async (req, res) => {
  const { userId } = req.params;
  
  // Fetch refresh token from encrypted DB
  const { refreshToken } = await db.getUser(userId);
  
  // Check Redis cache first
  const cached = await redis.get(`token:${userId}`);
  if (cached) return res.json({ accessToken: cached });
  
  // Refresh token
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  // Cache with TTL
  await redis.setex(`token:${userId}`, 3300, credentials.access_token);
  
  res.json({ accessToken: credentials.access_token });
});
```

**Benefits:**
- Prevents refresh token proliferation
- Centralized rotation logic
- Avoids race conditions

---

### Rate Limit Mitigation

#### Error Types and Remediation

| Error Code | Meaning | Immediate Action | Long-Term Fix |
|------------|---------|------------------|---------------|
| `rateLimitExceeded` | Project-wide quota exceeded | Exponential backoff | Request quota increase |
| `userRateLimitExceeded` | Per-user quota exceeded | Exponential backoff | Distribute load across users |

#### Truncated Exponential Backoff with Jitter

```javascript
async function driveRequestWithRetry(fn, maxRetries = 5) {
  const baseDelay = 1000; // 1 second
  const maxDelay = 32000; // 32 seconds
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 403 && 
          (error.errors[0].reason === 'rateLimitExceeded' ||
           error.errors[0].reason === 'userRateLimitExceeded')) {
        
        // Calculate backoff with jitter
        const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        const jitter = Math.random() * 1000; // 0-1s random jitter
        const totalDelay = exponentialDelay + jitter;
        
        console.warn(`Rate limited (${error.errors[0].reason}), retrying in ${totalDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
      } else {
        throw error; // Not a rate limit error
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Usage
const files = await driveRequestWithRetry(() => 
  drive.files.list({ pageSize: 100 })
);
```

**Critical:** Jitter prevents "thundering herd" where all servers retry simultaneously.

#### Intelligent Queue-Based Throttling

```javascript
import PQueue from 'p-queue';

// Rate limiter: 10 requests per second
const driveQueue = new PQueue({
  intervalCap: 10,
  interval: 1000,
  carryoverConcurrencyCount: true
});

// Wrap all Drive API calls
async function queuedDriveRequest(fn) {
  return driveQueue.add(fn);
}

// Usage
const files = await queuedDriveRequest(() =>
  drive.files.list({ q: "'root' in parents" })
);
```

**Benefits:**
- Prevents burst requests that trigger rate limits
- Maximizes sustained throughput
- Eliminates retry overhead

---

### Webhook Lifecycle Management

#### Push Notification Setup

```javascript
import { v4 as uuidv4 } from 'uuid';

async function setupWebhook(drive, resourceId) {
  const channelId = uuidv4();
  const token = crypto.randomBytes(32).toString('hex'); // Cryptographic secret
  
  const res = await drive.files.watch({
    fileId: resourceId,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: 'https://yourdomain.com/webhooks/drive',
      token: token, // REQUIRED for authentication
      expiration: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
  });
  
  // Store in database
  await db.saveChannel({
    id: channelId,
    token: token,
    resourceId: resourceId,
    expiration: res.data.expiration
  });
  
  return res.data;
}
```

**Security:** Always validate `X-Goog-Channel-Token` header matches stored token.

#### Webhook Receiver Endpoint

```javascript
import express from 'express';
import crypto from 'crypto';

const app = express();

app.post('/webhooks/drive', express.json(), async (req, res) => {
  const channelId = req.headers['x-goog-channel-id'];
  const channelToken = req.headers['x-goog-channel-token'];
  const resourceState = req.headers['x-goog-resource-state'];
  
  // 1. AUTHENTICATE: Validate token
  const channel = await db.getChannel(channelId);
  if (!channel || channel.token !== channelToken) {
    return res.status(401).send('Unauthorized');
  }
  
  // 2. IMMEDIATE RESPONSE: Return 200 ASAP
  res.status(200).send('OK');
  
  // 3. ASYNC PROCESSING: Queue the work
  if (resourceState === 'sync') {
    // Initial sync notification, ignore
    return;
  }
  
  // Add to Redis queue (Bull, BullMQ, etc.)
  await jobQueue.add('processDriveChange', {
    channelId,
    resourceState,
    resourceId: req.headers['x-goog-resource-id']
  });
});
```

**Critical Rules:**
1. **ALWAYS** return `2xx` within 5 seconds
2. **NEVER** perform heavy processing in webhook handler
3. **ALWAYS** validate the token

#### Proactive Channel Renewal (Prevent Silent Expiration)

```javascript
import cron from 'node-cron';

// Run every hour
cron.schedule('0 * * * *', async () => {
  const expiringChannels = await db.getChannelsExpiringSoon(
    Date.now() + (2 * 60 * 60 * 1000) // Expiring in < 2 hours
  );
  
  for (const channel of expiringChannels) {
    try {
      // Create new overlapping channel
      const newChannel = await setupWebhook(drive, channel.resourceId);
      console.log(`Renewed channel ${channel.id} -> ${newChannel.id}`);
      
      // Stop old channel gracefully
      await drive.channels.stop({
        requestBody: {
          id: channel.id,
          resourceId: channel.resourceId
        }
      });
      
      await db.deleteChannel(channel.id);
    } catch (error) {
      console.error(`Failed to renew channel ${channel.id}:`, error);
    }
  }
});
```

**Why:** Webhooks expire silently. No notification, no error. Must proactively renew.

---

### Changes API and Delta Synchronization

#### Stateful Token-Based Sync

```javascript
// Initial full sync
async function initialSync(drive) {
  const startPageToken = await drive.changes.getStartPageToken();
  
  let pageToken = startPageToken.data.startPageToken;
  let allChanges = [];
  
  do {
    const res = await drive.changes.list({
      pageToken: pageToken,
      pageSize: 100,
      // CRITICAL: Include Shared Drives
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'changes(fileId,removed,file(id,name,mimeType)),nextPageToken,newStartPageToken'
    });
    
    allChanges.push(...res.data.changes);
    pageToken = res.data.nextPageToken;
    
    // Save final token for future delta sync
    if (res.data.newStartPageToken) {
      await db.savePageToken(res.data.newStartPageToken);
    }
  } while (pageToken);
  
  return allChanges;
}

// Incremental delta sync (triggered by webhook)
async function deltaSync(drive) {
  const savedToken = await db.getPageToken();
  
  const res = await drive.changes.list({
    pageToken: savedToken,
    pageSize: 100,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  
  // Process only the delta
  for (const change of res.data.changes) {
    if (change.removed) {
      await db.deleteFile(change.fileId);
    } else {
      await db.upsertFile(change.file);
    }
  }
  
  // Save new token
  if (res.data.newStartPageToken) {
    await db.savePageToken(res.data.newStartPageToken);
  }
}
```

**Efficiency:** Only fetches changes since last sync (not entire corpus).

---

### Advanced Query Patterns

#### High-Fidelity Corpus Querying

```javascript
// Hierarchical scope isolation
const filesInFolder = await drive.files.list({
  q: "'1234567890' in parents",
  fields: 'files(id,name)',
  pageSize: 100
});

// Data type filtering
const images = await drive.files.list({
  q: "mimeType contains 'image/'",
  fields: 'files(id,name,mimeType)'
});

// Negative exclusion (exclude Google Workspace native docs)
const standardFiles = await drive.files.list({
  q: "not mimeType contains 'application/vnd.google-apps'",
  fields: 'files(id,name,mimeType)'
});

// Access control auditing
const externalWriters = await drive.files.list({
  q: "'contractor@external.com' in writers",
  fields: 'files(id,name,permissions)'
});

// Temporal state tracking (manual fallback sync)
const recentChanges = await drive.files.list({
  q: "modifiedTime > '2025-01-01T12:00:00'",
  orderBy: 'modifiedTime desc',
  fields: 'files(id,name,modifiedTime)'
});
```

**Query Operators:**

| Operator | Syntax | Use Case |
|----------|--------|----------|
| `in` | `'123' in parents` | Array property matching |
| `contains` | `mimeType contains 'image/'` | Substring matching |
| `not` | `not trashed = true` | Negation |
| `>`, `<`, `>=`, `<=` | `modifiedTime > '2025-01-01'` | Comparison |
| `and`, `or` | `trashed = false and starred = true` | Boolean logic |

#### Partial Response (Payload Optimization)

```javascript
// ❌ BAD: Returns 50+ fields per file (megabytes of JSON)
const res = await drive.files.list({
  pageSize: 1000
});

// ✅ GOOD: Returns only requested fields
const res = await drive.files.list({
  pageSize: 1000,
  fields: 'files(id,name,mimeType)' // Comma-separated root fields
});

// ✅ ADVANCED: Nested object extraction
const res = await drive.files.list({
  pageSize: 1000,
  fields: 'files(id,name,capabilities/canDownload)' // Forward slash for nesting
});

// ✅ EXPERT: Array sub-field isolation
const res = await drive.files.list({
  pageSize: 1000,
  fields: 'files(id,name,permissions(id,role))' // Parentheses for array sub-selection
});
```

**Impact:** 70-90% reduction in payload size and JSON parsing time.

---

### Cache Invalidation for Real-Time Edits

**Problem:** Exporting a Google Doc immediately after edit may return stale cache.

**Solution: Cache-Busting Touch**

```javascript
async function exportLatestRevision(drive, fileId) {
  // 1. Force cache invalidation by updating modifiedTime
  await drive.files.update({
    fileId: fileId,
    requestBody: {
      modifiedTime: new Date().toISOString()
    }
  });
  
  // 2. NOW export (guaranteed fresh)
  const res = await drive.files.export({
    fileId: fileId,
    mimeType: 'application/pdf'
  });
  
  return res.data;
}
```

**Why:** Google's edge cache may serve stale revision. "Touching" forces invalidation.

---

## Production Deployment Patterns

### OS-Level Tuning

```bash
# Increase file descriptor limit (required for 100k+ connections)
ulimit -n 1000000

# Expand local port range (prevent port exhaustion)
echo "1024 65535" > /proc/sys/net/ipv4/ip_local_port_range

# Enable TCP BBR congestion control (Linux kernel 4.9+)
echo "net.core.default_qdisc=fq" >> /etc/sysctl.conf
echo "net.ipv4.tcp_congestion_control=bbr" >> /etc/sysctl.conf
sysctl -p
```

### Node.js Heap Optimization

```bash
# Increase max heap size (default: 1.5GB on 64-bit)
node --max-old-space-size=8192 server.js

# Enable heap snapshot on OOM (for debugging)
node --heapsnapshot-near-heap-limit=3 server.js
```

### Docker Production Configuration

```dockerfile
FROM node:18-alpine

# Install native dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN npm install bufferutil utf-8-validate # Socket.IO native add-ons

COPY . .

# Run as non-root user
USER node

# Increase heap for production
ENV NODE_OPTIONS="--max-old-space-size=4096"

CMD ["node", "server.js"]
```

---

## References and Further Reading

- [Socket.IO Performance Tuning Guide](https://socket.io/docs/v4/performance-tuning/)
- [Socket.IO Redis Adapter Documentation](https://socket.io/docs/v4/redis-adapter/)
- [Google Drive API v3 Reference](https://developers.google.com/drive/api/v3/reference)
- [Google Drive Push Notifications](https://developers.google.com/drive/api/v3/push)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

## Common Commands

```bash
# Socket.IO Diagnostics
node --trace-warnings server.js              # Debug memory leaks
node --inspect server.js                     # Chrome DevTools profiling

# Google Drive API Testing
gcloud auth application-default login        # Local dev authentication
gcloud auth print-access-token               # Get token for curl testing

# Redis Cluster Health
redis-cli --cluster check localhost:6379     # Verify cluster status
redis-cli INFO replication                   # Check replication lag
```
