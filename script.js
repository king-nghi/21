document.addEventListener('DOMContentLoaded', function () {
    const deckInput = document.getElementById('deck-input');
    const enterDecksButton = document.getElementById('deck-count');
    const balanceInput = document.getElementById('balance-input');
    const setBalanceButton = document.getElementById('set-balance');
    const betInput = document.getElementById('bet-input');
    const placeBetButton = document.getElementById('place-bet');
    const startGameButton = document.getElementById('start-game');
    const resetGameButton = document.getElementById('reset-game');
    const dealNewHandsButton = document.getElementById('deal-new-hands');
    const toggleCountsButton = document.getElementById('toggle-counts');
    const toggleCardsPlayedButton = document.getElementById('toggle-cards-played');
    const hitButton = document.getElementById('hit-button');
    const standButton = document.getElementById('stand-button');
    const splitButton = document.getElementById('split-button');

    enterDecksButton.addEventListener('click', setDecks);
    setBalanceButton.addEventListener('click', setBalance);
    placeBetButton.addEventListener('click', placeBet);
    startGameButton.addEventListener('click', startGame);
    resetGameButton.addEventListener('click', resetGame);
    dealNewHandsButton.addEventListener('click', dealNewHands);
    toggleCountsButton.addEventListener('click', toggleCounts);
    toggleCardsPlayedButton.addEventListener('click', toggleCardsPlayed);
    hitButton.addEventListener('click', hit);
    standButton.addEventListener('click', stand);
    splitButton.addEventListener('click', split);
});

let decks = 1;
let deck = [];
let playerHands = [];
let dealerHand = [];
let runningCount = 0;
let trueCount = 0;
let cardsPlayed = {};
let gameOver = false;
let balance = 100;
let betAmount = 0;
let countVisible = false;
let cardsPlayedVisible = false;
let playerTurn = true;
let activeHandIndex = 0;
let holeCardRevealed = false;

function createDeck() {
    const suits = ['♠', '♣', '♦', '♥'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    for (let i = 0; i < decks; i++) {
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ suit, rank });
            }
        }
    }
}

function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function dealCard() {
    // Ensure the deck has cards left to deal
    if (deck.length === 0) {
        alert('Deck is empty, reshuffling...');
        shuffleDeck();  // Shuffle the deck if it's empty
    }
    
    return deck.pop();  // Deal the top card from the deck
}


function startGame() {
    if (balance <= 0) {
        alert('You have run out of balance! Please reset the game.');
        return;
    }
    gameOver = false;
    deck = [];
    playerHands = [];  // Now tracks multiple hands
    dealerHand = [];   // Clear dealer's hand
    runningCount = 0;
    trueCount = 0;
    cardsPlayed = {};
    createDeck();
    shuffleDeck();
    playerHands.push([dealCard(), dealCard()]);  // Start with a single hand
    dealerHand.push(dealCard(), dealCard());    // Dealer also gets two cards
    renderHands();
    updateCount();
}


function resetGame() {
    balance = parseFloat(document.getElementById('balance-input').value) || 100;
    betAmount = 0;
    gameOver = false;
    setDecks();
    playerHands = [];
    dealerHand = [];
    runningCount = 0;
    trueCount = 0;
    cardsPlayed = {};
    countVisible = false;
    cardsPlayedVisible = false;
    document.getElementById('cards-played').innerHTML = '';
    document.getElementById('bet-input').value = '';
    document.getElementById('count-info').innerHTML = '';
    document.getElementById('balance').innerText = balance;
    document.getElementById('bet').innerText = betAmount;
    renderHands();
}

function renderHands() {
    // Render the player's hands
    document.getElementById('player-hand').innerHTML = playerHands.map((hand, handIndex) =>
        `<div class="split-hand">
            ${hand.map((card, index) => 
                `<div class="card" style="margin-left: ${index * 20}px; background: ${getCardBackground(card)};">
                    <span>${card.rank}${card.suit}</span>
                </div>`
            ).join('')}
        </div>`
    ).join('');

    // Swap the dealer's hole card with the first card
    if (!holeCardRevealed) {
        [dealerHand[0], dealerHand[1]] = [dealerHand[1], dealerHand[0]];
    }

    // Render the dealer's hand
    let dealerHandHTML = 'Dealer Hand: ';
    dealerHandHTML += dealerHand.map((card, index) => {
        if (index === 0 && !holeCardRevealed) {
            // Show the hole card as a question mark
            return `<div class="card hole-card">
                        <span class="question-mark">?</span>
                    </div>`;
        } else {
            // Show the other cards
            return `<div class="card" style="margin-left: ${index * 20}px; background: ${getCardBackground(card)};">
                        <span>${card.rank}${card.suit}</span>
                    </div>`;
        }
    }).join('');

    document.getElementById('dealer-hand').innerHTML = dealerHandHTML;
}

