/* To hook up socket, we need to import the http library and the Server
    class from the socket.io library. Although socket.io works with
    Express, we need to have the http library to hook it up.
*/
const http = require('http');
const { Server } = require('socket.io');
const { Game } = require('./GameObj.js');
const { loadWhite, loadBlack } = require('./cah_api.js');
const models = require('../models');

const { Account } = models;

// max number of users per lobby;
// stretch goal: users can adjust how many players are in the room
const CAPACITY = 4;

const lobbies = {
  // a *new* lobby object is formatted as:
  // 'lobbyPassword': {
  //     readyCount: int
  //     userList: [], an json storing objects formatted as
  //        'player username': {
  //             score:  <int>
  //             status: <string>
  //        }
  //     rounds: int,
  //     game: new Game(userList, rounds)
  //     state: 'string'
  // possible states: "waiting" : users are waiting for host to start, new users can join only
  //                              in this state
  //                 "in game" : game in progress,
  //                  "between rounds": players transitioning between rounds
  //                 "game ended": game ended,
  //
  // }
};

/* We are also going to make a file-scoped 'io' variable in which to
    store our io server. This is simply so that we can use the io
    server from various functions in this file without having to
    pass it in as a parameter to each one.
*/
let io;

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);

// Stretch goal: preserve user's state when they dc or disconnect
// const handleRejoin = (socket) => {
//   const sessionInfo = socket.request.session;
//   const lobby = lobbies[sessionInfo.lobby];

//   if(lobby) {
//     //rejoining mid-game
//     if(lobby.game){
//       const gameObj = lobby.game;
//     }
//   }
// }

// removes all references to the user in the lobby, and updates the
// internal Game object to handle that.
const handleLeaver = (socket) => {
  const sessionInfo = socket.request.session;
  const lobby = lobbies[sessionInfo.lobby];
  const { username } = sessionInfo.account;

  if (lobby) {
    // update the lobby list
    delete lobby.userList[username];
    // leaving the socket room is automatically handled by Socket

    // destroy the lobby if there's nobody left in it
    if (Object.keys(lobby.userList).length <= 0) {
      delete lobbies[sessionInfo.lobby];
      // leave the method here, as there are no users we need to emit to
      // this should avoid processing game logic when the user leaves
      return;
    }

    // leaving in the waiting room
    if (!lobby.game) {
      // reset the ready buttons
      io.to(`${sessionInfo.lobby}`).emit('server-events', {
        id: 'ready up for next round',
      });

      lobby.readyCount = 0;
      setStatusAll(lobby, 'not ready');
    }
    // leaving mid game
    if (lobby.game) {
      lobby.game.handleLeaver(username);

      if (lobby.state === 'in game') {
        // ATM, the game will simply go to the next round
        // if the player leaves mid-round
        // otherwise, proceed to between-round interlude

        // handle players leaving on the final round
        if (lobby.game.currentRound === lobby.rounds) {
          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'game over',
            winner: lobby.game.getOverallWinner(),

          });

          Account.AddWin(lobby.game.getOverallWinner());
        }
        if (lobby.game.currentRound !== lobby.round) {
          lobby.state = 'between rounds';
          lobby.readyCount = 0;
          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'ready up for next round',
          });
        }
      }
    }
    // finally, update the remaining users' interfaces
    io.to(`${sessionInfo.lobby}`).emit('server-events', {
      id: 'another user left',
      userList: lobby.userList,
      message: `${username} left the lobby! Ready up again to continue.`
    });
    socket.off('disconnect', handleLeaver);
  }
};

