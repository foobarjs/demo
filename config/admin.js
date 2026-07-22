export default {
  theme: {
    brand: 'Foobar Events Admin',
    logo: null,
    // Primary color is used to accent buttons and the sidebar active state.
    primaryColor: '#0f172a',
    // Default theme mode: 'light' or 'dark'. Users can override via the
    // topbar toggle (persisted in the foobar_admin_theme cookie).
    mode: 'light',
  },
  // Restrict admin access to isAdmin users or users with any role (default).
  requireAdmin: true,

  // strictAdmin: only isAdmin users can enter /admin. Organizers use
  // /organizer/* instead — the admin panel is for platform administrators.
  strictAdmin: true,
}
