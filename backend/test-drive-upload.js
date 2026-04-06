const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { google } = require('googleapis');

const oauthRequiredEnv = [
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REDIRECT_URI',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
];

const serviceAccountRequiredEnv = [
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
];

const hasAllEnv = (keys) => keys.every((key) => Boolean(process.env[key]));
const hasAnyEnv = (keys) => keys.some((key) => Boolean(process.env[key]));
const getMissingEnv = (keys) => keys.filter((key) => !process.env[key]);
const normalizePrivateKey = (privateKey) => privateKey.replace(/\\n/g, '\n');

const resolveAuthMode = () => {
  if (hasAllEnv(serviceAccountRequiredEnv)) {
    return { mode: 'service_account' };
  }

  if (hasAllEnv(oauthRequiredEnv)) {
    return { mode: 'oauth' };
  }

  if (hasAnyEnv(serviceAccountRequiredEnv)) {
    return {
      mode: 'service_account',
      missing: getMissingEnv(serviceAccountRequiredEnv),
    };
  }

  if (hasAnyEnv(oauthRequiredEnv)) {
    return {
      mode: 'oauth',
      missing: getMissingEnv(oauthRequiredEnv),
    };
  }

  return {
    mode: 'none',
    missingByMode: {
      service_account: getMissingEnv(serviceAccountRequiredEnv),
      oauth: getMissingEnv(oauthRequiredEnv),
    },
  };
};

const createAuthClient = () => {
  const { mode, missing, missingByMode } = resolveAuthMode();

  if (mode === 'service_account' && (!missing || !missing.length)) {
    return {
      mode,
      auth: new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
        ['https://www.googleapis.com/auth/drive'],
      ),
    };
  }

  if (mode === 'oauth' && (!missing || !missing.length)) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI,
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
    return { mode, auth };
  }

  if (mode === 'service_account' || mode === 'oauth') {
    throw new Error(
      `Google Drive auth mode '${mode}' is missing env vars: ${missing.join(', ')}. `
      + `Required for '${mode}': ${mode === 'service_account' ? serviceAccountRequiredEnv.join(', ') : oauthRequiredEnv.join(', ')}`,
    );
  }

  throw new Error(
    `Google Drive auth is not configured. Service account required: ${serviceAccountRequiredEnv.join(', ')} `
    + `(missing: ${missingByMode.service_account.join(', ')}). OAuth required: ${oauthRequiredEnv.join(', ')} `
    + `(missing: ${missingByMode.oauth.join(', ')}).`,
  );
};

async function testDriveUpload() {
  try {
    const { auth, mode } = createAuthClient();

    const drive = google.drive({ version: 'v3', auth });
    const parentFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!parentFolderId) {
      throw new Error('Neither GOOGLE_DRIVE_ROOT_FOLDER_ID nor GOOGLE_DRIVE_FOLDER_ID is configured');
    }

    const fileMetadata = {
      name: `test-upload-${Date.now()}.txt`,
      parents: [parentFolderId],
    };

    const media = {
      mimeType: 'text/plain',
      body: `This is a test upload from BukSU Mentoring System at ${new Date().toISOString()}`,
    };

    console.log(`🔄 Attempting to upload test file using ${mode} auth...`);
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    console.log('✅ SUCCESS! File uploaded:');
    console.log('   File ID:', response.data.id);
    console.log('   File Name:', response.data.name);
    console.log('   View Link:', response.data.webViewLink);
    console.log('   Download Link:', response.data.webContentLink);
    return response.data;
  } catch (error) {
    console.error('❌ UPLOAD FAILED:');
    console.error('   Error:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.errors) {
      console.error('   Errors:', JSON.stringify(error.errors, null, 2));
    }
    return null;
  }
}

if (require.main === module) {
  testDriveUpload();
}

module.exports = { testDriveUpload };
