<?php
require_once 'FileWebsite_pdo.php';
require_once 'check_logged_in.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require "vendor/phpmailer/phpmailer/src/PHPMailer.php";
require "vendor/phpmailer/phpmailer/src/SMTP.php";
require "vendor/phpmailer/phpmailer/src/Exception.php";


if (isset($_POST['op'])){
    $op = $_POST['op'];
}else if(isset($_GET['op'])){
	$op = $_GET['op'];
}else{
    die();
}   

echo "<response>";
switch($op){
    case "ShowFiles":
        if($user_type != "logged_out"){
            displayfilelist($_POST['directory']);
        }
    break;
    case "LogIn":
        DoLogIn($_POST['email'], $_POST['password']);
    break;
    case "getLoginStatus":
        echo "<user_type>$user_type</user_type>";
    break;
    case "LogOut":
        LogOut();
    break;
    case "Delete":
        if($user_type == "admin"){
            DeleteFile($_POST['file']);
        }
    break;
    case "DeleteDir":
        if($user_type == "admin"){
            DeleteDir($_POST['file']);
        }
    break;
    case "adminpasscheck":
        if(password_verify($_POST['input'], '$2y$10$qblOaAyRz3OaoPISMk0nHuOKiAfud2/Ah0loTKz3R2n5UfLdtfmIe')){
            echo "<result>true</result>";
        }else{
            echo "<result>false</result>";
        }
    break;
    case "CreateUser":
        if($user_type == "admin" && $email = $personal_email){
            CreateUser($_POST['email'], $_POST['password']);
        }
    break;
    case "ConvertVideo":
        if($user_type == "admin"){
            ConvertVideo($_POST['currentfile'], $_POST['newfile']);
        }
    break;
    case "rename":
        if($user_type == "admin"){
            rename($_POST['currentfile'], $_POST['newfile']);
        }
    break;
    case "UploadForm":
        if($user_type == "admin"){
            uploadForm($_GET['file']);
        }
    break;
    case "FileUpload":
        if($user_type == "admin"){
            if(isset($_POST['fileName'])){
                upload($_POST['currentpath'], $_POST['fileName']);
            }else{
                upload($_POST['currentpath'], "");
            }
        }
    break;
    case "getFileContents":
        if($user_type == "admin"){
            getFileContents($_POST['file']);
        }
    break;
    case "saveFile":
        if($user_type == "admin"){
            saveFile($_POST['file'], $_POST['text']);
        }
    break;
    case "Create":
        if($user_type == "admin"){
            CreateFileOrFolder($_POST['FileType'], $_POST['Name'], $_POST['Path']);
        }
    break;
    case "Contact":
        Contact($_POST['Name'], $_POST['Subject'], $_POST['Email'], $_POST['EmailContent'], $personal_email);
    break;
    case "createAccountRequest":
        createAccountRequest($_POST['name'], $_POST['email'], $_POST['password'], $_POST['number']);
    break;
    case "getAccountInfo":
        if($user_type != "logged_out"){
            getAccountInfo();
        }
    break;
    case "resetPassword":
        setTempPassword($_POST['email']);
    break;
    case "changePassword":
        changePassword($_POST['user_type'], $_POST['oldPass'], $_POST['newPass'], $_POST['email']);
    break;
    case "removeOtherSessions":
        clearAllOtherSessions();
    break;
    case "getAllUsers":
        if($user_type == "admin"){
            getAllUsers($_POST['table']);
        }
    break;
    case "updateUser":
        if($user_type == "admin"){
            //ADD FUNCTION
        }
    break;
};
echo "</response>";

function DeleteFile($file){
    global $user_type;
    if($user_type == "admin"){
        $result = unlink($file);
        return $result;
    }
}

function DeleteDir($file){
    global $user_type;
    if($user_type == "admin"){
        $result = rmdir($file);
        return $result;
    }
}

function displayfilelist($input) {
    $dirfiles = scandir($input);
    foreach($dirfiles as $value){
        if(is_dir($input . $value)){
            echo "<file>$value</file><file_type>Dir</file_type>";
        }else{
            echo "<file>$value</file><file_type>File</file_type>";
        }
    }
}