// shortcut method to set everyone's status to the same value
const setStatusAll = (lob, status) => {
  const lobby = lob;
  for (let i = 0; i < Object.keys(lobby.userList).length; i++) {
    const name = Object.keys(lobby.userList)[i];
    lobby.userList[name].status = status;
  }
};
// method to render the 'players pick cards to present to judge'
// portion of the game
const renderGameState = (lobby, sessionInfo) => {
  // set everyone's status
  setStatusAll(lobby, 'thinking...');
  // show the status of the game to all clients
  io.to(`${sessionInfo.lobby}`).emit('server-events', {
    id: 'render game state',
    currentRound: lobby.game.currentRound,
    prompt: lobby.game.prompt,
    judgeName: lobby.game.judge,
    userList: lobby.userList,
  });

  // send different events depending on the client user's role
  lobby.game.players.forEach((player) => {
    if (player.isJudge) {
      // the judge
      io.to(`${player.name}`).emit('server-events', {
        id: 'you become judge',
      });
      // // the player (uncomment to test hand interface solo)
      // io.to(`${player.name}`).emit('server-events', {
      //   id: 'start picking cards',
      //   cards: player.hand,
      // });
    } else {
      // the player
      io.to(`${player.name}`).emit('server-events', {
        id: 'start picking cards',
        cards: player.hand,
      });
    }
  });
};

