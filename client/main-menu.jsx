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
    socket.emit('makeLobby', params);

    return false;
}

const attemptChangePassword = (e) => {
    e.preventDefault();

    const oldpass = document.querySelector('#oldpass').value;
    const newpass = document.querySelector('#newpass').value;

    helper.sendPost('/change-pass', { oldpass, newpass });

    return false;
}

const handleMoveToGame = async () => {
    helper.sendPost('/to-game');
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

const AccountPage = (props) => {
    //shows user info and game stats, allows user to delete account too
    return (
        <div id="accountPage">
            <h3>Games Won: {props.accData.wins}</h3>

            <div id="accountControls">

                <button id="changePassword" onClick={() => {
                    ReactDOM.render(<PassChangeForm />,
                        document.getElementById('content'));
                }}>Change Password</button>
                <input 
                checked= {props.accData.premium}
                onChange={(e) => {
                    
                }}>
                    Premium: {`${props.accData.premium}`}
                </input>
            </div>
        </div>
    )
}

const PassChangeForm = (props) => {
    return (
        <div>
            <form id="hostForm"
                name="hostForm"
                onSubmit={attemptChangePassword}
                action="/createRoom"
                method="POST"
            >
                <label htmlFor="oldpass">Old Password: </label>
                <input id="oldpass" type='password' name="oldpass" placeholder='password' />

                <label htmlFor="newpass">New Password: </label>
                <input id="newpass" type='password' name="newpass" placeholder='password' />
                <input type="submit" value="Submit" />

            </form >

            <button id="cancelChange" onClick={() => {
                //re-render the account page, which needs retrieve fro, the database
                const accountInfo = helper.getData('/account').then(response => {
                    ReactDOM.render(<AccountPage accData={response} />,
                        document.getElementById('content'));
                });
            }}>Cancel</button>
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
                <input id="room-pass" type='password' name="password" placeholder='password' />
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
                <input id="room-pass" type='password' name="password" placeholder='password' />
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

    const accountButton = document.querySelector('#viewAccountButton');
    const playButton = document.querySelector('#playButton');

    playButton.onclick = (e) => {
        e.preventDefault();
        ReactDOM.render(
            <MainMenu />,
            document.getElementById('content'));
    }

    accountButton.onclick = async (e) => {
        e.preventDefault();
        helper.getData('/account').then(response => {
            ReactDOM.render(<AccountPage accData={response} />,
                document.getElementById('content'));
        });

        return false;

    }

    //render the main menu screen upon startup 
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
        case "joined room":
        case "created room": {
            handleMoveToGame();
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