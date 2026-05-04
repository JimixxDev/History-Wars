<?php
header('Content-Type: application/json');
session_start();

include("party_actions.php");
include("game_actions.php");

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['action'])) {
    echo json_encode(["error" => "Action manquante"]);
    exit;
}

$action = $data['action'];
$response = ["error" => "Action inconnue"];

if ($action === "create_party") {
    if (isset($data['username']) && isset($data['roomName'])) {
        $response = createParty($data['username'], $data['roomName']);
    } else {
        $response = ["error" => "Données manquantes pour créer la partie"];
    }

} else if ($action === "join_party") {
    if (isset($data['gameId']) && isset($data['username'])) {
        $response = joinParty($data['gameId'], $data['username']);
    } else {
        $response = ["error" => "Données manquantes pour rejoindre la partie"];
    }

} else if ($action === "leave_party") {
    if (isset($data['gameId']) && isset($data['username'])) {
        $response = leaveParty($data['gameId'], $data['username']);
    } else {
        $response = ["error" => "Données manquantes pour quitter la partie"];
    }

} else if ($action === "start_party") {
    if (isset($data['gameId'])) {
        $response = startParty($data['gameId']);
    } else {
        $response = ["error" => "Données manquantes pour lancer la partie"];
    }
}

echo json_encode($response);
?>