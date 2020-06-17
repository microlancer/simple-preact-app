<?php

$start = intval($_GET['start']);
$length = intval($_GET['length']);

if ($start < 0 || $start > 100) {
	die;
}

if ($length < 1 || $length > 100) {
	die;
}

$data = [];

for ($i=$start; $i<$start+$length; $i++) {
	$data[] = $i;
}

echo json_encode($data, JSON_PRETTY_PRINT);
