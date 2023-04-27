/* To hook up socket, we need to import the http library and the Server
    class from the socket.io library. Although socket.io works with
    Express, we need to have the http library to hook it up.
*/
const http = require('http');
const { Server } = require('socket.io');
const { Game } = require('./GameObj.js');

// max number of users per lobby;
// stretch goal: users can adjust how many players are in the room
const CAPACITY = 4;

const lobbies = {
    // a *new* lobby object is formatted as:
    // 'lobbyPassword': {
    //     host: 'hostname',
    //     userList: [], //nicknames of each user currently in the lobby
    //     rounds: int,
    //     game: new Game(userList, rounds)
    //     state: 'string'
    // possible states: "waiting" : users are waiting for host to start, new users can join
    //                 "in game" : game in progress, new users CANNOT join
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

/* This handleChatMessage function takes in a message and "emits" it
    to a specific channel in our socket.io system. Clients can choose to
    subscribe to specific channels, as seen in the /hosted/client.js file.
*/
const handleChatMessage = (msg) => {
    io.emit(msg.channel, msg.message);
};

//removes session's reference to the lobby & 
//adjusts the lobby object here
const cleanupLobby = (socket) => {
    const { session } = socket.request;
    if (session.lobby) {
        session.reload((err) => {
            if (err) {
                console.log(err);
            }
            session.lobby = null;
            session.save();
        });
    }
};

// This is where the majority of the game logic is implemented
// Essentially, each lobby has a Game class that is manipulated by
//
const handleGameEvent = (params, socket) => {
    const sessionInfo = socket.request.session;
    const lobby = lobbies[sessionInfo.lobby];
    console.log(sessionInfo);
    switch (params.user_event) {
        //when the host enters a host's room
        case 'entered room': {
            // A socket room represents the lobby in the server
            socket.join(`${sessionInfo.lobby}`);

            // tell every user that a new user has joined
            io.to(`${sessionInfo.lobby}`).emit('server-events', {
                id: 'user joined',
                lobbyInfo: this.lobby,
                // if the user's account username (which must be unique in the database)
                // is the same as the lobby's host username
                isHost: false,
                userList: lobby.userList,
                message: 'user added to lobby',
            });

            break;
        }
        //when the host enters the room
        case 'created room': {
            socket.join(`${sessionInfo.lobby}`);

            io.to(`${sessionInfo.lobby}`).emit('server-events', {
                id: 'lobby created',
                lobbyInfo: this.lobby,
                // if the user's account username (which must be unique in the database)
                // is the same as the lobby's host username
                isHost: true,
                userList: lobby.userList,
                message: 'host added to lobby',
            });
            break;
        }
        case 'started game': {
            // add the gameState object to the triggered lobby; this will store
            // game pertinent info
            lobby.game = new Game(
                lobby.userList,
                lobby.rounds,
            );
            lobby.state = 'in game';

            // tell the room the game has started; should trigger REACT changes in the other sockets
            io.to(`${sessionInfo.lobby}`).emit('server-events', {
                id: 'game initialized',
            });
            break;
        }
        default: {
            break;
        }
    }
};
/*

*/
const handleJoinLobby = (password, socket) => {
    // console.log(password);
    // if the password is correct and the lobby exists
    if (lobbies[password]) {
        // the room isn't full
        if (lobbies[password].userList.length >= CAPACITY) {
            socket.emit('server-events', {
                id: 'failed join',
                message: 'Room is full...',
            });
        }
        // AND the game hasn't started
        else if (lobbies[password].state === 'in game') {
            socket.emit('server-events', {
                id: 'failed join',
                message: "Room's game is in progress!",
            });
        }
        else {
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
            lobbies[password].userList.push(userSession.account.nickname);

            // tell the client to start rendering the game interface
            socket.emit('server-events', {
                id: 'joined room',
                message: 'successfully joined room!',
            });
        }
    }
    // room doesn't exist or the user didn't enter a correct password
    else {
        socket.emit('server-events', {
            id: 'failed join',
            message: "Incorrect password / Room with password doesn't exist!",
        });
    }
};

// Creates a new lobby object, IF:
const handleCreateLobby = (params, socket) => {
    //   console.log(params.roompass);
    //   console.log(params.gamelength);

    // tell the user a room with the same password exists
    if (lobbies[params.roompass]) {
        socket.emit('server-events', {
            id: 'failed host',
            message: 'A room with the same password already exists!',
        });
    } else {
        // grab the express session context
        const userSession = socket.request.session;
        // broadcast to everyone in the room & save the lobby
        const newLobby = {
            host: userSession.account.username,
            userList: [],
            rounds: params.gamelength,
            capacity: CAPACITY,
            state: 'waiting',
        };

        // save the lobby to the server
        lobbies[params.roompass] = newLobby;

        // put the user in the lobby
        lobbies[params.roompass].userList.push(userSession.account.nickname);

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

    /* Socket.IO is entirely built on top of an event system. Our server
                          can send messages to clients, which trigger events on their side.
                          In the same way, clients can send messages to the server, which
                          trigger events on our side.
  
                          The first event is the 'connection' event, which fires each time a
                          client connects to our server. The event returns a "socket" object
                          which represents their unique connection to our server.
                      */
    io.on('connection', (socket) => {
        console.log('A user has connected!');

        /* With the socket object, we can handle events for that specific
            user. For example, the disconnect event fires when the user
          disconnects (usually by closing their browser window).
           */
        socket.on('disconnect', () => {
            console.log('a user disconnected');
            cleanupLobby(socket);
        });

        /* SOCKET EVENT HANDLERS */
        socket.on('chat message', handleChatMessage);

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

    /* Finally, after our server is set up, we will return it so that we
                          can start it in app.js.
                      */
    return server;
};

// We only export the one function from this file, just like in router.js
module.exports = { socketSetup, lobbies };
