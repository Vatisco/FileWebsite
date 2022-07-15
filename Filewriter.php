<?php
$file = fopen("/home/southserv/filelist.txt", "w");
$dirfiles = scandir("/media/external/Movies/");
clearstatcache();
foreach($dirfiles as $value){
    $insidefolder = scandir("/media/external/Movies/" . $value);
    foreach ($insidefolder as $result){
        if ($result != "" && $result != "." && $result != ".." && (strpos($result, ".avi") == true || strpos($result, "mkv") == true)){
            $text = $result;
            echo($result . "\n");
            fwrite($file , $text . "\n");
        }
    }
}
fclose($file);
?>

//(strpos($result, ".avi") == true || strpos($result, "mkv") == true)