function DoLogIn($email, $password){
    global $conn, $sess_id;

    $stmt = $conn->prepare("SELECT password, temp_pass FROM USERS WHERE EMAIL=:email");
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    $result = $stmt->fetchAll();
    if(count($result) == 1){
        $hashed_password = $result[0]['password'];
        $temp_pass = $result[0]['temp_pass'];
        if(password_verify($password, $hashed_password)){
            $stmt = $conn->prepare("SELECT user_id, user_type FROM USERS WHERE email=?");
            $stmt->execute(array($email));
            $result = $stmt->fetchAll();
            $user_id = $result[0]['user_id'];
            $user_type = $result[0]['user_type'];
            $stmt = $conn->prepare("INSERT INTO SESSIONS(user_id, session_id) VALUES(?,?)");
            $stmt->execute(array($user_id, $sess_id));
            echo "<user_type>$user_type</user_type>"; 
            $stmt = $conn->prepare("UPDATE USERS SET temp_pass=NULL WHERE USER_ID=?");
            $stmt->execute(array($user_id));
        }else if($password == $temp_pass){
            echo "<user_type>temp</user_type>";
        }else{
            echo "<user_type>logged_out</user_type>";
        }
    } else{
        echo "<user_type>logged_out</user_type>";
    }
}

function LogOut(){
    global $conn, $sess_id;
    $stmt = $conn->prepare("DELETE FROM SESSIONS where session_id = ?");
    $stmt->execute(array($sess_id));
    echo"<user_type>logged_out</user_type>";
}

function isAdmin(){
    global $user_type;
    return $user_type == 'admin';
}

function CreateUser($email, $password){
    global $conn;
    $stmt = $conn->prepare("INSERT INTO USERS(email, password, user_type) VALUES (?,?,'user')");
    $stmt->execute(array($email, password_hash($password, PASSWORD_DEFAULT)));
    if($stmt->rowCount()==1){
        echo"<result>OK</result>";
    }else{
        echo"<result>ERROR</result>";
    }
}

function ConvertVideo($currentfile, $newfile){
    $currentfile = prepForffmpeg($currentfile);
    $newfile = prepForffmpeg($newfile);
    execInBackground("ffmpeg -i ". $currentfile . " " . $newfile);
}

function prepForffmpeg($file){
    $file = str_replace(" ", "\ ", $file);
    $file = str_replace("(", "\(", $file);
    $file = str_replace(")", "\)", $file);
    $file = str_replace("[", "\[", $file);
    $file = str_replace("]", "\]", $file);
    $file = str_replace("!", "\!", $file);
    $file = str_replace("'", "\'", $file);
    $file = str_replace('"', '\"', $file);
    $file = str_replace(',', '\,', $file);
    $file = str_replace('&', '\&', $file);
    return $file;
}

function execInBackground($cmd) {
    if (substr(php_uname(), 0, 7) == "Windows"){
        pclose(popen("start /B ". $cmd, "r")); 
    }
    else {
        exec($cmd . " > /dev/null &");  
    }
}

function uploadForm($path){
    $extra = "";
    if($path == "/media/external/Movies/"){
        $extra = "<input type='text' name='fileName' id='fileNameInput' placeholder='New File Name'><br>";
    }
    echo"
    <html lang='en'>
        <head>
            <meta charset='UTF-8'> 
            <link rel='stylesheet' href='style.css' >
        </head>
        <body>
            <form action='FileWebsite_server.php' method='post' multipart='' enctype='multipart/form-data'>
                <input type='file' name='fileToUpload[]' id='fileToUpload' multiple>
                $extra
                <input type='hidden' name='currentpath' value='$path' >
                <input type='hidden' name='op' value='FileUpload' >
                <input type='submit' value='Upload' name='submit' id='UploadFilesubmit'>
            </form>
        </body>
    </html>";
}

