// a class that represents a player

class Player {
  constructor(name) {
    this.name = name;
    this.score = 0;
    this.hand = [];
    this.isJudge = false;
    this.chosenCard = '';
  }
}

module.exports = {
  Player,
};
