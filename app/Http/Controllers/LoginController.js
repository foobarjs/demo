import { controller } from '@foobarjs/framework';

export default controller('LoginController', {
  async show(ctx) {
    return ctx.view('auth/login', {
      title: 'Sign in',
      routes: {
        loginStore: ctx.route('auth.login.store'),
      },
    });
  },

  async store(ctx) {
    const credentials = await ctx.body();
    const user = await ctx.auth.attempt(credentials);

    if (!user) {
      ctx.flash('old', { email: credentials.email || '' });
      ctx.flash('errors', [{ field: 'email', message: 'These credentials do not match our records.' }]);
      return ctx.redirectBack(ctx.route('auth.login.show'));
    }

    return ctx.redirectRoute('auth.account');
  },

  async account(ctx) {
    return ctx.view('auth/account', {
      title: 'Your account',
      user: ctx.auth.user(),
      routes: {
        logout: ctx.route('auth.logout'),
        home: ctx.route('home'),
      },
    });
  },

  async logout(ctx) {
    ctx.auth.logout();
    return ctx.redirectRoute('auth.login.show');
  },
});
