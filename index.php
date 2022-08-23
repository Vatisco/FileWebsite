<!DOCTYPE html>
<html lang='en'>
    <head>
        <meta charset='utf-8'>
        <link rel="icon" type="image/x-icon" href="SouthServ.png">
        <script src="https://code.jquery.com/jquery-3.5.0.js"></script>
        <script src='lib/codemirror.js'></script>
        <script src='Script.js'></script>
        <script src="mode/javascript/javascript.js"></script>
        <script src="mode/php/php.js"></script>
        <script src="mode/css/css.js"></script>
        <script src="mode/xml/xml.js"></script>
        <script src="mode/clike/clike.js"></script>
        <script src="mode/htmlmixed/htmlmixed.js"></script>
        <link rel='stylesheet' href='lib/codemirror.css'>
        <?php echo "<link rel='stylesheet' href='style.css?v=123'>"; ?>
        <title>Southserv File sharing</title>
    </head>
    <body>
        <div id='Container'>
            <div id='Errors'></div>
            <div id='Files'>
                <a href="javascript:mainPage()" id='titleButton'><p id='Title'>Southserv Files</p></a>
                <div id='MainContent'>
                    <div id='DialogBox'></div>
                    <div id='Buttons'>
                        <button id='logoutButton' class='accountButton'>Log Out</button><button id='adminMode' class='accountButton'>Admin Mode</button><button id='Contact' class='accountButton'>Contact</button><button id='accountMenu' class='accountButton'>Account</button>
                    </div>
                    <div id='adminArea'>
                        <input type='password' id='adminPassword' placeholder='Admin Password'>
                    </div>
                    <table id='FileExtra'>
                        <tr><td id='CurrentPath'>currentpath</td></tr><tr><td id='back'>Back to Parent folder</td></tr>
                    </table>
                    <table id='Search'>
                        <tr>
                            <td id='SearchText'>Search:</td>
                            <td id='SearchInputTable'><input type='text' id='SearchInput'></td>
                        </tr>
                    </table>
                    <table id='FilesList'></table>
                </div>
            </div>
            <div id='loginForm'>
                <span class='fieldLabel'>User Name</span><input type='text' id='email'><br>
                <span class='fieldLabel'>Password</span><input type='password' id='password'><br>
                <button id='loginButton' class='accountButton'>Log In</button>
                <button id='loginFormContact' class='accountButton'>Contact</button>
                <button id='requestAccountButton' class='accountButton'>Request an Account</button>
                <button id='resetPasswordButton' class='accountButton'>Reset Password</button>
            </div>
            <div id='formDiv'></div>
            <div id='accountArea'></div>
        </div>
        <div id='Video'></div>
        <div id='Editor'></div>
    </body>
</html>