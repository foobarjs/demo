/**
 * Admin panel configuration.
 *
 * Purpose:
 *   Configure the admin interface: authentication, branding, and visual theme
 *   overrides. This demo uses model-backed admin login for the `/_admin` route.
 *
 * Key settings:
 *   - provider: Framework-native admin user provider.
 *              Uses the User model and framework password hashing APIs.
 *              Restricts admin access to active users with admin role.
 *   - password: Optional fallback for password mode; unused while provider.type
 *               is set to "model".
 *   - secret: Use app.secret instead (see config/app.js).
 *   - brand: Display name shown in the admin header.
 *   - theme: Optional CSS variable overrides for admin UI customization.
 *
 * Pro tip:
 *   For production, keep APP_SECRET strong and create real active admin users.
 *   The seeded admin account is only for local demo use.
 */

const adminPassword = process.env.FOOBAR_ADMIN_PASSWORD;

export default {
  password: adminPassword || 'password',
  provider: {
    type: 'model',
    model: 'User',
    identifier: 'email',
    passwordField: 'password',
    roleField: 'role',
    allowedRoles: ['admin'],
    statusField: 'status',
    activeStatuses: ['active'],
  },
  brand: 'Demo Ecommerce Admin',
  path: '/admin',
  theme: {
    // density: 'compact',
    // primary: '#18181b',
    // primaryRgb: '24, 24, 27',
    // radius: '8px',
    // sidebar: {
    //   background: '#ffffff',
    //   foreground: '#5f6673',
    //   active: '#f0f1f4',
    //   activeForeground: '#1f2937',
    //   border: '#e8ebf0',
    // },
  },
};
