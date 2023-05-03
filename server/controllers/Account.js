const models = require('../models');

const { Account } = models;

const loginPage = (req, res) => {
  res.render('login');
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

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
  const pass = `${req.body.pass}`;
  const pass2 = `${req.body.pass2}`;

  if (!username || !pass || !pass2) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (pass !== pass2) {
    return res.status(400).json({ error: 'Passwords do not match!' });
  }

  try {
    const hash = await Account.generateHash(pass);
    const newAccount = new Account({
      username, password: hash, wins: 0, premium: false,
    });
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

const getAccountData = async (req, res) => {
  const { username } = req.session.account;
  const accData = await Account.toJSON(username, () => res.status(404).json({ error: 'Account not found!' }));
  return res.json(accData);
};

const ChangeAccountPass = async (req, res) => {
  const { oldpass } = req.body;
  const { newpass } = req.body;
  const { username } = req.session.account;

  if (!oldpass || !newpass) {
    return res.status(400).json({ error: 'All fields are required!' });
  }

  if (oldpass === newpass) {
    return res.status(400).json({ error: 'New password must be different!' });
  }

  return Account.authenticate(username, oldpass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Old password is incorrect!' });
    }

    Account.UpdatePass(username, newpass);

    // password change successful; log the user out
    req.session.destroy();
    return res.json({ redirect: '/' });
  });
};

const TogglePremium = async (req, res) => {
  const value = req.body.state;
  const username = req.session.account.username; 
  const doc = await Account.findByIdAndUpdate(req.session.account._id, { premium: value }, { returnDocument: 'after' });

  const newDoc = await Account.findOne({username});
  
  return res.json({ premium: doc.premium });
};

module.exports = {
  loginPage,
  login,
  logout,
  signup,
  getAccountData,
  ChangeAccountPass,
  TogglePremium,
};
