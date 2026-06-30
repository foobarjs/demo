/**
 * Application configuration.
 *
 * Purpose:
 *   Central location for foundational app settings: name, environment, debug mode,
 *   base URL, and cryptographic secrets used for session signing and auth tokens.
 *
 * Key settings:
 *   - name: Display name for the app (used in logs, admin UI, emails).
 *   - env: Environment context (local, production, etc.) to select feature toggles.
 *   - debug: Enable verbose error messages and exception details.
 *   - url: Public-facing app URL for generating links in redirects and emails.
 *   - secret: Cryptographic key for signing sessions and auth cookies.
 *
 * Pro tip:
 *   In development, defaults are intentionally insecure and convenient.
 *   For production or staging, always set APP_SECRET to a strong random value
 *   (e.g., `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
 *   Rotating APP_SECRET logs out all active sessions and invalidates auth tokens.
 */

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV || 'local';
const isProduction = runtimeEnv === 'production';
const appSecret = process.env.APP_SECRET;

if (isProduction && !appSecret) {
  throw new Error('APP_SECRET is required in production. Set to a strong random value.');
}

export default {
  name: process.env.APP_NAME || 'foobarjs ecommerce',
  env: runtimeEnv,
  debug: process.env.APP_DEBUG
    ? process.env.APP_DEBUG === 'true'
    : runtimeEnv !== 'production',
  url: process.env.APP_URL || 'http://localhost:3000',
  secret: appSecret || 'change-me-in-production',
};