function setActiveHand(handIndex) {
    activeHandIndex = handIndex;
    renderHands();
}

function hit() {
    if (!gameOver) {
        const hand = playerHands[activeHandIndex];  // Get the current hand
        hand.push(dealCard());  // Deal a card to the current hand
        renderHands();
        updateCount();

        // Check if the current hand has busted
        if (getHandValue(hand) > 21) {
            alert('You have busted!');
            activeHandIndex++;  // Move to the next hand
            if (activeHandIndex >= playerHands.length) {
                endGame();
            }
        }
    }
}

function stand() {
    if (!gameOver) {
        // Move to the next hand
        activeHandIndex++;

        if (activeHandIndex >= playerHands.length) {
            // If all hands have been played, end the player's turn
            endGame();
        }
    }
}

function split() {
    if (balance < betAmount) {
        alert('You do not have enough balance to split your hand!');
        return;
    } // Double the bet

    balance -= betAmount;  // Deduct the bet from the balance
    betAmount *= 2;        
    document.getElementById('bet').innerText = betAmount;  // Update displayed bet

    const hand = playerHands[activeHandIndex];  // Get the current hand

    if (hand.length !== 2 || hand[0].rank !== hand[1].rank) {
        alert('You can only split when you have two cards of the same rank!');
        return;
    }

    // Create two hands from the split
    const newHand = [hand.shift()]; // Take one card out of the original hand
    playerHands.push(newHand); // Add the new hand

    // Add a card to both hands after split
    hand.push(dealCard());
    newHand.push(dealCard());

    // Update the UI to display the split hands
    renderHands();
    updateCount();
}

function endGame() {
    gameOver = true;
    
    // Calculate values for player hands (in case of splits)
    let playerValue = playerHands.reduce((acc, hand) => acc + (getHandValue(hand) <= 21 ? getHandValue(hand) : 0), 0);
    
    // Calculate dealer hand value
    let dealerValue = getHandValue(dealerHand);

    // Dealer's turn (dealer must hit if under 17)
    while (dealerValue < 17) {
        dealerHand.push(dealCard());  // Dealer draws a card
        dealerValue = getHandValue(dealerHand);  // Recalculate hand value
    }

    // Reveal the dealer's hole card after determining the winner
    holeCardRevealed = true;
    renderHands();  // Ensure the dealer's hand is updated after their turn

    // Determine result
    let message = '';
    if (playerValue > 21) {
        message = 'Player busts! Dealer wins!';
        balance -= betAmount;
    } else if (dealerValue > 21) {
        message = 'Dealer busts! Player wins!';
        balance += betAmount * 2;
    } else if (dealerValue > playerValue) {
        message = 'Dealer wins!';
        balance -= betAmount;
    } else if (playerValue > dealerValue) {
        message = 'Player wins!';
        balance += betAmount * 2;
    } else {
        message = 'It\'s a tie!';
    }

    // Show the result and update balance
    alert(message);
    document.getElementById('balance').innerText = balance;
    updateCount(); // Update count after game ends
}

function getHandValue(hand) {
    let value = 0;
    let numAces = 0;
    for (let card of hand) {
        if (card.rank === 'A') {
            numAces++;
            value += 11;  // Initially count Ace as 11
        } else if (['J', 'Q', 'K'].includes(card.rank)) {
            value += 10;  // Face cards count as 10
        } else {
            value += parseInt(card.rank);  // Number cards
        }
    }

    // Adjust value for aces if necessary
    while (value > 21 && numAces > 0) {
        value -= 10;  // Convert an Ace from 11 to 1
        numAces--;
    }

    return value;
}


