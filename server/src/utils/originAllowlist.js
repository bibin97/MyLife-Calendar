export const isLocalhostOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
  } catch {
    return true;
  }
};

export const parseOriginList = (value) => {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeOriginHeader = (value) => {
  if (!value || value === 'null') return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

export const originFromReferer = (referer) => {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
};

export const getRequestOrigin = (req) => {
  const fromOrigin = normalizeOriginHeader(req.get('origin'));
  if (fromOrigin) return fromOrigin;
  return originFromReferer(req.get('referer'));
};

export const getAllowedBrowserOrigins = (config) => {
  const extras = parseOriginList(config.FRONTEND_ORIGINS);
  const configured = [config.CLIENT_ORIGIN, ...extras].filter(Boolean);

  if (config.NODE_ENV === 'production') {
    return [...new Set(configured.filter((origin) => !isLocalhostOrigin(origin)))];
  }

  return [...new Set([
    ...configured,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ])];
};
