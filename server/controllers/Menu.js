const mainPage = (req, res) => {
  res.render(
    'main-menu',
    {
      nickname: req.session.account.nickname,
    },
  );
};

module.exports = {
  mainPage,
};
