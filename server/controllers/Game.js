const gamePage = (req, res) => {
  res.render('game'); 
};

const moveToGame = (req, res) => {
  return res.status(200).json({redirect: '/gamePage', info: req.body});
}

module.exports = {
  gamePage,
  moveToGame
}


