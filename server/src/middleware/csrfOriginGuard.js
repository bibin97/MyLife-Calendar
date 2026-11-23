import { getAllowedBrowserOrigins, getRequestOrigin } from '../utils/originAllowlist.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfOriginGuard = (config) => {
  const allowlist = getAllowedBrowserOrigins(config);
  const isProd = config.NODE_ENV === 'production';

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      return next();
    }

    const requestOrigin = getRequestOrigin(req);
    if (requestOrigin && allowlist.includes(requestOrigin)) {
      return next();
    }

    // Browsers send Origin/Referer on cross-site POSTs. Supertest and local
    // tools often omit both; allow that only outside production.
    if (!requestOrigin && !isProd) {
      return next();
    }

    return res.status(403).json({ error: 'Cross-site request blocked.' });
  };
};
