const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');
const socket = io();

//the 'start' menu of the application
//players create and join games here

//sends a password attempt to the server, 
//which should send the player to the room / socket only if
//the room with the entered password exists & the room isn't full (cap = 4)
const attemptJoin = (e) => {
    e.preventDefault();

    const roompass = e.target.querySelector('#room-pass').value;

    //send the password to the socket code in the server
    socket.emit('joinLobby', roompass);

    return false;
}

const attemptHost = (e) => {
    e.preventDefault();

    const roompass = document.querySelector("#room-pass").value;
    const gamelength = document.querySelector('#rounds').value;

    const params = {
        roompass,
        gamelength,
    }

    //helper.sendPost(e.target.action, { roompass, gamelength });
    socket.emit('makeLobby', params);

    return false;
}

const handleMoveToGame = async (params) => {
    helper.sendPost('/to-game', params);
    return false;
}

const MainMenu = (props) => {
    //main menu
    return (
        <div id="mainMenu">
            <button id="join" onClick={loadJoinForm}>Join Room</button>
            <button id="host" onClick={loadHostForm}>Host Room</button>
        </div>
    )
}

const StorePage = (props) => {
    //stretch goal
}

const AccountPage = (props) => {
    //shows user info and game stats, allows user to delete account too
    return (
        <div id="accountPage">
            <h2>Hello, Username!</h2>
            <h3>Games Won: #</h3>

            <div id="accountControls">
                <button id="deleteAccount">Delete Account</button>
            </div>
        </div>
    )
}

const HostForm = (props) => {
    //form for users to create a lobby
    //they must enter how many rounds the game will last +
    //the room's password (must be unique)
    return (
        <div>
            <form id="hostForm"
                name="hostForm"
                onSubmit={attemptHost}
                action="/createRoom"
                method="POST"
            >
                <label htmlFor="password">Room Password: </label>
                <input id="room-pass" type='text' name="password" placeholder='password' />
                <label htmlFor="rounds">Game Length: </label>
                <select name="rounds" id="rounds">
                    <option value='3'>3</option>
                    <option value=" 5" selected>5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
                <input type="submit" value="Submit" />

            </form >
            <div id="errorMessage"></div>
            <button id="backtomain" onClick={loadMainMenu}>Back</button>
        </div>

    )
}

const JoinForm = (props) => {
    //form for users to join a room
    //they simply enter the room's password
    return (
        <div>
            <form id='joinForm'
                name="joinForm"
                onSubmit={attemptJoin}
                action="/joinRoom"
                method="POST"
            >
                <label htmlFor="password">Room Password: </label>
                <input id="room-pass" type='text' name="password" placeholder='password' />
                <input type="submit" value="Submit" />
            </form>
            <div id="errorMessage"></div>
            <button id="backtomain" onClick={loadMainMenu}>Back</button>
        </div>
    )

}

const loadJoinForm = () => {
    ReactDOM.render(<JoinForm />, document.getElementById('content'));
}

const loadHostForm = () => {
    ReactDOM.render(<HostForm />, document.getElementById('content'));
}

const loadMainMenu = () => {
    ReactDOM.render(<MainMenu />, document.getElementById('content'));
}

//load the main root menu when first loading up the page 
const init = () => {
    ReactDOM.render(
        <MainMenu />,
        document.getElementById('content'));

    //grab the user's account info to be stored and displayed
    //put the user in their own'server messages' socket channel. 
    //needed to handle errors / status messages from io.js
    socket.on('server-events', handleSocketEvent);

}

//handles event data sent to the 'server-event' channel and triggers
//client-side changes based on it 
const handleSocketEvent = (event) => {
    switch (event.id) {
        //send the user to the game interface as a player
        case "joined room": {
            handleMoveToGame({
                name: helper.getData('/getAccount').nickname,
                isHost: false,
            });
            break;
        }
        //send the user to the game interface as the host
        case "created room": {
            handleMoveToGame({
                name: helper.getData('/getAccount').nickname,
                isHost: true,
            });

            break;
        }
        //returns an error message
        case "failed join":
        case "failed host": {
            document.querySelector("#errorMessage").textContent = event.message;
            break;
        }
    }
}

window.onload = init; 