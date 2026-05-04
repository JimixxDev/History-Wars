// Variables globales
let gameInterval;

const gameState = {
    id: new URLSearchParams(window.location.search).get("id"),
    playerNum: new URLSearchParams(window.location.search).get("player"),
    distributed: false,
    resolvingTurn: false,
};

const events = {
    "waiting": "Les 2 joueurs doivent poser une carte",
    "waiting_p1": "En attente de Joueur 1...",
    "waiting_p2": "En attente de Joueur 2...",
    "playing": "Affrontement en cours...",
    "p1_win": "Joueur 1 remporte le tour !",
    "p2_win": "Joueur 2 remporte le tour !",
    "draw": "Égalité !"
};

// Envoie une requête d'action au serveur
function callAction(data) {
    return fetch("../php/game_handler.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: gameState.id, ...data })
    }).then(res => res.json());
}

// Vérifie si c'est au tour du joueur d'agir selon l'état de l'arène
function playerTurn(event) {
    const player = gameState.playerNum == 1 ? "p1" : "p2";
    return event === "waiting" || event === `waiting_${player}`;
}

// Joue une carte
function playCard(cardId, cardEl) {
    let player = gameState.playerNum == 1 ? "p1" : "p2";
    callAction({ action: "play_card", player: player, cardId: cardId })
        .then(data => {
            cardEl.remove();
            if (data.event === "playing") {
                setTimeout(() => {
                    callAction({ action: "reveal" })
                        .then(() => {
                            refreshGame();
                            setTimeout(() => {
                                callAction({ action: "battle" })
                                    .then(() => refreshGame());
                            }, 1000);
                        });
                }, 1500);

            } else {
                refreshGame();
            }
        });
}

// Supprime les cartes du deck
function updateDeck(deck) {
    const deckEl = document.getElementById("deck");
    deckEl.querySelectorAll(".card").forEach(cardEl => {
        const cardId = parseInt(cardEl.dataset.cardId);
        if (!deck.some(c => c.id === cardId)) cardEl.remove();
    });
}

// Génère le contenu HTML d'une carte dans l'arène
function arenaCardHTML(card, isVisible) {
    if (!card) return "";
    if (!isVisible) return `<div class="arenaCardHidden">Carte posée</div>`;
    const hp = Math.max(0, card.hp);
    return `
        <img src="${card.image}" alt="${card.name}">
        <div class="cardHp">❤️${hp} PV</div>
    `;
}

// Initialise le deck du joueur
function initDeck(deck, event) {
    const deckEl = document.getElementById("deck");
    deckEl.innerHTML = "";

    deck.forEach((card, index) => {
        setTimeout(() => {
            const cardEl = document.createElement("div");
            cardEl.classList.add("card");
            cardEl.dataset.cardId = card.id;

            const imgEl = document.createElement("img");
            imgEl.src = card.image;
            imgEl.alt = card.name;
            cardEl.appendChild(imgEl);

            cardEl.addEventListener("click", () => {
                if (cardEl.classList.contains("cardDisabled")) return;
                playCard(card.id, cardEl);
            });

            deckEl.appendChild(cardEl);
        }, index * 300);
    });
}

// Met à jour tout le jeu
function updateGame(data) {
    const { game_info: info, players, arena } = data;
    if (arena.event === "end_game") {
        clearInterval(gameInterval);
        showEndScreen(data);
        return;
    }

    const deckEl = document.getElementById("deck");
    let player = gameState.playerNum == 1 ? "p1" : "p2";

    document.getElementById("p1_name").innerText = players.p1.username;
    document.getElementById("p1_score").innerText = players.p1.score;
    document.getElementById("p2_name").innerText = players.p2 ? players.p2.username : "En attente...";
    document.getElementById("p2_score").innerText = players.p2 ? players.p2.score : "—";
    document.getElementById("turnNum").innerText = info.turn;
    document.getElementById("partyName").innerText = info.roomName;
    document.getElementById("gameEvent").innerText = events[arena.event] || arena.event;

    if (!gameState.distributed && arena.event === "waiting" && deckEl.children.length === 0) {
        gameState.distributed = true;
        initDeck(players[player].deck, arena.event);
        return;
    }

    const p1CardVisible = (player === "p1") || (arena.p1_card && !arena.p1_card.hidden);
    const p2CardVisible = (player === "p2") || (arena.p2_card && !arena.p2_card.hidden);

    document.getElementById("arena_p1").innerHTML = arenaCardHTML(arena.p1_card, p1CardVisible);
    document.getElementById("arena_p2").innerHTML = arenaCardHTML(arena.p2_card, p2CardVisible);

    setTimeout(() => {
        if (arena.p1_card && arena.p1_card.took_damage) {
            const hp1 = document.querySelector("#arena_p1 .cardHp");
            if (hp1) hp1.classList.add("hpHit");
        }
        if (arena.p2_card && arena.p2_card.took_damage) {
            const hp2 = document.querySelector("#arena_p2 .cardHp");
            if (hp2) hp2.classList.add("hpHit");
        }
    }, 50);

    if (["p1_win", "p2_win", "draw"].includes(arena.event) && !gameState.resolvingTurn) {
        gameState.resolvingTurn = true;
        if (gameState.playerNum == 1) {
            setTimeout(() => {
                callAction({ action: "next_turn" })
                    .then(() => {
                        gameState.resolvingTurn = false;
                        refreshGame();
                    });
            }, 3000);
        }
    } else if (arena.event === "waiting" || arena.event.startsWith("waiting_")) {
        gameState.resolvingTurn = false;
    }

    if (players[player].deck) {
        updateDeck(players[player].deck);
    }

    document.querySelectorAll(".card").forEach(card => {
        if (playerTurn(arena.event)) {
            card.classList.remove("cardDisabled");
        } else {
            card.classList.add("cardDisabled");
        }
    });
}

