<?php
session_start();
$sess_id=session_id();
$stmt = $conn->prepare("select email, user_type, u.user_id from USERS as u, SESSIONS as s WHERE u.user_id = s.user_id AND s.session_id=:sess_id");
$stmt->bindParam(":sess_id", $sess_id);
$stmt->execute();
$result = $stmt->fetchAll();
if(count($result) == 0){
    $authenticated = true;
    $user_type = "logged_out";
}elseif(count($result) == 1){
    $authenticated=true;
    $user_type = $result[0]['user_type'];
    $email = $result[0]['email'];
    $user_id = $result[0]['user_id'];
}
?>