// This is where the majority of the game logic is implemented
// Essentially, each lobby has a Game class that is manipulated by
// any user event
//
const handleGameEvent = async (params, socket) => {
  const sessionInfo = socket.request.session;
  const lobby = lobbies[sessionInfo.lobby];

  // if the user did not have the lobby password saved onto their
  // session instance via handleJoinLobby / handleCreateLobby
  // (e.g. they try to manually access this page),
  // redirect them back to the main menu
  if (!lobby || Object.keys(lobby.userList).indexOf(sessionInfo.account.username) === -1) {
    socket.emit('server-events', {
      id: 'redirect',
      message: 'Unknown error, redirected back to main menu',
    });

    return;
  }

  switch (lobby.state) {
    // possible user actions while in the waiting room
    case 'waiting': {
      switch (params.user_event) {
        // the user enters a room
        case 'entered room': {
          // attach socket listener to clean up the lobby when the user disconnects
          socket.on('disconnect', () => {
            // when the user disconnects, they are removed entirely from the game
            // and the lobby is updated to reflect that
            handleLeaver(socket);
          });

          // add the user to the lobby's channel
          socket.join(`${sessionInfo.lobby}`);

          /* also put the user into a special socket room that listens
                         to user-specific game events */
          socket.join(`${sessionInfo.account.username}`);

          // tell the client that they are in the looby
          socket.emit('server-events', {
            id: 'you joined',
            userList: lobby.userList,
            message: 'you were added to lobby',

          });

          // tell the other users that this user has joined
          socket.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'another user joined',
            lobbyInfo: this.lobby,
            userList: lobby.userList,
            message: 'another player added to lobby',
          });
          break;
        }
        // the user has declared themselves ready
        case 'readied': {
          lobby.readyCount++;

          lobby.userList[sessionInfo.account.username].status = 'ready';
          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'player readied',
            userList: lobby.userList,
          });
          break;
        }
        // the user has  canceled their readiness
        case 'unreadied': {
          lobby.readyCount--;
          lobby.userList[sessionInfo.account.username].status = 'not ready';
          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'player unreadied',
            userList: lobby.userList,
          });
          break;
        }
        default: {
          break;
        }
      }
      // START THE GAME
      // only start games when there's 2+ people ready
      // (although it really isn't fun when there's only 2 people playing)
      if (Object.keys(lobby.userList).length >= 1) {
        if (lobby.readyCount === Object.keys(lobby.userList).length) {
          // add the gameState object to the triggered lobby; this will store
          // game pertinent info
          lobby.game = new Game(
            Object.keys(lobby.userList), // send in only the list of username strings
          );

          /* When the class is instantiated, grab a set of white and black cards, representing
          the 'deck' for the game */
          lobby.game.responses = await loadWhite();
          lobby.game.prompts = await loadBlack();
          lobby.state = 'in game';

          // reset the ready counter;
          // give players control over when
          // to proceed to the next round
          lobby.readyCount = 0;
          // start up the lobby's game object
          lobby.game.initializeGame();
          // and update each client's interface
          renderGameState(lobby, sessionInfo);
        }
      }

      break;
    }

    case 'in game': {
      switch (params.user_event) {
        case 'start round': {
          renderGameState(lobby, sessionInfo);
          break;
        }
        // when a single player submits a card
        case 'player presented a card': {
          lobby.game.submitCard(
            sessionInfo.account.username,
            params.chosenCard,
          );

          // set status
          lobby.userList[sessionInfo.account.username].status = 'submitted';
          // update each player's user list component
          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'user submitted',
            userList: lobby.userList,
          });

          // until all players are ready, tell the submitter to wait
          socket.emit('server-events', {
            id: 'wait for other players',
          });

          // check if all players have submitted a card
          // once all players have submitted their responses,
          // switch the judge's view
          if (lobby.game.allPlayersReady()) {
            // if so, proceed to the judging phase
            lobby.game.players.forEach((player) => {
              // the judge
              if (player.isJudge) {
                io.to(`${player.name}`).emit(
                  'server-events',
                  {
                    id: 'pick a winner',
                    choices: lobby.game.getAllSubmitted(),
                  },
                );
              } else {
                // other players
                io.to(`${player.name}`).emit('server-events', {
                  id: 'wait for the judge',
                });
              }
            });
          }

          setStatusAll(lobby, 'not ready');

          break;
        }
        // when the judge has decided on a winner, update the game instance
        case 'judge decided': {
          lobby.game.pickWinner(params.winner);
          lobby.userList[params.winner].score++;

          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'show winner',
            winner: params.winner,
            prompt: lobby.game.prompt,
            answer: params.cardText,
            userList: lobby.userList,
          });

          // end the game when # of rounds has elapsed
          if (lobby.game.currentRound >= lobby.rounds) {
            io.to(`${sessionInfo.lobby}`).emit('server-events', {
              id: 'game over',
              prompt: lobby.game.prompt,
              answer: params.cardText,
              winner: lobby.game.getOverallWinner(),
            });
            lobby.state = 'game over';

            // update the client's account model
            Account.AddWin(lobby.game.getOverallWinner());
          } else {
            // otherwise, proceed to between-round interlude
            io.to(`${sessionInfo.lobby}`).emit('server-events', {
              id: 'ready up for next round',
            });

            lobby.state = 'between rounds';
          }

          break;
        }
        default: {
          break;
        }
      }
      break;
    }
    // in between rounds; players must all click the ready button
    // to restart the loop back to 'in game'
    case 'between rounds': {
      switch (params.user_event) {
        // the user has declared themselves ready
        case 'readied': {
          lobby.readyCount++;

          // set status
          lobby.userList[sessionInfo.account.username].status = 'ready';

          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'player readied',
            userList: lobby.userList,
          });

          break;
        }
        // the user has  canceled their readiness
        case 'unreadied': {
          lobby.readyCount--;

          // set status
          lobby.userList[sessionInfo.account.username].status = 'not ready';

          io.to(`${sessionInfo.lobby}`).emit('server-events', {
            id: 'player unreadied',
            userList: lobby.userList,
          });

          break;
        }
        default: {
          break;
        }
      }
      // PROCEEDING TO THE NEXT ROUND
      if (Object.keys(lobby.userList).length >= 1) {
        if (lobby.readyCount === Object.keys(lobby.userList).length) {
          // reset the ready counter;
          // give players control over when
          // to proceed to the next round
          lobby.readyCount = 0;
          lobby.state = 'in game';
          // update the game object's values for next round
          lobby.game.nextRound();
          // update each client's interface

          renderGameState(lobby, sessionInfo);
        }
      }
      break;
    }
    // there are no unique user actions for this game state;
    // they can only leave the game at this point
    case 'game ended':
    default: {
      break;
    }
  }
};

