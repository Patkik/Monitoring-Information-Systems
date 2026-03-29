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

const ensureEnv = () => {
  const { mode, missing, missingByMode } = resolveAuthMode();

  if (mode === 'service_account' && (!missing || !missing.length)) {
    return mode;
  }

  if (mode === 'oauth' && (!missing || !missing.length)) {
    return mode;
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

const createDriveClient = () => {
  const mode = ensureEnv();

  if (mode === 'service_account') {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      ['https://www.googleapis.com/auth/drive'],
    );
    return { drive: google.drive({ version: 'v3', auth }), mode };
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  return { drive: google.drive({ version: 'v3', auth }), mode };
};

const listFiles = async ({ folderId, pageSize = 20 }) => {
  const { drive } = createDriveClient();
  const qParts = ["trashed = false"];
  if (folderId) {
    qParts.push(`'${folderId}' in parents`);
  }

  const response = await drive.files.list({
    q: qParts.join(' and '),
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink, webContentLink)',
    pageSize,
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
};

const formatFile = (file) => ({
  id: file.id,
  name: file.name,
  mimeType: file.mimeType,
  modifiedTime: file.modifiedTime,
  webViewLink: file.webViewLink,
  downloadLink: file.webContentLink,
});

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--folder' || arg === '-f') {
      options.folderId = args[i + 1];
      i += 1;
    } else if (arg === '--limit' || arg === '-l') {
      options.pageSize = Number(args[i + 1]) || undefined;
      i += 1;
    }
  }
  return options;
};

const run = async () => {
  try {
    const { folderId, pageSize } = parseArgs();
    const effectiveFolder = folderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!effectiveFolder) {
      throw new Error('No folder specified and both GOOGLE_DRIVE_ROOT_FOLDER_ID and GOOGLE_DRIVE_FOLDER_ID are unset. Pass --folder <ID>.');
    }

    const mode = ensureEnv();

    console.log(`📂 Listing up to ${pageSize || 20} files under folder ${effectiveFolder} using ${mode} auth...`);
    const files = await listFiles({ folderId: effectiveFolder, pageSize });
    if (!files.length) {
      console.log('No files found.');
      return;
    }

    files.map(formatFile).forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   MIME: ${file.mimeType}`);
      console.log(`   Modified: ${file.modifiedTime}`);
      if (file.webViewLink) console.log(`   View: ${file.webViewLink}`);
      if (file.downloadLink) console.log(`   Download: ${file.downloadLink}`);
    });
  } catch (error) {
    console.error('❌ Failed to list Drive files');
    console.error('   Message:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exitCode = 1;
  }
};

if (require.main === module) {
  run();
}

module.exports = { listFiles };
