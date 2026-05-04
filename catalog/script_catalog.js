// Variables globales pour le pop-up
let popUpWindow;
let popUpImg;
let popUpName;
let popUpDesc;

// Récupère les données des cartes et affiche les cartes
function loadCards() {
    const catalogGrid = document.getElementById("catalogGrid");
    
    fetch("../php/catalog_handler.php")
        .then(res => res.json())
        .then(cards => {
            cards.forEach(card => {
                const cardEl = document.createElement("div");
                cardEl.className = "card";
                cardEl.textContent = card.name;

                cardEl.addEventListener("click", () => displayPopUp(card));
                catalogGrid.appendChild(cardEl);
            });
        })
        .catch(error => console.error("Erreur lors du chargement des cartes :", error));
}

// Affiche le pop-up avec les infos de la carte
function displayPopUp(card) {
    popUpImg.src = card.image; 
    popUpImg.alt = card.name;
    popUpName.textContent = card.name;
    popUpDesc.textContent = card.description;    
    popUpWindow.style.display = "flex";
}

// Ferme le pop-up
function closePopUp() {
    popUpWindow.style.display = "none";
}

// Ferme le pop-up si on clique à l'extérieur du bloc
function clickOutsidePopUp(event) {
    if (event.target === popUpWindow) {
        closePopUp();
    }
}

// Retourne au menu principal
function back() {
    window.location.href = "../index.html";
}

// Initialisation des éléments au chargement de la page
window.onload = () => {
    popUpWindow = document.getElementById("popUpWindow");
    popUpImg = document.getElementById("popUpImg");
    popUpName = document.getElementById("popUpName");
    popUpDesc = document.getElementById("popUpDesc");

    const backBtn = document.getElementById("backBtn");
    const closeBtn = document.getElementById("closeBtn");
    backBtn.addEventListener("click", back);
    closeBtn.addEventListener("click", closePopUp);
    window.addEventListener("click", clickOutsidePopUp);

    loadCards();
};