const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { uploadBuffer } = require('./src/utils/cloudinary');

async function testCloudinaryUpload() {
  const content = `Cloudinary upload test from backend at ${new Date().toISOString()}\n`;
  const buffer = Buffer.from(content, 'utf8');

  try {
    const result = await uploadBuffer(buffer, {
      folder: 'mentoring/test',
      resource_type: 'auto',
      public_id: `upload-test-${Date.now()}`,
    });

    if (!result?.public_id || !result?.secure_url) {
      throw new Error('Invalid upload response: missing public_id or secure_url');
    }

    console.log('SUCCESS: Cloudinary upload completed.');
    console.log('public_id:', result.public_id);
    console.log('secure_url:', result.secure_url);
    return result;
  } catch (error) {
    console.error('FAILURE: Cloudinary upload failed.');
    console.error('message:', error.message);
    if (error.code) {
      console.error('code:', error.code);
    }
    if (error.http_code) {
      console.error('http_code:', error.http_code);
    }
    if (error.name) {
      console.error('name:', error.name);
    }
    if (error.error?.message) {
      console.error('details:', error.error.message);
    }
    throw error;
  }
}

if (require.main === module) {
  testCloudinaryUpload().catch(() => {
    process.exit(1);
  });
}

module.exports = { testCloudinaryUpload };