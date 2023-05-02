const requiresLogin = (req, res, next) => {
  if (!req.session.account) {
    return res.redirect('/');
  }
  return next();
};

const requiresLogout = (req, res, next) => {
  if (req.session.account) {
    return res.redirect('/main-menu');
  }

  return next();
};

const requiresSecure = (req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.url}`);
  }
  return next();
};

const bypassSecure = (req, res, next) => {
  next();
};

const requiresLobby = (req, res, next) => {
  if (!req.session.lobby) {
    return res.redirect('/main-menu');
  }
  return next();
};

const requiresNotInLobby = (req, res, next) => {
  if (req.session.lobby) {
    return res.redirect('/main-menu');
  }
  return next();
};

module.exports.requiresLogin = requiresLogin;
module.exports.requiresLogout = requiresLogout;
module.exports.requiresLobby = requiresLobby;
module.exports.requiresNotInLobby = requiresNotInLobby;

if (process.env.NODE_ENV === 'production') {
  module.exports.requiresSecure = requiresSecure;
} else {
  module.exports.requiresSecure = bypassSecure;
}
