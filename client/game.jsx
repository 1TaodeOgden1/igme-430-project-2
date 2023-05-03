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
        case 'wait for other players': {
            ReactDOM.render(<StatusMessage
                message="Wait for other players to submit." />,
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
            {
                ReactDOM.render(<PlayerList users={event.userList} />,
                    document.getElementById('user_container'));
                break;
            }
        case 'another user left': {
            ReactDOM.render(<PlayerList users={event.userList} />,
                document.getElementById('user_container'));
            ReactDOM.render(<StatusMessage message={event.message} />,
                document.getElementById('main'));
        }
        //when the final round is completed
        case 'game over': {
            ReactDOM.render(<EndGameScreen
                prompt={event.prompt}
                winner={event.winner}
                answer={event.answer} />,
                document.getElementById('main'));

            ReactDOM.render(<StatusMessage message="Game's over!" />,
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
        <div id="gameplayScreen" class='container is-flex is-flex-direction-column'>
            <div class="roundTracker">
                <h1 class="is-size-6">Round {props.roundNum}</h1>
            </div>
            <div class="judgeTracker is-size-5">Prepare your answer for {props.judgeName}.</div>
            <div class="promptContainer">
                <h1 id="prompt" class='title has-text-centered'>{props.shownPrompt}</h1>
            </div>
        </div>
    )
}

const StatusMessage = (props) => {
    //when the user doesn't have any actions yet, 
    //just display a message
    return (
        <div>
            <h3 class='is-size-4'>{props.message}</h3>
        </div>
    )

}

const EndRoundScreen = (props) => {
    return (
        <div id="endRound_container" class='container is-flex is-flex-direction-column'>
            <h3>{props.winner} won the round!</h3>
            <h3 class='is-size-3 has-text-centered'>{props.prompt}</h3>
            <h3 class='is-size-4 has-text-centered'>A: {props.answer}</h3>
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

        let crownDiv = (<div hidden></div>);

        if (props.users[user].premium) {
            crownDiv = <span class="icon">
                <i class="fa-solid fa-crown"></i>
            </span>
        }

        usersAsHTML.push(
            <li class='columns'>
                <div id={`p${i}`} class='column is-one-fith has-text-centered'>
                    <h2 class='has-text-weight-semibold'>{props.users[user].score}</h2>
                </div>
                <div class='column is-four-fifths'>
                    <h2 class=''>{Object.keys(props.users)[i]} {crownDiv} - {props.users[user].status}</h2>
                </div>
            </li>);
    }

    return (
        <ul id="userList" class="container m-4">
            <div class='block'>
                <button class='button is-danger is-light' id="leaveButton" onClick={HandleLeaveGame}>
                    Leave Game</button>
            </div>
            {usersAsHTML}
        </ul>

    )
}

const PlayerHand = (props) => {
    //format cards as radio buttons
    const cardsAsHTML = props.cards.map(card => {
        return (
            <label class="radio is-flex mb-1" id="card">
                <input class='mr-2' type="radio" name="card_to_submit" value={`${card}`} />
                <h3 class='is-size-6'>{card}</h3>
            </label>
        )
    });

    //tbd useEffect to grab checked radio button
    return (
        <div class='columns'>
            <div id='cards' class='block column is-three-quarters'>
                <div class='is-flex is-flex-wrap-wrap'>
                    {cardsAsHTML}
                </div>
            </div>

            <button class='button block is-primary is-outlined column is-one-fifth' id='submitCard' onClick={(e) => {
                socket.emit('user event', {
                    user_event: 'player presented a card',
                    chosenCard: document.querySelector('#cards input:checked').value
                })
            }
            }>Submit</button>
        </div>


    )
}

const JudgePickUI = (props) => {
    //format submissions as radio buttons
    const choicesAsHTML = props.choices.map(choice => {
        return (
            <label class="radio is-flex mb-1 block" id="card">
                <input class='mr-2' type="radio" name="submitted_response" value={`${choice.name}`} data-choice={`${choice.submitted}`} />
                <h3 class='is-size-6'>{choice.submitted}</h3>
            </label>

        )
    });
    return (
        <div id='judgeScreen'>
            <div id='submissions'>
                {choicesAsHTML}
            </div>

            <button class='button block is-primary is-outlined' id="confirm" onClick={(e) => {
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
            <button id="readyButton" class='button is-large is-warning has text-black m-auto'
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
            <button id="readyButton" class='button is-large is-success has text-black m-auto'
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
        < div id="winScreen" class='container is-flex is-flex-direction-column' >
            <h1 class='title has-text-centered'>{props.winner} won the game!</h1>
            <h2 class='is-size-5 has-text-centered'>{props.prompt}</h2>
            <h3 class='is-size-6 has-text-centered'>A: {props.answer}</h3>
        </div >
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