function upload($currentpath, $filename){
    if($currentpath != "/media/external/Movies/"){
        $countfiles = count($_FILES['fileToUpload']['name']);
        for($i=0;$i<$countfiles;$i++){
            $targetFile = $currentpath . basename($_FILES['fileToUpload']['name'][$i]);
            move_uploaded_file($_FILES['fileToUpload']['tmp_name'][$i], $targetFile);
        }
    }else{
        $extension = substr(basename($_FILES['fileToUpload']['name']), -4);
        $targetFile = $currentpath . $filename . "/" . $filename;
        error_log("");
        if(!mkdir("/media/external/Movies/" . $filename)){
            echo"Folder creation failed, File Upload Aborted";
        }else{
            move_uploaded_file($_FILES['fileToUpload']['tmp_name'], $targetFile . $extension);
            if($extension=".mkv" || $extension=".avi"){
                $newfile = substr($targetFile, 0, -4) . ".mp4";
                ConvertVideo($targetFile, $newfile);
            }
        }
    }
}

function getFileContents($filepath){
    $file = fopen($filepath, "r");
    if ($file) {
        $string = "";
        while (($buffer = fgets($file, 4096)) !== false) {
            $filetextarray[] = $buffer;
        }
        foreach($filetextarray as $line){
            $string = $string . "\n" . "<line>" . $line . "</line>";
        }
        echo "$string";
        if (!feof($file)) {
            echo "Error: unexpected fgets() fail\n";
        }
        fclose($file);
    }
}

function saveFile($filepath, $SaveString){
    $file = fopen($filepath, "w");
    if ($file) {
        if(fwrite($file, $SaveString)){
            echo"<result>OK</result>";
        }
        fclose($file);
    }
}

function CreateFileOrFolder($fileType, $Name, $Path){
    if($fileType == "Folder"){
        if(!file_exists($Path . $Name)){
            if(mkdir($Path . $Name)){
                echo "<result>OK</result>";
            }else{
                echo "<result>FAILED</result>";
            }
        }else{
            echo "<result>EXISTS</result>";
        }
    }else{
        if(!file_exists($Path . $Name)){  
            $file = fopen($Path . $Name, "w");
            fclose($file);
        }else{
            echo "<result>EXISTS</result>";
        }
    }
}

function Contact($Name, $Subject, $email, $content, $address){
    global $GPASS;
    define('GUSER', 'southserv22@gmail.com'); // GMail username
	define('GPWD', $GPASS); //Gmail password. it would be a good idea to use an app specicfic password here
	$mail = new PHPMailer(true);  // create a new object
	$mail->IsSMTP(); // enable SMTP
	$mail->SMTPDebug = 0;  // debugging: 1 = errors and messages, 2 = messages only
	$mail->SMTPAuth = true;  // authentication enabled
	$mail->SMTPSecure = 'ssl'; // secure transfer enabled REQUIRED for GMail
	$mail->Host = 'smtp.gmail.com';
	$mail->Port = 465; 
	$mail->Username = GUSER;  
	$mail->Password = GPWD;  
	$mail->AddReplyTo($email, $Name);
	$mail->SetFrom($email, $Name);
	$mail->Subject = $Subject;
	$mail->isHTML(true);
	$mail->Body = $content;
	$mail->AddAddress($address);
	if(!$mail->Send()) {
		echo"<result>Error with sending Email Error: " . $mail->ErrorInfo . "</result>";
	} else {
		echo"<result>OK</result";
	}
}

function createAccountRequest($name, $email, $password, $number){
    global $conn;
    if(strlen($name) < 32 && $name != ""){
        if(strlen($email) < 256 && strlen($email) >= 10 && $email != ""){
            if(strlen($password) < 256 && $password != ""){
                if(strlen($number) < 15){
                    if(strlen($number) == 0){
                        $number = 0;
                    }
                    $stmt = $conn->prepare("INSERT INTO ACCOUNT_REQUESTS(name, email, password, number) VALUES (?, ?, ?, ?)");
                    $stmt->execute(array($name, $email, password_hash($password, PASSWORD_DEFAULT), $number));
                    if($stmt->rowCount() == 1){
                        echo"<result>OK</result>";
                    }else{
                        echo"<result>Error with Account request</result>";
                    }
                }else{
                    echo"<result>Number too long</result>";
                }
            }else{
                echo"<result>password too long or blank</result>";
            }
        }else{
            echo"<result>invalid email or blank</result>";
        }
    }else{
        echo"<result>Name Too long or blank<result>";
    }
}