function refreshGame() {
    fetch("../php/get_status.php?id=" + gameState.id)
        .then(res => res.json())
        .then(data => {
            if (!data || data.error) {
                console.error("Partie introuvable");
                return;
            }
            updateGame(data);
        })
        .catch(err => console.error("Erreur refreshGame: ", err));
}

// Affiche l'écran de fin et calcule le gagnant
function showEndScreen(data) {
    const { game_info: info, players, arena } = data;
    let player = gameState.playerNum == 1 ? "p1" : "p2";

    const playgroundEl = document.getElementById("playground");
    const endScreenEl = document.getElementById("endScreen");

    if (playgroundEl) playgroundEl.style.display = "none";
    if (endScreenEl) endScreenEl.style.display = "flex";

    const p1Score = players.p1.score;
    const p2Score = players.p2.score;

    document.getElementById("endTurns").innerText = info.turn;
    document.getElementById("endP1Name").innerText = players.p1.username;
    document.getElementById("endP1Score").innerText = p1Score;
    document.getElementById("endP2Name").innerText = players.p2.username;
    document.getElementById("endP2Score").innerText = p2Score;

    let winnerName = "";
    let isWinner = false;
    let isDraw = false;

    if (arena && arena.abandoned) {
        if (arena.abandoned === "p1") {
            winnerName = players.p2.username;
            isWinner = (player === "p2");
        } else {
            winnerName = players.p1.username;
            isWinner = (player === "p1");
        }
        document.getElementById("endTurns").innerText += " (Abandon)";
    }
    else {
        if (p1Score > p2Score) {
            winnerName = players.p1.username;
            isWinner = (player === "p1");
        } else if (p2Score > p1Score) {
            winnerName = players.p2.username;
            isWinner = (player === "p2");
        } else {
            isDraw = true;
        }
    }

    const titleEl = document.getElementById("endTitle");
    const winnerEl = document.getElementById("endWinner");

    if (isDraw) {
        titleEl.innerText = "ÉGALITÉ";
        titleEl.style.color = "#fff";
        winnerEl.innerText = "Aucun gagnant";
    } else {
        winnerEl.innerText = "Le gagnant est " + winnerName + " !";
        if (isWinner) {
            titleEl.innerText = "VICTOIRE";
            titleEl.style.color = "#4CAF50";
        } else {
            titleEl.innerText = "DÉFAITE";
            titleEl.style.color = "#f44336";
        }
    }
}

// Supprime le fichier JSON et redirige l'utiliser au menu principal
function endGame() {
    callAction({ action: "delete_game" })
        .then(() => {
            window.location.href = "../index.html";
        })
        .catch(err => {
            window.location.href = "../index.html";
        });
}

// Met fin à la partie
function abandonGame() {
    if (confirm("Voulez-vous vraiment abandonner la partie ?")) {
        let player = gameState.playerNum == 1 ? "p1" : "p2";
        callAction({ action: "abandon", player: player })
            .then(() => refreshGame());
    }
}

// Initialise les éléments HTML au chargement de la page
window.onload = () => {
    const btnAbandon = document.getElementById("btnAbandon");
    const btnQuitGame = document.getElementById("btnQuitGame")

    btnAbandon.addEventListener("click", abandonGame);
    btnQuitGame.addEventListener("click", endGame);

    refreshGame();
    gameInterval = setInterval(refreshGame, 500);
};