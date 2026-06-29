export default {
  password: process.env.FOOBAR_ADMIN_PASSWORD || 'password',
  secret: process.env.FOOBAR_SECRET || 'change-me-in-production',
  brand: 'foobarjs admin',
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
