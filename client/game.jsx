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
        case "initialize game": {
            ReactDOM.render(<GameInterface />,
                document.getElementById('main'));


            //tell the socket server that the game has rendered 
            //and that the game logic can now be kickstarted
            socket.emit('user event', {
                user_event: 'game rendered'
            });
            break;

        }
        case "render game state": {
            ReactDOM.render(<GameInterface
                roundNum={event.currentRound}
                shownPrompt={event.prompt}
                judgeName={event.judgeName}
            />, document.getElementById('main'));


        }

        case "you become judge": {
            //render the cards in the player's hand
            ReactDOM.render(<JudgeWaitingUI />,
                document.getElementById('controls'));
            break;
            break;
        }

        case "start picking cards": {
            //render the cards in the player's hand
            ReactDOM.render(<PlayerHand cards={event.cards} />,
                document.getElementById('controls'));
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
const GameInterface = (props) => {
    //gameplay screen
    return (
        <div id="gameplayScreen">
            <div class="roundTracker">
                <h3>Round {props.roundNum}</h3>
            </div>
            <div class="judgeTracker">Prepare your answer for {props.judgeName}</div>
            <div class="promptContainer">
                <div id="prompt">{props.shownPrompt}</div>
            </div>
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
    let i = 0;
    const usersAsHTML = props.users.map(user => {
        i++;
        //id will affect the item's color
        return (<li id={`p${i}`}><h3>{user}</h3></li>)
    });

    return (
        <ul id="userList">
            {usersAsHTML}
        </ul>
    )
}


const PlayerHand = (props) => {
    //format cards as radio buttons
    const cardsAsHTML = props.cards.map(card => {
        console.log(card);
        return (
            <label class="container">
                <input type="radio" name="card_to_submit" value={card} />
                {card}
            </label>
        )
    })

    return (
        <div id="hand">
            <div id='cards'>
                {cardsAsHTML}
            </div>
            <div id = "submit-container">
                <button id='submitCard'>Submit</button>
            </div>
        </div>

    )
}

const JudgeWaitingUI = () => {
    return (
        <h3>Players are preparing...</h3>
    )
}

const JudgePickUI = () => {
    <div id='judgeScreen'>
        <div id='submissions'>

        </div>
        <button id="confirm">
            Confirm
        </button>

    </div>


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