function updateCount(includeHoleCard = false) {
    // Reset running count for each game
    runningCount = 0;

    // Update running count
    for (let card of playerHands.concat(dealerHand)) {
        // Skip counting the "?" card unless specified to include
        if (card.rank !== '?' && !(card.rank === dealerHand[0].rank && includeHoleCard)) {
            switch (card.rank) {
                case '2' || '3' || '4' || '5' || '6':
                    runningCount++;
                    break;
                case '10' || 'J' || 'Q' || 'K' || 'A':
                    runningCount--;
                    break;
                default:
                    break;
            }
        }
    }

    // Count each card played in the current hand
    const cardKey = card => `${card.rank}${card.suit}`;
    const cardsPlayedThisHand = {}; // Track cards played in the current hand
    for (let card of playerHands.concat(dealerHand)) {
        const key = cardKey(card);
        if (!cardsPlayedThisHand[key]) {
            cardsPlayedThisHand[key] = 1; // Count each card only once
        }
    }

    // Merge cardsPlayedThisHand into cardsPlayed, adjusting counts based on the number of decks
    for (let key in cardsPlayedThisHand) {
        if (cardsPlayedThisHand.hasOwnProperty(key)) {
            cardsPlayed[key] = Math.min((cardsPlayed[key] || 0) + cardsPlayedThisHand[key], decks); // Limit count to decks value
        }
    }

    // Render cards played and count information
    renderCardsPlayed();
    renderCountInfo();
}

// Reset cardsPlayed after each game
function resetCardsPlayed() {
    cardsPlayed = {};
}

function renderCardsPlayed() {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♣', '♦', '♥'];
    const cardKey = card => `${card.rank}${card.suit}`;
    const cardsPlayedHTML = 
    suits.map(
        suit => `<div class="card-row">${ranks.map(
            rank => {
                const key = cardKey({ rank, suit });
                const count = cardsPlayed[key] || 0;
                const suitColor = suit === '♦' || suit === '♥' ? 'red' : 'darkgrey';
                const bgColor = `linear-gradient(45deg, ${suitColor}, rgba(0, 0, 0, 0.8))`;
                return `<div class="card-played" style="background: ${bgColor};"><strong>${count}<sub>${rank}${suit}</sub></strong></div>`;
            }
        ).join('')}</div>`
    ).join('');
    document.getElementById('cards-played').innerHTML = cardsPlayedVisible ? cardsPlayedHTML : '';
}

function renderCountInfo() {
    const countInfoHTML = `
        Running: ${runningCount}<br>
        True: ${trueCount}<br>
        Card: ${deck.length}
    `;
    document.getElementById('count-info').innerHTML = countVisible ? countInfoHTML : '';
}

function toggleCounts() {
    countVisible = !countVisible;
    renderCountInfo();
}

function toggleCardsPlayed() {
    cardsPlayedVisible = !cardsPlayedVisible;
    renderCardsPlayed();
}

function getCardBackground(card) {
    const suits = ['♠', '♣', '♦', '♥'];
    const suitColor = suits.indexOf(card.suit) < 2 ? 'darkgrey' : 'red';
    return `linear-gradient(45deg, ${suitColor}, rgba(0, 0, 0, 0.8))`;
}

function setDecks() {
    decks = parseInt(document.getElementById('deck-input').value) || 1;
    startGame();
}

function setBalance() {
    balance = parseFloat(document.getElementById('balance-input').value) || 100;
    document.getElementById('balance').innerText = balance;
}

function placeBet() {
    const inputBet = parseFloat(document.getElementById('bet-input').value);
    if (inputBet <= balance) {
        betAmount = inputBet;
        balance -= betAmount;
        document.getElementById('bet').innerText = betAmount;
        document.getElementById('balance').innerText = balance;
    } else {
        alert('Bet amount exceeds balance!');
    }
}

function dealNewHands() {
    // Reset player and dealer hands and game state
    playerHands = [];  // Reset player's hands (in case of splits)
    dealerHand = [];   // Reset dealer's hand
    holeCardRevealed = false;  // Hide dealer's hole card initially
    gameOver = false;  // Reset game over state

    // Deal two cards to the player and the dealer
    playerHands.push([dealCard(), dealCard()]);  // Player gets one hand with two cards
    dealerHand.push(dealCard(), dealCard());  // Dealer gets two cards

    console.log('Player Hands:', playerHands);
    console.log('Dealer Hand:', dealerHand);

    // Render hands
    renderHands();  // Make sure this renders both the player and dealer hands

    // Optionally, you can set up initial game logic for betting here
    updateCount(); // Update the count with the new cards
}
