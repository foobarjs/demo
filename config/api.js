// Auto REST API access rules.
//
// The storefront catalog is public to read but every write requires an
// authenticated session or Bearer token. Sensitive framework-owned resources
// (users, personal access tokens) are locked down entirely — they carry
// account and credential metadata that must never be publicly listable.
export default {
  auth: {
    read: false,
    write: 'session',
  },
  models: {
    users: 'session',
    personal_access_tokens: 'session',
  },
}
