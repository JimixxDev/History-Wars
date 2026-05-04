<?php
header('Content-Type: application/json');

if (file_exists("cards.inc")) {
    include("cards.inc");
    $cards = getCards();
} else {
    $cards = ["error" => "Fichier de données manquant"];
}

echo json_encode($cards);
?>