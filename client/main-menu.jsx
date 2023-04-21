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

    //helper.sendPost(e.target.action, { roompass });

    return false;
}

const attemptHost = (e) => {
    e.preventDefault();

    const roompass = e.target.querySelector("#room-pass").value;
    const gamelength = e.target.querySelector('#rounds').value;

    const params = {
        roompass,
        gamelength
    }

    //helper.sendPost(e.target.action, { roompass, gamelength });
    socket.emit('makeLobby', params);

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
                <label htmlFor="roundNum">Game Length: </label>
                <input id='rounds' type='text' name='roundNum' placeholder='rounds' />
                <input type="submit" value = "Submit"/>

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
                <input type="submit" value = "Submit"/>
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
    ReactDOM.render(
        <MainMenu />,
        document.getElementById('content'));

}

window.onload = init; 