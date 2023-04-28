const { Player } = require('./Player.js');

class Game {
  constructor(userList, maxRounds) {
    this.maxRounds = maxRounds;
    this.currentRound = 0;
    this.players = [];
    this.populatePlayers(userList);
    this.prompt = '';
    this.judge = '';
    this.responses = {};
    this.prompts = {};
    // index of the judge in the array
    this.jIndex = 0;
  }

  // creates a Player struct to represent each player in the game
  populatePlayers(userList) {
    userList.forEach((playerName) => this.players.push(new Player(playerName)));
  }

  // each player draws a fresh seven cards
  initializeGame() {
    this.players.forEach((player) => {
      for (let i = 0; i < 7; i++) {
        this.draw(player);
      }
    });

    // go to first round
    this.nextRound();
  }

  handleLeaver(playerName) {
    this.nextRound();
    // const offender = this.getPlayerByName(playerName);
    // if (offender.isJudge) {

    // }
  }

  // the player draws a card (which are represented as strings)
  draw(player) {
    let card;
    let deckIndex;

    // this while loop will prevent out-of-bound errors
    while (!card) {
      deckIndex = Math.floor(Math.random() * this.responses.white.length - 1);
      card = this.responses.white[deckIndex];
    }

    player.hand.push(card.text);

    // remove it from the deck
    delete this.responses.white[deckIndex];
  }

  getPrompt() {
    let card;
    let deckIndex;

    // this while loop will prevent out-of-bound errors
    while (!card) {
      deckIndex = Math.floor(Math.random() * this.prompts.black.length - 1);
      card = this.prompts.black[deckIndex];
    }

    const prompt = card.text;

    // remove it from the deck
    delete this.prompts.black[deckIndex];
    return prompt;
  }

  // returns an array containing the scores, in order of player names in this.players
  getScores() {
    return this.players.map((p) => p.score);
  }

  // https://stackoverflow.com/questions/3954438/how-to-remove-item-from-array-by-value
  submitCard(playerName, cardText) {
    const player = this.getPlayerByName(playerName);
    // remove the card
    player.hand = player.hand.filter((e) => e !== cardText);
    player.chosenCard = cardText;
  }

  // only called when all cards have been submitted;
  // simply returns a formatted JS object that can
  // easily be processed by the client
  getAllSubmitted() {
    const obj = this.players.map((player) => {
      if (!player.isJudge) {

      }
      return ({
        name: player.name,
        submitted: player.chosenCard,
      });
    });
    return obj;
  }

  // pick the winner for the ROUND, given the player's name
  pickWinner(winnerName) {
    this.getPlayerByName(winnerName).score++;
    this.nextRound();
  }

  // pick the winner for the GAME
  // returns the name of the winner for Socket to send back
  endGame() {
    // https://stackoverflow.com/questions/36941115/return-object-with-highest-value
    // First, get the max vote from the array of objects
    const maxScore = Math.max(this.players.map((p) => p.score));

    // Get the object having votes as max votes
    const winner = this.players.find((p) => p.score === maxScore);

    return (winner.name);
  }

  // logistics for moving to the next
  nextRound() {
    if (this.currentRound !== 0) {
      this.players.forEach((player) => {
        // players don't draw first round

        // each player except for the judge draws
        if (!player.isJudge) {
          this.draw(player);
        }

        // de-judgify
        if (player.isJudge) {
          player.isJudge = false;
        }
      });
    }

    // setting up next round
    this.currentRound++;
    this.prompt = this.getPrompt();

    // don't bother changing if there's only 1 person
    if (this.players.length === 1) {
      this.jIndex = 0;
    } else {
      // loop back to index 0
      if (this.jIndex > this.players.length - 1) {
        this.jIndex = 0;
      }
    }

    this.players[this.jIndex].isJudge = true;
    this.judge = this.players[this.jIndex].name;

    // prep index for next round
    this.jIndex++;

    // clear responses
    this.players.forEach((player) => {
      player.chosenCard = '';
    });
  }

  getPlayerByName(name) {
    const playerOnly = this.players.filter((player) => player.name === name)[0];
    return playerOnly;
  }

  allPlayersReady() {
    // if a player hasn't submitted yet, immediately return false
    for (let i = 0; i < this.players.length; i++) {
      // perform this check on all players besides the judge
      if (!this.players[i].isJudge) {
        if (!this.players[i].chosenCard) {
          return false;
        }
      }
    }
    return true;
  }
}

module.exports = {
  Game,
};
