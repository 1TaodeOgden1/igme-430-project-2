const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');
const socket = io();


//SOCKET EVENTS
const handleSocketEvent = (event) => {
    switch (event.id) {
        //waiting room events

        //when the host clicks the start button
        case "host started game": {
            ReactDOM.render(<GameInterface/>,
            document.getElementById('main'));
            
            socket.emit('game started');
            break;
        }
        //when a user is put into the room,as soon as they enter this page
        case "assigned": {
            ReactDOM.render(<WaitingInterface isHost={event.isHost} />,
                document.getElementById('main'));
            ReactDOM.render(<WaitingControls isHost={event.isHost} />,
                document.getElementById('controls'));
            break;
        }
        //game events

    }
}

//REACT EVENTS 
const startGame = () => {
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
    return (
        <ul>
            <li class="playerSlot" id="p1">
                if(props.player1){
                    <h3>props.player1</h3>
                }
            </li>
            <li class="playerSlot" id="p2">

            </li>
            <li class="playerSlot" id="p3">

            </li>
            <li class="playerSlot" id="p4">

            </li>
        </ul>
    )
}

const PlayerHand = () => {

}

const JudgeWaitingUI = () => {

}

const JudgePickUI = () => {

}

const WaitingControls = (props) => {
    if (props.isHost) {
        return (
            <button id="startButton" onClick = {startGame}>Start Game</button>
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