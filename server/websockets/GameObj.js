const { Player } = require('./Player.js');

class Game {
    constructor(userList, maxRounds) {
        this.maxRounds = maxRounds;
        this.currentRound = 0;
        this.players = [];
        this.populatePlayers(userList);
        this.prompt = '';
    }

    // creates a Player struct to represent each player in the game
    populatePlayers(userList) {
        userList.forEach((playerName) => this.players.push(new Player(playerName)));
    }

    // each player draws a fresh seven cards
    intializeGame() {
        this.players.forEach((player) => {
            for (let i = 0; i < 7; i++) {
                this.draw(player);
            }
        });

        // go to the 'first' round
        this.nextRound();
    }

    /* These two methods will make requests to a public CAH API */

    // the player draw a card (which are represented as strings)
    draw(player) {
        // to be implemented with API
        player.hand.push('A card');
    }

    getPrompt() {
        // to be implemented with API
        return 'A prompt.';
    }

    // returns an array containing the scores, in order of player names in this.players
    getScores() {
        return this.players.map((p) => p.score);
    }

    // https://stackoverflow.com/questions/3954438/how-to-remove-item-from-array-by-value
    submitCard(player, cardText) {
        player.hand = player.hand.filter((e) => e !== cardText);
        player.chosenCard = cardText;
    }

    // pick the winner for the ROUND, given the player's name
    pickWinner(winnerName) {
        const winnerOnly = this.players.filter((player) => player.name === winnerName);
        // above should return an array of size 1
        winnerOnly[0].score++;

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
        // players have already drawn on round '0'
        if (this.currentRound !== 0) {
            // each player except for the judge draws
            this.players.map((player) => {
                if (!player.isJudge) {
                    this.draw(player);
                }
                // de-judgify
                if (player.isJudge) {
                    player.isJudge = false;
                }
            });
        }

        prompt = hostIndex = this.currentRound % this.players.length;
        players[hostIndex].isJudge = true;
    }
}

module.exports = {
    Game,
};