/*

*/
const handleJoinLobby = async (password, socket) => {
  // console.log(password);
  // if the password is correct and the lobby exists
  if (lobbies[password]) {
    // the room isn't full
    if (lobbies[password].userList.length >= CAPACITY) {
      socket.emit('server-events', {
        id: 'failed join',
        message: 'Room is full...',
      });
    } else if (lobbies[password].state === 'in game') {
      // AND the game hasn't started
      socket.emit('server-events', {
        id: 'failed join',
        message: "Room's game is in progress!",
      });
    } else {
      // grab the express session context
      const userSession = socket.request.session;

      // save the lobby object to the user's session
      userSession.reload((err) => {
        if (err) {
          return socket.disconnect();
        }
        userSession.lobby = password;
        userSession.save();

        return false;
      });

      // put the user in the room
      lobbies[password].userList[userSession.account.username] = {
        premium: await Account.CheckPremium(userSession.account.username),
        score: 0,
        status: 'not ready',
      };

      // tell the client to start rendering the game interface
      socket.emit('server-events', {
        id: 'joined room',
        message: 'successfully joined room!',
      });
    }
  } else {
    // room doesn't exist or the user didn't enter a correct password
    socket.emit('server-events', {
      id: 'failed join',
      message: "Room with password doesn't exist!",
    });
  }
};

// Creates a new lobby object, IF:
const handleCreateLobby = async (params, socket) => {
  // tell the user a room with the same password exists
  if (lobbies[params.roompass]) {
    socket.emit('server-events', {
      id: 'failed host',
      message: 'A room with the same password already exists!',
    });

    // password can't be blank
  } else if (params.roompass === '') {
    socket.emit('server-events', {
      id: 'failed host',
      message: 'Invalid password!',
    });
  } else {
    // grab the express session context
    const userSession = socket.request.session;
    // broadcast to everyone in the room & save the lobby
    const newLobby = {
      readyCount: 0,
      userList: {},
      rounds: params.gamelength,
      capacity: CAPACITY,
      state: 'waiting',
    };

    // save the lobby to the server
    lobbies[params.roompass] = newLobby;

    // put the user in the lobby
    lobbies[params.roompass].userList[userSession.account.username] = {
      premium: await Account.CheckPremium(userSession.account.username),
      score: 0,
      status: 'not ready',
    };

    // and to the user's session
    userSession.reload((err) => {
      if (err) {
        return socket.disconnect();
      }
      userSession.lobby = params.roompass;
      userSession.save();
      return false;
    });

    // tell the client to start rendering the game interface
    socket.emit('server-events', {
      id: 'created room',
      message: 'Successfully created lobby!',
    });
  }
};

/* This setup function takes in our express app, adds Socket.IO to it,
    and sets up event handlers for our io events.
*/
const socketSetup = (app, sessionMiddleware) => {
  /* To create our Socket.IO server with our Express app, we first
                 need to have the http library create a "server" using our Express
                 app as a template. We then hand that server off to Socket.IO which
                 will generate for us our IO server.
              */
  const server = http.createServer(app);
  io = new Server(server);

  io.use(wrap(sessionMiddleware));

  /*
                 The first event is the 'connection' event, which fires each time a
                 client connects to our server. The event returns a "socket" object
                 which represents their unique connection to our server.
              */
  io.on('connection', (socket) => {
    /* With the socket object, we can handle events for that specific
                            user. For example, the disconnect event fires when the user
                            disconnects (usually by closing their browser window).
                            */

    /* SOCKET EVENT HANDLERS */

    // event handler for when the user wants to create a lobby.
    // the user's created password and other lobby params are sent thu the emit call.
    socket.on('makeLobby', (params) => {
      handleCreateLobby(params, socket);
    });

    // event handler for when the user wants to join a lobby.
    // the user's entered password are sent thru the emit call.
    socket.on('joinLobby', (roompass) => {
      handleJoinLobby(roompass, socket);
    });

    socket.on('user event', (params) => {
      handleGameEvent(params, socket);
    });
  });

  /* Finally, after our server is set up,
            we will return it so that we
            can start it in app.js.
            */
  return server;
};

module.exports = { socketSetup };
