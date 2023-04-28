

const { response } = require('express');
const { Player } = require('./Player.js');

class Game {
    constructor(userList, maxRounds) {
        this.maxRounds = maxRounds;
        this.currentRound = 0;
        this.players = [];
        this.populatePlayers(userList);
        this.prompt = '';
        this.judge = '';
        this.responses;
        this.prompts;
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

        // set up the first round
        this.prompt = this.getPrompt();

        let jIndex;
        // prevent divide by zero
        if (this.players.length == 1) {
            jIndex = 0;
        } else {
            jIndex = this.currentRound % (this.players.length - 1);
        }
        this.players[jIndex].isJudge = true;
        this.judge = this.players[jIndex].name;
    }

    handleLeaver(playerName) {
        this.nextRound();
        // const offender = this.getPlayerByName(playerName);
        // if (offender.isJudge) {

        // }
    }


    // the player draws a card (which are represented as strings)
    draw(player) {
        const deckIndex = Math.floor(Math.random() * this.responses['white'].length - 1);
        const cardText = this.responses['white'][deckIndex]['text'];
        player.hand.push(cardText);
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
        // end of current round actions
        this.players.map((player) => {
            // each player except for the judge draws
            if (!player.isJudge) {
                this.draw(player);
            }

            // de-judgify
            if (player.isJudge) {
                player.isJudge = false;
            }
        });

        // setting up next round
        this.currentRound++;
        this.prompt = this.getPrompt();

        let jIndex;
        // prevent divide by zero
        if (this.players.length == 1) {
            jIndex = 0;
        } else {
            jIndex = this.currentRound % (this.players.length - 1);
        }
        this.players[jIndex].isJudge = true;
        this.judge = this.players[jIndex].name;
    }

    getPlayerByName(name) {
        const playerOnly = this.players.filter((player) => player.name === name);

        return playerOnly;
    }
}

module.exports = {
    Game,
};
