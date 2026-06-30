const corsOrigins = (process.env.APP_CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

export default {
  global: ['SecureHeaders'],
  aliases: {
    ApiThrottle: { use: 'ThrottleRequests', options: { max: 60, windowMs: 60_000 } },
    UploadBodyLimit: { use: 'LimitBodySize', options: { maxBytes: 1024 * 1024 } },
    ApiCors: {
      use: 'Cors',
      options: {
        origins: corsOrigins,
        credentials: true,
      },
    },
  },
  groups: {
    web: ['StartSession', 'VerifyCsrfToken'],
    auth: ['StartSession', 'RequireAuth'],
    // API policies can evaluate signed-in users when session cookies are present.
    api: ['StartSession', 'ApiThrottle', 'ApiCors'],
  },
};
