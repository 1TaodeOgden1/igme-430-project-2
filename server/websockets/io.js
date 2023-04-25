/* To hook up socket, we need to import the http library and the Server
    class from the socket.io library. Although socket.io works with
    Express, we need to have the http library to hook it up.
*/
const http = require('http');
const { Server } = require('socket.io');

// max number of users per lobby;
// stretch goal:
const CAPACITY = 4;

const lobbies = {
    // a *new* lobby object is formatted as:
    // 'lobbyPassword': {
    //     host: 'hostname',
    //     userList: [], //nicknames of each user currently in the lobby
    //     rounds: int,
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

/* This handleChatMessage function takes in a message and "emits" it
    to a specific channel in our socket.io system. Clients can choose to
    subscribe to specific channels, as seen in the /hosted/client.js file.
*/
const handleChatMessage = (msg) => {
    io.emit(msg.channel, msg.message);
};

/*
    
*/
const handleJoinLobby = (password, socket) => {
    // console.log(password);
    // if the password is correct and the lobby exists
    if (lobbies[password]) {
        // AND the room isn't full
        if (!lobbies[password].userList.length < CAPACITY) {
            socket.emit('server-events', {
                id: "failed join",
                message: "Room is full..."
            })
            // put the user in the room
            // tell the server to render the game interface
        } else {
            socket.join(lobbies);
            io.to(`${params.roompass}`).emit('a new user has joined the room');
            socket.emit("server-events", {
                id: "joined room",
                message: "successfully joined room!"
            })
        }
    }
    // room doesn't exist or the user didn't enter a correct password
    else {
        socket.emit('server-events', {
            id: "failed join",
            message: "Incorrect password / Room with password doesn't exist!"
        })
    }
};

// Creates a new lobby object, IF:
const handleCreateLobby = (params, socket) => {
    //   console.log(params.roompass);
    //   console.log(params.gamelength);

    // tell the user a room with the same password exists
    if (lobbies[params.roompass]) {
        console.log("lobby created");
        socket.emit('server-events', {
            id: "failed host",
            message: "A room with the same password already exists!"
        });
    } else {
        socket.join(`${params.roompass}`);
        // broadcast to everyone in the room & save the lobby
        const newLobby = {
            // host: params.user,
            userList: [],
            rounds: params.gamelength,
            capacity: CAPACITY,
            state: 'waiting',
        };

        lobbies[params.roompass] = newLobby;

        io.to(`${params.roompass}`).emit('a new user has joined the room');
    }
};

/* This setup function takes in our express app, adds Socket.IO to it,
    and sets up event handlers for our io events.
*/
const socketSetup = (app) => {
    /* To create our Socket.IO server with our Express app, we first
            need to have the http library create a "server" using our Express
            app as a template. We then hand that server off to Socket.IO which
            will generate for us our IO server.
        */
    const server = http.createServer(app);
    io = new Server(server);

    /* Socket.IO is entirely built on top of an event system. Our server
            can send messages to clients, which trigger events on their side.
            In the same way, clients can send messages to the server, which
            trigger events on our side.
  
            The first event is the 'connection' event, which fires each time a
            client connects to our server. The event returns a "socket" object
            which represents their unique connection to our server.
        */
    io.on('connection', (socket) => {
        console.log('a user connected to the server.');

        /* With the socket object, we can handle events for that specific
                    user. For example, the disconnect event fires when the user
                    disconnects (usually by closing their browser window).
                */
        socket.on('disconnect', () => {
            console.log('a user disconnected');
        });

        /* We can also create custom events. For example, the 'chat message'
                    event name is just one we made up. As long as the client and the
                    server both know to use that name, we can use it.
    
                    Here, whenever the user sends a message in the 'chat message'
                    event channel, we will handle it with handleChatMessage.
                */
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

        socket.on('server-events', (msg) => {
            console.log(msg);
        });
    });

    /* Finally, after our server is set up, we will return it so that we
            can start it in app.js.
        */
    return server;
};

// We only export the one function from this file, just like in router.js
module.exports = { socketSetup, lobbies };
