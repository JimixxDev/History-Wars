<?php

// Génère un ID aléatoire
function generateRandomId($length) {
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    $res = '';
    for ($i=0; $i<$length; $i++) {
        $res = $res . $characters[rand(0, strlen($characters)-1)];
    }
    return $res;
}

// Sauvegarde les données d'une partie
function saveParty($id, $data) {
    $filename = "../parties/" . $id . ".json";
    file_put_contents($filename, json_encode($data));
}

// Initialise une nouvelle partie et crée le fichier JSON
function createParty($username, $roomName) {
    if (!file_exists('../parties')) {
        mkdir('../parties', 0777, true);
    }

    do {
        $randomId = generateRandomId(6);
        $filename = "../parties/" . $randomId . ".json";
    } while (file_exists($filename));

    $gameStats = [
        "game_info" => [
            "id" => $randomId,
            "roomName" => $roomName,
            "status" => "waiting",
            "turn" => 1
        ],
        "players" => [
            "p1" => [
                "username" => $username,
                "score" => 0,
                "deck" => [],
                "played_cards" => []
            ],
            "p2" => null
        ],
        "arena" => [
            "p1_card" => null,
            "p2_card" => null,
            "event" => "distributing",
        ]
    ];

    saveParty($randomId, $gameStats);
    return ["id" => $randomId];
}

// Ajoute le deuxième joueur à une partie existante
function joinParty($gameId, $username) {
    $filename = "../parties/" . $gameId . ".json";

    if (!file_exists($filename)) {
        return ["status" => "error", "message" => "Partie introuvable"];
    }

    $gameData = json_decode(file_get_contents($filename), true);
    if (!isset($gameData['players']['p2']) || $gameData['players']['p2']['username'] === $username) {
        $gameData['players']['p2'] = ["username" => $username,"score" => 0,"deck" => [],"played_cards" => []];
        saveParty($gameId, $gameData);
        return ["status" => "success", "roomName" => $gameData['game_info']['roomName']];
    }
    return ["status" => "error", "message" => "Partie déjà pleine !"];
}

// Supprime la partie (hôte) ou libère la place (invité)
function leaveParty($gameId, $username) {
    $filename = "../parties/" . $gameId . ".json";
    if (!file_exists($filename)) {
        return ["status" => "error", "message" => "Partie introuvable"];
    }

    $gameData = json_decode(file_get_contents($filename), true);
    if ($gameData['players']['p1']['username'] === $username) {
        unlink($filename);
    } else {
        $gameData['players']['p2'] = null;
        saveParty($gameId, $gameData);
    }

    return ["status" => "success"];
}

// Lance la partie et distribue les cartes
function startParty($gameId) {
    $filename = "../parties/" . $gameId . ".json";
    if (!file_exists($filename)) {
        return ["status" => "error", "message" => "Partie introuvable"];
    }

    $gameData = json_decode(file_get_contents($filename), true);    
    $gameData = distributeCards($gameData, 10);
    $gameData['game_info']['status'] = "playing";

    saveParty($gameId, $gameData);
    return ["status" => "success"];
}
?>