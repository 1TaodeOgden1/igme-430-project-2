const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // helper.sendPost urls
  app.get('/', mid.requiresLogout, controllers.Account.loginPage);
  app.post('/to-game', mid.requiresLogin, controllers.Game.moveToGame);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);
  app.post('/change-pass', mid.requiresSecure, mid.requiresLogin, controllers.Account.ChangeAccountPass);
  app.post('/setPremium', mid.requiresLogin, mid.requiresSecure, controllers.Account.TogglePremium);

  // main urls to each handlebar
  app.get('/main-menu', mid.requiresLogin, controllers.Menu.mainPage);
  app.get('/gamePage', mid.requiresLogin, mid.requiresLobby, controllers.Game.gamePage);
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
  app.get('/account', mid.requiresSecure, mid.requiresLogin, controllers.Account.getAccountData);

  // other
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
  // on a 404, attempt to redirect user back to main menu
  app.get('*', (req, res) => res.redirect('/main-menu'));
};

module.exports = router;
