const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');
const socket = io();

//reference to the currently logged-in user account 
let account = {};

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
    //const user  = account.username;

    const params = {
        
        roompass,
        gamelength,
        //user
    }

    //helper.sendPost(e.target.action, { roompass, gamelength });
    socket.emit('makeLobby', params);

    return false;
}

//handles messages sent to the 'server-messsages' channel and triggers
//client-side changes based on it 
const handleMessage = (msg) => {
    console.log(msg);
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
    //save the account 
    account = helper.getAccount().currentAccount; 
    //console.log(account);
    ReactDOM.render(
        <MainMenu />,
        document.getElementById('content'));

    //grab the user's account info to be stored and displayed
    //put the user in their own'server messages' socket channel. 
    //needed to handle errors / status messages from io.js
    socket.on(`server-messages_prelobby`, handleMessage);
    // socket.on(`server-messages_${account.username}`, handleMessage);
    socket.emit('event message', 
    {
        channel: 'server-messages_prelobby', 
        messsage: 'player entered server events channel'
    });

}

window.onload = init; 