function getAccountInfo(){
    global $conn, $user_id;
    $stmt = $conn->prepare("SELECT session_id FROM SESSIONS WHERE user_id=?");
    $stmt->execute(array($user_id));
    $sessions = $stmt->rowCount();
    $stmt = $conn->prepare("SELECT email, number FROM USERS WHERE user_id=?");
    $stmt->execute(array($user_id));
    $result = $stmt->fetchAll();
    if(count($result) == 1){
        $email = $result[0]['email'];
        $number = $result[0]['number'];
        echo "<result>OK</result><email>$email</email><number>$number</number><sessions>$sessions</sessions>";
    }else{
        echo "<result>ERROR</result>";
    }
}

function setTempPassword($email){
    global $conn, $personal_email;
    $temp_pass = RandomString(16);
    $stmt = $conn->prepare("UPDATE USERS SET temp_pass=? WHERE email=?");
    $stmt->execute(array($temp_pass, $email));
    if($stmt->rowCount() == 1){
        contact("Southserv", "Password reset", $personal_email, `We recieved a request to reset your password, you can log in with the temporary password: "$temp_pass". <br>Once you log in you will be asked to reset your password and the temporary one will be deleted.`, $email);
        echo"<result>OK</result>";
    }else{
        echo"<result>ERROR</result>";
    }
    //Send email to person with temp password
}

function RandomString($length){
    $charString = "abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $output = "";
    for($i = 0; $i < $length; $i++){
        $output = $output . substr($charString, rand(0, 62), 1);
    }
    return $output;
}

function changePassword($user_type, $oldPass, $newPass, $email){
    global $conn;
    if($user_type == "temp"){
        $stmt = $conn->prepare("UPDATE USERS SET password=? WHERE email=?");
        $stmt->execute(array(password_hash($newPass, PASSWORD_DEFAULT), $email));
        if($stmt->rowCount() == 1){
            echo"<result>OK</result>";
        }else{
            echo"<result>ERROR</result>";
        }
    }else if($user_type != "logged_out"){
        $stmt = $conn->prepare("SELECT password FROM USERS WHERE email=?");
        $stmt->execute(array($email));
        $result = $stmt->fetchAll();
        if(password_verify($oldPass, $result[0]['password'])){
            $stmt = $conn->prepare("UPDATE USERS SET PASSWORD=? WHERE email=?");
            $stmt->execute(array(password_hash($newPass, PASSWORD_DEFAULT), $email));
            if($stmt->rowCount() == 1){
                echo"<result>OK</result>";
            }else{
                echo"<result>ERROR</result>";
            }
        }
    }
}

function clearAllOtherSessions(){
    global $conn, $user_id, $sess_id;
    $stmt = $conn->prepare("DELETE FROM SESSIONS WHERE user_id=?");
    $stmt->execute(array($user_id));
    $stmt = $conn->prepare("INSERT INTO SESSIONS(user_id, session_id) VALUES(?,?)");
    $stmt->execute(array($user_id, $sess_id));
    if($stmt->rowCount() == 1){
        echo"<result>OK</result>";
    }else{
        echo "<result>ERROR</result>";
    }
}

function getAllUsers($TABLE){
    global $conn;
    if($TABLE == "USERS"){
        $stmt = $conn->prepare("SELECT user_id, email, password, user_type, number, temp_pass FROM USERS");
    }else{
        $stmt = $conn->prepare("SELECT user_id, email, password, user_type, number FROM ACCOUNT_REQUESTS");
    }
    $stmt->execute();
    $result = $stmt->fetchAll();
    if($stmt->rowCount() >= 1){
        $output = "<result>OK</result>";
    }else{
        echo "<result>ERROR</result>";
        return;
    }
    for($i=0; $i < $stmt->rowCount(); $i++ ){
        $user_id = $result[$i]['user_id'];
        $email = $result[$i]['email'];
        $password = $result[$i]['password'];
        $user_type = $result[$i]['user_type'];
        $number = $result[$i]['number'];
        $temp_pass = $result[$i]['temp_pass'];
        $output .= "<user_id>$user_id</user_id><email>$email</email><password>$password</password>
        <user_type>$user_type</user_type><number>$number</number><temp_pass>$temp_pass</temp_pass>";
    }
    echo "$output";
}
?>