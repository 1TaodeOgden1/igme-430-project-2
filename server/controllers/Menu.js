const mainPage = (req, res) => {
  res.render(
    'main-menu',
    {
      username: req.session.account.username,
    },
  );
};

module.exports = {
  mainPage,
};
