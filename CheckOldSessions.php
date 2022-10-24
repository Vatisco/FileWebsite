<?php
require_once 'FileWebsite_pdo.php';
$stmt = $conn->prepare("DELETE FROM SESSIONS WHERE last_login < DATE_ADD(now(), INTERVAL -7 DAY)");
if($_SERVER['PHP_SELF']){
    echo $_SERVER['PHP_SELF'];
}

?>