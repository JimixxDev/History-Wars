<?php
include("cards.inc");

// Distribue aléatoirement les cartes au joueur
function distributeCards($game, $nbCards) {
    if ($game['arena']['event'] !== "distributing") {
        return $game;
    }
    $cards = getCards();
    shuffle($cards);
    $game['players']['p1']['deck'] = array_slice($cards, 0, $nbCards);
    $game['players']['p2']['deck'] = array_slice($cards, $nbCards, $nbCards);
    $game['arena']['event'] = "waiting";
    return $game;
}

// Place la carte choisie par le joueur dans l'arène
function playCard($game, $player, $cardId) {
    $event = $game['arena']['event'];

    if ($event === "waiting_p1" && $player !== "p1") return $game;
    if ($event === "waiting_p2" && $player !== "p2") return $game;

    $deck = $game['players'][$player]['deck'];
    $cardIndex = -1;
    foreach ($deck as $i => $card) {
        if ($card['id'] == $cardId) {
            $cardIndex = $i;
            break;
        }
    }

    if ($cardIndex === -1) return $game;

    $cardToPlay = $deck[$cardIndex];
    $cardToPlay['hidden'] = true;
    $game['arena'][$player . '_card'] = $cardToPlay;
    array_splice($game['players'][$player]['deck'], $cardIndex, 1);

    if ($event === "waiting") {
        $game['arena']['event'] = ($player === "p1") ? "waiting_p2" : "waiting_p1";
    } else {
        $game['arena']['event'] = "playing";
    }

    return $game;
}

// Affrontement des cartes jusqu'à qu'une carte perde
function battle($game) {
    $p1_card = $game['arena']['p1_card'];
    $p2_card = $game['arena']['p2_card'];

    if (!$p1_card || !$p2_card) return $game;

    $p1_card['hp'] -= $p2_card['atk'];
    $p2_card['hp'] -= $p1_card['atk'];

    $game['arena']['p1_card'] = $p1_card;
    $game['arena']['p2_card'] = $p2_card;

    $p1_dead = $p1_card['hp'] <= 0;
    $p2_dead = $p2_card['hp'] <= 0;

    if ($p1_dead && $p2_dead) {
        $game['arena']['event'] = "draw";
    } elseif ($p1_dead) {
        $game['arena']['event'] = "p2_win";
        $game['players']['p2']['score'] += $p1_card['pts'];
    } elseif ($p2_dead) {
        $game['arena']['event'] = "p1_win";
        $game['players']['p1']['score'] += $p2_card['pts'];
    } else {
        return battle($game);
    }
    return $game;
}

// Nettoie l'arène et prépare le tour suivant ou la fin de partie
function nextTurn($game) {
    $event = $game['arena']['event'];

    if ($event === "p1_win" || $event === "draw") {
        $game['arena']['p2_card'] = null;
    }
    if ($event === "p2_win" || $event === "draw") {
        $game['arena']['p1_card'] = null;
    }

    if ($game['arena']['p1_card'] !== null) {
        $game['arena']['p1_card']['hp'] = max(0, $game['arena']['p1_card']['hp']);
    }
    if ($game['arena']['p2_card'] !== null) {
        $game['arena']['p2_card']['hp'] = max(0, $game['arena']['p2_card']['hp']);
    }

    $p1_check = $game['arena']['p1_card'] === null;
    $p2_check = $game['arena']['p2_card'] === null;
    $p1_empty = count($game['players']['p1']['deck']) === 0;
    $p2_empty = count($game['players']['p2']['deck']) === 0;

    if (($p1_check && $p1_empty) || ($p2_check && $p2_empty)) {
        $game['arena']['event'] = "end_game";
    } else {
        if ($p1_check && $p2_check) {
            $game['arena']['event'] = "waiting";
        } elseif ($p1_check) {
            $game['arena']['event'] = "waiting_p1";
        } else {
            $game['arena']['event'] = "waiting_p2";
        }
        $game['game_info']['turn']++;
    }
    return $game;
}

// Révèle les cartes cachées
function revealCards($game) {
    if ($game['arena']['p1_card'] !== null) $game['arena']['p1_card']['hidden'] = false;
    if ($game['arena']['p2_card'] !== null) $game['arena']['p2_card']['hidden'] = false;
    return $game;
}

// Abandonne une partie
function abandon($game, $player) {
    $game['arena']['event'] = "end_game";
    $game['arena']['abandoned'] = $player;
    return $game;
}
?>