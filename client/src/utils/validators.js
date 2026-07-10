/** Client-side password policy check — mirrors the server rule so users get instant feedback. */
export function isPasswordStrongEnough(password) {
  return typeof password === 'string' && password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/** Suggested feature: simple 0-4 password strength score for the strength meter. */
export function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MAX_UPLOAD_MB = 5;

/** Client-side attachment check (UX only — the server re-validates authoritatively). */
export function validateAttachment(file) {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" has an unsupported file type`;
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `"${file.name}" exceeds the ${MAX_UPLOAD_MB}MB limit`;
  }
  return null;
}
