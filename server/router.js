const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.post(
    '/login',
    mid.requiresSecure,
    mid.requiresLogout,
    controllers.Account.login,
  );

  app.get('/main-menu', mid.requiresLogin, controllers.Menu.mainPage);

  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  app.get('/getAccount', mid.requiresLogin, controllers.Account.getCurrentAccountName);

  app.get('/', mid.requiresLogout, controllers.Account.loginPage);
};

module.exports = router;
