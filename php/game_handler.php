<?php
header('Content-Type: application/json');
include("game_actions.php");

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || empty($data['action']) || empty($data['gameId'])) {
    echo json_encode(["error" => "Données manquantes"]);
    exit;
}

$action = $data['action'];
$gameId = $data['gameId'];
$filename = "../parties/" . $gameId . ".json";

if (!file_exists($filename)) {
    echo json_encode(["error" => "Partie introuvable"]);
    exit;
}

$game = json_decode(file_get_contents($filename), true);

if ($action === "distribute") {
    $game = distributeCards($game, 10);
} else if ($action === "play_card") {
    $game = playCard($game, $data['player'], $data['cardId']);
} else if ($action === "reveal") {
    $game = revealCards($game);
} else if ($action === "battle") {
    $game = battle($game);
} else if ($action === "abandon") {
    $game = abandon($game, $data['player']);
} else if ($action === "delete_game") {
    if (file_exists($filename)) {
        unlink($filename);
    }
    echo json_encode(["status" => "success"]);
    exit;
} else if ($action === "next_turn") {
    $game = nextTurn($game);
}

file_put_contents($filename, json_encode($game));
echo json_encode(["status" => "success", "event" => $game['arena']['event']]);
?>