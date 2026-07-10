const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const { ALLOWED_ATTACHMENT_MIME_TYPES } = require('../utils/constants');

const uploadPath = path.join(__dirname, '..', '..', env.uploadDir);
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
