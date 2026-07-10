const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { ALLOWED_ATTACHMENT_MIME_TYPES } = require('../utils/constants');

// On Vercel the deployed bundle is read-only (only os.tmpdir() is writable),
// and that storage is ephemeral — it can vanish between invocations. That's
// an acceptable trade-off for a demo deployment, but it means uploaded files
// are not guaranteed to persist there the way they do in local/traditional
// hosting. Locally (and on any regular server), we keep using a real folder
// on disk so uploads persist normally.
const uploadPath = process.env.VERCEL === '1' ? path.join(os.tmpdir(), env.uploadDir) : path.join(__dirname, '..', '..', env.uploadDir);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    // Random name on disk — never trust/reuse the client-supplied filename for storage.
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}${path.extname(file.originalname)}`);
  },
});

// Authoritative server-side validation: the client also checks type/size for
// a better UX, but this fileFilter + limits pair is what actually protects us.
function fileFilter(req, file, cb) {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Unsupported file type'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 5 },
});

module.exports = upload;
module.exports.uploadPath = uploadPath;
