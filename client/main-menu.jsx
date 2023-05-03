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
    const gamelength = parseInt(document.querySelector('#rounds').value);

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
        <div id="mainMenu" class='columns is-flex-direction-column is-align-items-center columns'>
            <button class='button block is-large is-danger is-outlined column is-fullwidth' id="join" onClick={loadJoinForm}>Join Room</button>
            <button class='button block is-large is-danger is-outlined column is-fullwidth' id="host" onClick={loadHostForm}>Host Room</button>
        </div>
    )
}

const AccountPage = (props) => {
    const [checked, setChecked] = React.useState(props.accData.premium);
    //shows user info and game stats, allows user to delete account too
    return (
        <div id="accountPage" class="container is-flex is-flex-direction-column">
            <div class="title block is-size-1 has-text-centered"> {props.accData.wins}</div>

            <h3 class="subtitle has-text-centered">Games Won</h3>

            <div id="accountControls">

                <button class="button block is-large is-danger is-outlined column is-fullwidth" id="changePassword" onClick={() => {
                    ReactDOM.render(<PassChangeForm />,
                        document.getElementById('content'));
                }}>Change Password</button>

                <label class="checkbox">
                    <label class="subtitle is-size-4 has-text-warning" htmlFor="oldpass">Premium Mode</label>
                    <input class="block" type='checkbox'
                        checked={checked}
                        onChange={async (e) => {
                            const response = await fetch('/setPremium',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ state: e.currentTarget.checked }),
                                });

                            const data = await response.json();
                            setChecked(data.premium);
                        }} />


                </label>
                <h3 class='has-text-centered'>You will get a <span class="icon">
                    <i class="fa-solid fa-crown"></i></span></h3>
            </div>

        </div >
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
                class="columns is-flex is-flex-direction-column"
            >
                <div class='column is-full'>
                    <label class='label has-text-light' htmlFor="oldpass">Old Password: </label>
                    <input class="input column is-full" id="oldpass" type='password' name="oldpass" placeholder='password' /></div>
                <div class='column is-full'>
                    <label class='label has-text-light' htmlFor="newpass">New Password: </label>
                    <input class="input column is-full" id="newpass" type='password' name="newpass" placeholder='password' />
                </div>
                <div class='column is-full'>
                    <div class="columns is-flex is-justify-content-center">
                        <div class="column is-two-fifths">
                            <button class=' button block is-info is-outlined button' id="cancelChange" onClick={() => {
                                //re-render the account page, which needs retrieve fro, the database
                                const accountInfo = helper.getData('/account').then(response => {
                                    ReactDOM.render(<AccountPage accData={response} />,
                                        document.getElementById('content'));
                                });
                            }}>Cancel</button>

                        </div>
                        <div class="column is-two-fifths ">
                            <input class='button block is-primary is-outlined' type="submit" value="Submit" />
                        </div>

                    </div>
                </div>
                <div class="column is-full">
                    <div id="errorDiv" class='hidden'>
                        <h3 class='has-text-danger-dark is-size-4 block'><span id="errorMessage"></span></h3>
                    </div>
                </div>

            </form >


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
                class="columns is-flex is-flex-direction-column"
            >
                <h1 class="title is-size-4">Host a Lobby</h1>
                <div class='columns'>
                    <div class="column is-two-thirds">
                        <label htmlFor="password">Room Password: </label>
                        <input class="input" id="room-pass" type='password' name="password" placeholder='password' />
                    </div>
                    <div class="column is-one-thirds has-text-right">
                        <label htmlFor="rounds">Max Rounds: </label>
                        <div class="select" >
                            <select name="rounds" id='rounds'>
                                <option value={3}>3</option>
                                <option value={5} selected>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                </div>

                <input class="button block is-primary is-outlined" type="submit" value="Submit" />
                <button class="button block is-info is-outlined" id="backtomain" onClick={loadMainMenu}>Back</button>
                <div class="column is-full">
                    <div id="errorDiv" class='hidden'>
                        <h3 class='has-text-danger-dark  is-size-6  block'><span id="errorMessage"></span></h3>
                    </div>
                </div>
            </form >
        </div>

    )
}

const JoinForm = (props) => {
    //form for users to join a room
    //they simply enter the room's password
    return (
        <div>
            <h1 class="title is-size-4">Join a Lobby</h1>
            <h1 class="subtitle">Enter the room's password</h1>

            <form id='joinForm'
                name="joinForm"
                onSubmit={attemptJoin}
                action="/joinRoom"
                method="POST"
                class="columns is-flex is-flex-direction-column"
            >
                <div class='column is-full'>
                    <div class='columns'>
                        <div class='column is-two-thirds'>
                            <input class="input" id="room-pass" type='password' name="password" placeholder='password' />
                        </div>
                        <div class='column is-one-third has-text-right container'>
                            <input class="button block is-primary is-outlined" type="submit" value="Submit" />
                        </div>
                    </div>
                </div>
                <div class='column is-full'>
                    <button id="backtomain" class="button block is-info is-outlined" onClick={loadMainMenu}>Back</button>
                </div>
                <div class='column is-full'>
                    <div id="errorDiv" class='hidden'>
                        <h3 class='has-text-danger-dark is-size-6 block'><span id="errorMessage"></span></h3>
                    </div>
                </div>

            </form>

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