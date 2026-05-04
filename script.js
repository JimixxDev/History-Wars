// Variables globales
let lobbyInterval;

const gameState = {
  id: null,
  isHost: false,
  playerNum: null
};

// Affiche la page spécifique dans un SPA
function showPage(pageId) {
  const pages = document.getElementsByClassName("page");
  for (let i = 0; i < pages.length; i++) {
    pages[i].style.display = 'none';
  }
  document.getElementById(pageId).style.display = 'block';

  const btnCredits = document.getElementById("home_credits");
  if (btnCredits) {
    if (pageId === "home") {
      btnCredits.style.display = "block";
    } else {
      btnCredits.style.display = "none";
    }
  }
}

// Vérifie si l'utilisateur a mis un pseudo
function checkUsername() {
  const usernameInput = document.getElementById("username").value;
  if (usernameInput == "") {
    usernameError.textContent = "Entrez un pseudo";
    return false;
  } else {
    usernameError.textContent = "";
    return true;
  }
}

// Vérifie si un nom de salle est correct
function checkRoomName() {
  const roomName = document.getElementById("roomNameInput").value;
  if (roomName == "") {
    roomNameError.textContent = "Entrez un nom de salle";
    return false;
  }
  roomNameError.textContent = "";
  return true;
}

// Affiche la page de création de partie
function createPartyPage() {
  if (checkUsername()) {
    showPage("party_creation");
  }
}

// Affiche la page pour rejoindre une partie
function joinPartyPage() {
  if (checkUsername()) {
    showPage("party_join");
  }
}

// Affiche la page des crédits
function credits() {
  showPage("credits");
}

// Redirige vers la page du catalogue des cartes
function catalog() {
  window.location.href = "catalog/catalog.html";
}

// Envoie une requête au serveur pour exécuter l'action de partie demandée
function callPartyAction(data) {
  return fetch("php/party_handler.php", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => res.json())
    .catch(err => console.error("Erreur lors de l'action :", err));
}

// Affiche les messages de chargement avant la redirection vers la partie
function loadingScreen() {
  showPage("loading");

  const messages = [
    "Convocation des grands conquérants...",
    "Préparation du champ de bataille...",
    "Les armées se rassemblent...",
    "Que l'histoire commence !"
  ];

  let i = 0;
  const loadingMsg = document.getElementById("loadingMsg");
  loadingMsg.textContent = messages[i]
  i++;

  const msgInterval = setInterval(() => {
    if (i < messages.length) {
      loadingMsg.textContent = messages[i];
      i++;
    } else {
      clearInterval(msgInterval);
    }
  }, 2000);

  setTimeout(() => {
    window.location.href = `game/game.html?id=${gameState.id}&player=${gameState.playerNum}`;
  }, 8000);
}

// Retourne à la page d'accueil
function back() {
  stopLobbyWaiting();
  roomNameError.textContent = "";
  joinError.textContent = "";
  showPage("home");
}

// Lance la surveillance de la salle d'attente pour détecter l'arrivée d'un joueur
function startLobbyWaiting() {
  stopLobbyWaiting();
  refreshLobby();
  lobbyInterval = setInterval(refreshLobby, 300);
}

// Arrête la surveillance de la salle d'attente
function stopLobbyWaiting() {
  if (lobbyInterval) {
    clearInterval(lobbyInterval);
    lobbyInterval = null;
  }
}

// Récupère l'état de la partie et met à jour l'affichage de la salle d'attente
function refreshLobby() {
  fetch("php/get_status.php?id=" + gameState.id)
    .then(res => res.json())
    .then(gameData => {
      if (!gameData || gameData.error) {
        stopLobbyWaiting();
        gameState.id = null;
        showPage("home");
        return;
      }

      if (gameData.game_info && gameData.game_info.status === "playing") {
        stopLobbyWaiting();
        loadingScreen();
        return;
      }

      const players = gameData.players;
      const p1 = document.getElementById("player1");
      const p2 = document.getElementById("player2");
      const startBtn = document.getElementById("start");

      if (players) {
        p1.textContent = "Joueur 1 : " + players.p1.username;
        if (players.p2 != null) {
          p2.textContent = "Joueur 2 : " + players.p2.username;
          if (gameState.isHost) {
            startBtn.style.display = "block";
          }
        } else {
          p2.textContent = "Joueur 2 : En attente...";
          startBtn.style.display = "none";
        }
      }
    })
    .catch(err => console.error("Erreur refreshLobby: ", err));
}

