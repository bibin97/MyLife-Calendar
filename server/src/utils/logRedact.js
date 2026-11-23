const MONGODB_URI_RE = /mongodb(?:\+srv)?:\/\/\S+/gi;
const CREDENTIAL_RE = /\b(JWT_SECRET|MONGODB_URI|password|passwd|secret|credentials?)\s*[=:]\s*\S+/gi;

export const redactSecrets = (value) => {
  if (value == null) return '';
  const text = typeof value === 'string' ? value : value.stack || value.message || String(value);
  return text
    .replace(MONGODB_URI_RE, '[redacted-mongodb-uri]')
    .replace(CREDENTIAL_RE, '$1=[redacted]');
};

export const containsSensitiveConfig = (value) => {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return /mongodb(?:\+srv)?:\/\//i.test(text);
};
