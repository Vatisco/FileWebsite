<?php
// $file = fopen("/home/southserv/filelist.txt", "w");
// $dirfiles = scandir("/media/external/Movies/");
// clearstatcache();
// foreach($dirfiles as $value){
//     $insidefolder = scandir("/media/external/Movies/" . $value);
//     foreach ($insidefolder as $result){
//         if ($result != "" && $result != "." && $result != ".." && (strpos($result, ".avi") == true || strpos($result, "mkv") == true)){
//             $text = $result;
//             echo($result . "\n");
//             fwrite($file , $text . "\n");
//         }
//     }
// }
// fclose($file);
$length = 16;
$charString = "abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
$output = "";
for($i = 0; $i <= $length; $i++){
    $output = $output . substr($charString, rand(0, 62), 1);
}
echo $output;
?>

//(strpos($result, ".avi") == true || strpos($result, "mkv") == true)