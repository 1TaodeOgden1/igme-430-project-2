const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => {
  res.render('login');
};

const userPage = (req, res) => {
  res.render('');
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

// allows client to access the name of the account from the server
const getCurrentAccountName = (req, res) => res.json({ nickname: req.session.account.nickname });

// login functionality
const login = (req, res) => {
  const username = `${req.body.username}`;
  const pass = `${req.body.pass}`;

  if (!username || !pass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  return Account.authenticate(username, pass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Wrong username or password!' });
    }
    req.session.account = Account.toAPI(account);
    return res.json({ redirect: '/main-menu' });
  });
};

// signup functionality
const signup = async (req, res) => {
  const username = `${req.body.username}`;
  const nickname = `${req.body.nickname}`;
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !nickname || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({ username, nickname, password: hash });
    await newAccount.save();
    req.session.account = Account.toAPI(newAccount);
    return res.json({ redirect: '/main-menu' });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Username already in use!' });
    }
    return res.status(500).json({ error: 'An error ocurred!' });
  }
};

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  getCurrentAccountName,
};
