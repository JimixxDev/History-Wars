<?php
header('Content-Type: application/json');

$id = $_GET['id'];
if (empty($id)) {
    echo json_encode(["error" => "ID manquant"]);
    exit;
}

$filename = "../parties/" . $id . ".json";
if (!file_exists($filename)) {
    echo json_encode(["error" => "Partie introuvable"]);
    exit;
}

$data = file_get_contents($filename);
if ($data === false || empty($data)) {
    echo json_encode(["error" => "Données illisibles"]);
} else {
    echo $data;
}
?>