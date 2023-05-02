const helper = require('./helper.js');
const React = require('react');
const ReactDOM = require('react-dom');
const socket = io();


//OTHER EVENTS
const HandleLeaveGame = () => {
    window.location = '/main-menu';
    return false;
}
//SOCKET EVENTS
const handleSocketEvent = (event) => {
    switch (event.id) {

        /*WAITING ROOM EVENTS*/

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

            ReactDOM.render(<PlayerList users={event.userList} />,
                document.getElementById('user_container'));
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
                winner={event.winner}
                prompt={event.prompt}
                answer={event.answer} />, document.getElementById('main'));

            //ready button to start next round
            ReactDOM.render(<WaitingControls ready={false} />,
                document.getElementById('controls'));

            //update the score 
            ReactDOM.render(<PlayerList users={event.userList} />,
                document.getElementById('user_container'));
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
        //whenever the userList in the server's lobby object updates, 
        //reflect this in the PlayerList component
        case 'user submitted':
        case 'player readied':
        case 'player unreadied':
        case 'another user left':
            {
                ReactDOM.render(<PlayerList users={event.userList} />,
                    document.getElementById('user_container'));
                break;
            }
        //when the final round is completed
        case 'game over': {
            ReactDOM.render(<EndGameScreen
                prompt={event.prompt}
                winner={event.winner} 
                answer={event.answer}/>,
                document.getElementById('main'));

            ReactDOM.render(<StatusMessage message = "Game's over!"/>,
                document.getElementById('controls'));
            break;
        }
        //control to start the next round (beyond first)
        case 'ready up for next round': {
            ReactDOM.render(<WaitingControls ready={false} />,
                document.getElementById('controls'));
            break;
        }
        case 'redirect': {
            HandleLeaveGame();
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
            <div class="judgeTracker">Prepare your answer for {props.judgeName}.</div>
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
        <div>
            <h3 class='status'>{props.message}</h3>
        </div>

    )

}

const EndRoundScreen = (props) => {
    return (
        <div id="endRound_container">
            <h3>{props.winner} won the round!</h3>
            <h3>{props.prompt}</h3>
            <h3>A: {props.answer}</h3>
        </div>
    )
}
const PlayerList = (props) => {
    //simple block list of users in lobby
    let i = -1; //iterating starts at -1 since we have to increment before
    //the return statement
    let usersAsHTML = [];

    for (let user in props.users) {
        //id will affect the item's color
        i++;
        usersAsHTML.push(
            <li id={`p${i}`}>
                <h3>{Object.keys(props.users)[i]}</h3>
                <h2>{props.users[user].score}</h2>
                <h2>{props.users[user].status}</h2>
            </li>);
    }

    return (
        <ul id="userList">
            <button id="leaveButton" onClick={HandleLeaveGame}>
                Leave Game</button>
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
    });

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
                    data-choice={`${choice.submitted}`} />{choice.submitted}
            </label>
        )
    });
    return (
        <div id='judgeScreen'>
            <div id='submissions'>
                {choicesAsHTML}
            </div>
            <button id="confirm" onClick={(e) => {
                const cardText = document.querySelector('#submissions input:checked').dataset.choice;
                const winner = document.querySelector('#submissions input:checked').value
                if (cardText && winner) {
                    socket.emit('user event', {
                        user_event: 'judge decided',
                        cardText,
                        winner
                    })
                }
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

const EndGameScreen = (props) => {
    return (
        <div id="winScreen">
            <h1>The winner is {props.winner}</h1>
            <h2>{props.prompt}</h2>
            <h2>A: {props.answer}</h2>
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