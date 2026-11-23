import { env } from '../config/env.js';

/**
 * Same-origin /api (Vite and planned Vercel rewrite) uses Lax.
 * Set COOKIE_SAMESITE=none only if the browser must call a different API site.
 */
export const getAuthCookieOptions = (maxAge) => {
  const isProd = env.NODE_ENV === 'production';
  const sameSiteOverride = String(env.COOKIE_SAMESITE || '').toLowerCase();
  const sameSite = isProd && sameSiteOverride === 'none' ? 'none' : 'lax';
  const options = {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/'
  };

  if (typeof maxAge === 'number') {
    options.maxAge = maxAge;
  }

  return options;
};
