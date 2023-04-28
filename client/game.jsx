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
        //when a user is put into the room
        case 'you joined': {
            ReactDOM.render(<WaitingInterface />,
                document.getElementById('main'));
            ReactDOM.render(<WaitingControls ready={false} />,
                document.getElementById('controls'));
            ReactDOM.render(<PlayerList users={event.userList} />,
                document.getElementById('user_container'));
            break;
        }
        //when another user joins, update everyone's DOMs 
        case 'another user joined': {
            ReactDOM.render(<PlayerList users={event.userList} />,
                document.getElementById('user_container'));
            break;
        }
        /*GAME EVENTS*/
    }
}

//REACT EVENTS 



//REACT COMPONENTS
const GameInterface = () => {
    //gameplay screen
    return (
        <div id="gameplayScreen">
            <h3>There's nothing here...for now!</h3>
        </div>
    )
}

const WaitingInterface = (props) => {
    //waiting room screen
    return (
        <h3>Waiting for all players to ready up...</h3>
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
    const [isReady, toggleReady] = React.useState(props.ready);

    if (isReady) {
        return (
            <button id="readyButton"
                onClick={() => {
                    toggleReady(props.ready);
                    socket.emit('user event', {
                        user_event: 'unreadied'
                    });
                }}>
                Cancel
            </button>
        )

    }
    else {
        return (
            <button id="readyButton"
                onClick={() => {
                    toggleReady(!props.ready)
                    socket.emit('user event', {
                        user_event: 'readied'
                    });
                }}
            >
                Ready
            </button>
        )

    }

}

const readyGame = () => {

}

const init = () => {
    //we listen to the socket server to tell us what to render
    socket.on('server-events', handleSocketEvent);

    //now tell the server that the user has finally joined the game 
    //and to render the initial screen
    socket.emit('user event', {
        user_event: 'entered room'
    });
}


window.onload = init; 