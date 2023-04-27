const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');
const socket = io();


//SOCKET EVENTS
const handleSocketEvent = (event) => {
    switch (event.id) {

        /*WAITING ROOM EVENTS*/

        //when websockets has created a game instance inside the server, the 
        //game compoenents are rendered
        case "game initialized": {
            ReactDOM.render(<GameInterface />,
                document.getElementById('main'));
            //render each person's hand
            ReactDOM.render(<PlayerHand />,
                document.getElementById('controls'));
            break;
        }
        case "render game state": {
            break;
        }
        case "assigned": {
            break;
        }
        //when a user is put into the room
        case 'user joined': {
            ReactDOM.render(<WaitingInterface isHost={event.isHost} />,
                document.getElementById('main'));
            ReactDOM.render(<WaitingControls isHost={event.isHost} />,
                document.getElementById('controls'));
            ReactDOM.render(<PlayerList users={event.userList} />,
                document.getElementById('user_container'));
            break;
        }
        /*GAME EVENTS*/
    }
}

//REACT EVENTS 
const startGame = () => {
    //tells socket server host has started the game
    socket.emit('user event', {
        user_event: "started game"
    });
}

//REACT COMPONENTS
const GameInterface = () => {
    //gameplay screen
    return (
        <div id="gameplayScreen">
            <h3>There's nothing here...for now!</h3>
        </div>
    )
}

const WaitingInterface = () => {
    //waiting room screen
    return (
        <h3>Waiting for the host to start...</h3>
    )
}

const PlayerList = (props) => {
    //simple block list of users in lobby
    const usersAsHTML = props.users.map(user =>
    (
        <li>{user}</li>
    ));
    return (
        <ul>
            {usersAsHTML}
        </ul>
    )
}


const PlayerHand = () => {
    return (
        <h3>Your hand would be here</h3>
    )
}

const JudgeWaitingUI = () => {

}

const JudgePickUI = () => {

}

const WaitingControls = (props) => {
    if (props.isHost) {
        return (
            <button id="startButton" onClick={startGame}>Start Game</button>
        )

    }
    return (
        <h3>Your hand of cards will show here!</h3>
    )
}

const init = () => {
    //we listen to the socket server to tell us what to render
    socket.on('server-events', handleSocketEvent);

    //now tell the server that the user has finally joined the game 
    //and to render the initial screen
    socket.emit('user event', {
        user_event: "entered room"
    });
}


window.onload = init; 