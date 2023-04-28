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

        //when a user is put into the room
        case 'you joined': {
            ReactDOM.render(<StatusMessage
                message="Waiting for all players to ready up..." />,
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
        case "render game state": {
            ReactDOM.render(<GameInterface
                roundNum={event.currentRound}
                shownPrompt={event.prompt}
                judgeName={event.judgeName}
            />, document.getElementById('main'));
        }

        //render the judge's ui for their hand 
        case "you become judge": {
            //render the cards in the player's hand
            ReactDOM.render(<StatusMessage
                message="Waiting for players to submit..." />,
                document.getElementById('controls'));
            break;
        }

        case 'show winner': {
            ReactDOM.render(<EndRoundScreen
                winnerName={event.winnerName}
                prompt={event.prompt}
                answer={event.answer} />, document.getElementById('main'));

            ReactDOM.render(<WaitingControls ready={false} />,
                document.getElementById('controls'));
            break;
        }
        //present the user their hand of response cards
        case "start picking cards": {
            //render the cards in the player's hand
            ReactDOM.render(<PlayerHand cards={event.cards} />,
                document.getElementById('controls'));
            break;

        }
        //present judge each player's responses
        case 'wait for the judge': {
            ReactDOM.render(<StatusMessage
                message="Waiting for the judge to decide..." />,
                document.getElementById('controls'));
            break;
        }
        case 'pick a winner': {
            ReactDOM.render(<JudgePickUI choices={event.choices} />,
                document.getElementById('controls'));
            break;
        }
        //whenever a user submits a card, reflect this on the user list
        case 'user submitted': {

            break;
        }
        //control to start the next round (beyond first)
        case 'ready up for next round': {
            ReactDOM.render(<WaitingControls ready={false} />,
                document.getElementById('controls'));
            break;
        }
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

const StatusMessage = (props) => {
    //when the user doesn't have any actions yet, 
    //just display a message
    return (
        <h3 class='status'>{props.message}</h3>
    )

}

const EndRoundScreen = (props) => {
    return (
        <div id="endRound_container">
            <h3>{props.winnerName} won the round!</h3>
            <h3>Prompt: {props.prompt}</h3>
            <h3>A: {props.answer}</h3>
        </div>
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
        return (
            <label class="container">
                <input type="radio" name="card_to_submit" value={`${card}`} />
                {card}
            </label>
        )
    })

    //tbd useEffect to grab checked radio button
    return (
        <div id="hand">
            <div id='cards'>
                {cardsAsHTML}
            </div>
            <div id="submit-container">
                <button id='submitCard' onClick={(e) => {
                    socket.emit('user event', {
                        user_event: 'player presented a card',
                        chosenCard: document.querySelector('#cards input:checked').value
                    })
                }
                }>Submit</button>
            </div>
        </div>

    )
}

const JudgePickUI = (props) => {
    //format submissions as radio buttons
    const choicesAsHTML = props.choices.map(choice => {
        return (
            <label class="container">
                <input type="radio" name="submitted_response"
                    value={`${choice.name}`}
                    data-choice={`${choice.submitted}`} />{choice}
            </label>
        )
    });

    return (
        <div id='judgeScreen'>
            <div id='submissions'>
                {choicesAsHTML}
            </div>
            <button id="confirm" onClick={() => {
                socket.emit('user event', {
                    user_event: 'judge decided',
                    cardText: document.querySelector('#submissions input:checked').dataset.choice,
                    winner: document.querySelector('#submissions input:checked').value
                })
            }}>
                Confirm
            </button>

        </div>
    )
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

const EndScreen = (props) => {
    return (
        <div id="winScreen">
            <h3>The winner is...</h3>
        </div>
    )
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