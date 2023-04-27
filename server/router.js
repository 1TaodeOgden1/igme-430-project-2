const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
  // helper.sendPost urls
  app.get('/', mid.requiresLogout, controllers.Account.loginPage);
  app.post('/to-game', mid.requiresLogin, controllers.Game.moveToGame);
  app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);
  app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

  // main urls to each handlebar
  app.get('/main-menu', mid.requiresLogin, controllers.Menu.mainPage);
  app.get('/gamePage', mid.requiresLogin, mid.requiresLobby, controllers.Game.gamePage);
  app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);

  // helper.getData urls
  app.get('/getAccount', mid.requiresLogin, controllers.Account.getCurrentAccountName);

  // other
  app.get('/logout', mid.requiresLogin, controllers.Account.logout);
};

module.exports = router;
