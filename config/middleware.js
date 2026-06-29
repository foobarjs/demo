export default {
  global: ['SecureHeaders'],
  aliases: {
    ApiThrottle: { use: 'ThrottleRequests', options: { max: 60, windowMs: 60_000 } },
    UploadBodyLimit: { use: 'LimitBodySize', options: { maxBytes: 1024 * 1024 } },
  },
  groups: {
    web: ['StartSession', 'VerifyCsrfToken'],
    auth: ['StartSession', 'RequireAuth'],
    api: ['ApiThrottle'],
  },
};
