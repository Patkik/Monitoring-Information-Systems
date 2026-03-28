const nodemailer = require('nodemailer');

const canSendEmail = Boolean(
  (process.env.GMAIL_USER && process.env.GMAIL_PASS) ||
  (process.env.SMTP_USER && process.env.SMTP_PASSWORD)
);

const buildTransporter = () => {
  if (!canSendEmail) {
    console.warn('Email credentials are not configured. Outbound emails are disabled.');
    return null;
  }

  // Support both Gmail (GMAIL_USER/GMAIL_PASS) and SMTP (SMTP_*) configurations
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'Gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });
  }

  // SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const transporter = buildTransporter();

const sendMail = async (options) => {
  if (!transporter) {
    console.warn('Email service not configured. Cannot send email.');
    return false;
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER;
    await transporter.sendMail({ from: fromEmail, ...options });
    console.log(`Email sent successfully to: ${options.to}`);
    return true;
  } catch (error) {
    console.error('sendMail error:', error.message);
    return false;
  }
};

exports.sendPasswordResetEmail = async (email, code) => {
  const mailOptions = {
    to: email,
    subject: 'Password Reset Code - Mentoring System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi there,</p>
        <p>We received a request to reset your password. Please use the code below to create a new password:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #2563eb; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: monospace;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 14px;"><strong>Important:</strong> This code will expire in 15 minutes.</p>
        <p>If you didn't request this reset, please ignore this email or contact support.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    text: `Password Reset Code\n\nHi,\n\nYour password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this reset, please ignore this email.`
  };

  const sent = await sendMail(mailOptions);
  if (!sent) {
    throw new Error('EMAIL_NOT_SENT');
  }
};

exports.sendNotificationEmail = async ({ to, subject, text, html }) => {
  const sent = await sendMail({ to, subject, text, html });
  return sent;
};

exports.sendVerificationCodeEmail = async (email, code, firstname) => {
  const mailOptions = {
    to: email,
    subject: 'Verify Your Email - Mentoring System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Hi ${firstname || 'there'},</p>
        <p>Thank you for registering with the Mentoring System. Please use the verification code below to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `,
    text: `Hi ${firstname || 'there'},\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this verification, please ignore this email.`
  };

  const sent = await sendMail(mailOptions);
  if (!sent) {
    throw new Error('VERIFICATION_EMAIL_NOT_SENT');
  }
};