// Crée une partie et définit l'utilisateur créateur comme l'hôte
function createParty() {
  if (!checkRoomName()) return;
  const username = document.getElementById("username").value;
  const roomNameInput = document.getElementById("roomNameInput").value;

  callPartyAction({
    action: "create_party",
    username: username,
    roomName: roomNameInput
  })
    .then(data => {
      if (!data || !data.id) return;

      gameState.id = data.id;
      gameState.isHost = true;
      gameState.playerNum = 1;

      document.getElementById("roomId").textContent = data.id;
      document.getElementById("roomName").textContent = roomNameInput;

      showPage("waiting_room");
      startLobbyWaiting();
    })
    .catch(err => {
      console.error("Erreur createParty :", err);
      roomNameError.textContent = "Erreur lors de la création";
    });
}

// Rejoint une partie existante en tant que deuxième joueur
function joinParty() {
  const username = document.getElementById("username").value;
  const gameId = document.getElementById("roomIdInput").value;

  if (gameId === "") {
    joinError.textContent = "Entrez un code de partie";
    return;
  }

  callPartyAction({ 
    action: "join_party", 
    gameId: gameId, 
    username: username 
  })
    .then(data => {
      if (data.status === "success") {
        joinError.textContent = "";
        gameState.id = gameId;
        gameState.isHost = false;
        gameState.playerNum = 2;

        document.getElementById("roomId").textContent = gameId;
        document.getElementById("roomName").textContent = data.roomName;

        showPage("waiting_room");
        startLobbyWaiting();
      } else {
        joinError.textContent = "Code de partie incorrect ou partie pleine";
      }
    })
    .catch(err => {
      console.error("Erreur joinParty :", err);
      joinError.textContent = "Erreur de connexion";
    });
}

// Lance la partie
function startParty() {
  const btnStart = document.getElementById("start");
  btnStart.disabled = true;

  callPartyAction({ 
    action: "start_party", 
    gameId: gameState.id 
  })
    .then(data => {
      if (data.status === "success") {
        stopLobbyWaiting();
        loadingScreen();
      } else {
        btnStart.disabled = false;
        console.error("Erreur démarrage partie :", data);
      }
    })
    .catch(err => {
      btnStart.disabled = false;
      console.error("Erreur startParty :", err);
    });
}

// Quitte la salle d'attente
function leaveParty() {
  stopLobbyWaiting();

  const username = document.getElementById("username").value;
  const gameId = gameState.id;
  gameState.id = null;
  gameState.isHost = false;
  gameState.playerNum = null;
  showPage("home");

  if (gameId) {
    callPartyAction({ 
      action: "leave_party", 
      gameId: gameId, 
      username: username 
    })
      .catch(error => console.error("Erreur leaveParty :", error));
  }
}

// Initialisation des éléments HTML au chargement de la page
window.onload = () => {
  showPage("home");

  const joinError = document.getElementById("joinError");
  const usernameError = document.getElementById("usernameError");
  const roomNameError = document.getElementById("roomNameError");

  const btnCreateParty = document.getElementById("home_create");
  const btnCreate = document.getElementById("create");
  const btnJoinParty = document.getElementById("home_join")
  const btnJoin = document.getElementById("join");
  const btnCredits = document.getElementById("home_credits");
  const btnCatalog = document.getElementById("home_catalog");
  const btnBack = document.querySelectorAll(".back");
  const btnLeaveParty = document.getElementById("leaveParty");
  const btnStart = document.getElementById("start");

  btnCreateParty.addEventListener("click", createPartyPage);
  btnCreate.addEventListener("click", createParty);
  btnJoinParty.addEventListener("click", joinPartyPage);
  btnJoin.addEventListener("click", joinParty);
  btnCredits.addEventListener("click", credits);
  btnCatalog.addEventListener("click", catalog);
  btnBack.forEach(btn => { btn.addEventListener("click", back); });
  btnLeaveParty.addEventListener("click", leaveParty);
  btnStart.addEventListener("click", startParty);
}