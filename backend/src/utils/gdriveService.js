const { google } = require('googleapis');
const stream = require('stream');
const { toAppErrorCode, logDriveError } = require('./gdriveErrorHandler');

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_BYTES || 25 * 1024 * 1024); // 25MB default

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
]);

let oauthClient;
let driveClient;
let authMode;

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
  const hasServiceAccount = hasAllEnv(serviceAccountRequiredEnv);
  if (hasServiceAccount) {
    return { mode: 'service_account' };
  }

  const hasOAuth = hasAllEnv(oauthRequiredEnv);
  if (hasOAuth) {
    return { mode: 'oauth' };
  }

  const servicePartiallyConfigured = hasAnyEnv(serviceAccountRequiredEnv);
  const oauthPartiallyConfigured = hasAnyEnv(oauthRequiredEnv);

  if (servicePartiallyConfigured) {
    return {
      mode: 'service_account',
      missing: getMissingEnv(serviceAccountRequiredEnv),
    };
  }

  if (oauthPartiallyConfigured) {
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

const getDriveClient = () => {
  const selectedMode = ensureEnv();

  if (authMode && authMode !== selectedMode) {
    oauthClient = undefined;
    driveClient = undefined;
  }

  if (!oauthClient) {
    if (selectedMode === 'service_account') {
      oauthClient = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
        ['https://www.googleapis.com/auth/drive'],
      );
    } else {
      oauthClient = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        process.env.GOOGLE_DRIVE_REDIRECT_URI,
      );
      oauthClient.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
    }
  }

  if (!driveClient) {
    driveClient = google.drive({ version: 'v3', auth: oauthClient });
  }

  authMode = selectedMode;

  return { drive: driveClient, auth: oauthClient };
};

const ensureFolder = async (drive, name, parentId) => {
  const queryParts = ["mimeType = 'application/vnd.google-apps.folder'", `name = '${name.replace(/'/g, "\\'")}'`];
  if (parentId) {
    queryParts.push(`'${parentId}' in parents`);
  }

  const query = queryParts.join(' and ');

  const existing = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    pageSize: 1,
    spaces: 'drive',
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id, name',
  });

  return res.data.id;
};

const createFolderStructure = async ({ mentorId, sessionId }) => {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) {
    throw new Error('Neither GOOGLE_DRIVE_ROOT_FOLDER_ID nor GOOGLE_DRIVE_FOLDER_ID is configured');
  }

  const { drive } = getDriveClient();

  const baseFolderId = await ensureFolder(drive, 'BukSU_Mentoring', rootFolderId);
  const mentorsFolderId = await ensureFolder(drive, 'Mentors', baseFolderId);
  const mentorFolderId = await ensureFolder(drive, String(mentorId), mentorsFolderId);
  const sessionsFolderId = await ensureFolder(drive, 'Sessions', mentorFolderId);
  const sessionFolderId = await ensureFolder(drive, String(sessionId), sessionsFolderId);
  const materialsFolderId = await ensureFolder(drive, 'Materials', sessionFolderId);

  return {
    baseFolderId,
    mentorsFolderId,
    mentorFolderId,
    sessionsFolderId,
    sessionFolderId,
    materialsFolderId,
  };
};

const setFilePermissions = async ({ fileId, mentorEmail, menteeEmails = [] }) => {
  const { drive } = getDriveClient();
  const domain = process.env.GOOGLE_WORKSPACE_DOMAIN;

  const permissions = [];

  if (mentorEmail) {
    permissions.push({
      type: 'user',
      role: 'writer',
      emailAddress: mentorEmail,
    });
  }

  menteeEmails.forEach((email) => {
    if (!email) return;
    permissions.push({
      type: 'user',
      role: 'reader',
      emailAddress: email,
    });
  });

  if (domain) {
    // Optional domain-wide viewer link (if needed)
  }

  for (const perm of permissions) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await drive.permissions.create({
        fileId,
        requestBody: perm,
        sendNotificationEmail: false,
      });
    } catch (err) {
      logDriveError({ operation: 'setFilePermissions', fileId, permission: perm }, err);
      // Continue, but surface error via code if all fail
    }
  }
};

const validateFile = (file) => {
  if (!file) {
    const err = new Error('No file provided');
    err.code = 'NO_FILE';
    throw err;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const err = new Error('File exceeds maximum allowed size');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  if (!SUPPORTED_MIME_TYPES.has(file.mimetype)) {
    const err = new Error('Unsupported file type');
    err.code = 'UNSUPPORTED_FILE_TYPE';
    throw err;
  }
};

const uploadSessionMaterial = async ({ mentorId, sessionId, file, mentorEmail, menteeEmails = [] }) => {
  try {
    validateFile(file);

    const { drive } = getDriveClient();
    const folders = await createFolderStructure({ mentorId, sessionId });

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const res = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folders.materialsFolderId],
      },
      media: {
        mimeType: file.mimetype,
        body: bufferStream,
      },
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, modifiedTime',
    });

    const uploaded = res.data;

    await setFilePermissions({
      fileId: uploaded.id,
      mentorEmail,
      menteeEmails,
    });

    return {
      googleDriveFileId: uploaded.id,
      googleDriveWebViewLink: uploaded.webViewLink,
      googleDriveDownloadLink: uploaded.webContentLink,
      mimeType: uploaded.mimeType,
      fileSize: Number(uploaded.size) || file.size,
      folderPath: `BukSU_Mentoring/Mentors/${mentorId}/Sessions/${sessionId}/Materials`,
      name: uploaded.name,
      modifiedTime: uploaded.modifiedTime || new Date().toISOString(),
    };
  } catch (err) {
    logDriveError({ operation: 'uploadSessionMaterial', mentorId, sessionId }, err);
    const code = toAppErrorCode(err);
    const wrapped = new Error(err.message || 'Google Drive upload failed');
    wrapped.appCode = code;
    throw wrapped;
  }
};

const generateShareableLinks = (fileId) => {
  const base = 'https://drive.google.com/file/d';
  const webView = `${base}/${fileId}/view`;
  const download = `${base}/${fileId}/view?usp=download`;
  return {
    webView,
    download,
  };
};

module.exports = {
  uploadSessionMaterial,
  createFolderStructure,
  setFilePermissions,
  generateShareableLinks,
  MAX_FILE_SIZE_BYTES,
  SUPPORTED_MIME_TYPES,
};
