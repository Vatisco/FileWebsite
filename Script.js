var currentpath = "/", user_mode, user_type;
var EditorShown = false;
mouse = {x:0, y:0};
$(document).ready(function () {
    $("#adminMode, #Video, #Files, #adminArea, #Editor, #Contact").hide();
    $.post("FileWebsite_server.php", { //check if the user is logged in
    op:"getLoginStatus"
    },function (data){
        if($(data).find("user_type").text() != "logged_out"){ //making sure the user is logged in
            console.log($(data).find("user_type").text());
            user_type = $(data).find("user_type").text();
            user_mode = "user";
            console.log("logged in");
            $("#loginForm").hide(); //hiding the login form
            $("#Files, #Contact").show(); // showing the files browser
            $("#logoutButton").click(function (e) {
                LogOut();
            })
            $("#Contact").click(function (e) { 
                ShowContactForm();
            });
            if(user_type == "admin"){
                $("#adminMode").show();
                $("#adminMode").click(function (e) {
                    AdminToggle();
                });
            }
            PrintFiles("/");
        }else{
            $("#loginButton").click(function (e) {
                LogIn(); //show log in if the user isn't logged in
            });
        }
    });
    $("#SearchInput").bind("change", function (e) {
        PrintFiles(currentpath);
    });
});
//Files blocked to normal users
var Blacklist = ["", ".","..","$RECYCLE.BIN", "bin", "boot", "cdrom", "dev", "lib", "lib32", "lib64", "libx32", "lost+found", "mnt", "proc", "root", "run", "sbin", "snap", 
"srv", "swap.img", "sys", "tmp", "var", "usr", "System Volume Information", "UMS.conf", "UMS.cred", "WMPInfo.xml", "database", "debug.log.prev", "Other", "Kids", "games",
"data", "Subs", "etc", "opt", "minecraft", "MC", "!Albums", "!Games", "!hidden"]; // Blacklisting files we don't want viewable
var DeleteBlacklist = ["", ".", "..", "bin", "boot", "cdrom", "dev", "lib", "lib32", "lib64", "libx32", "lost+found", "mnt", "proc", "root", "run", "sbin", "snap",
"srv", "swap.img", "sys", "tmp", "var", "usr", "System Volume Information", "UMS.conf", "UMS.cred", "WMPInfo.xml", "database", "debug.log.prev", "Other", "Kids", "games",
"data", "etc", "opt", "home", "media", "external", "Movies", "southserv", "minecraft", "vpnserver",  "world"]; //Blacklisting files we don't want to be deletable
//Files blocked from everyone
var Fullblacklist = ["", ".",".."];
//declaring variables outside so everything can see them
var id = 0;
var currentfiles = []//Array to hold files in
function DisplayFiles(file, index){// Displaying the files on the page
    let filter = $("#SearchInput").val().trim().toLowerCase();// getting the text in the filter
    let filterFile = file.toLowerCase(); //making all checks lowercase
    if ((!Blacklist.includes(file) || (user_mode == "admin" && !Fullblacklist.includes(file))) && filterFile.includes(filter)){// removing files that are in the blacklist or not in the filter
        file = file.toString();//changing to string in case of numbers
        let FileType = FindExtension(file, index)
        if(user_mode == "admin"){
            adminFile(file, id, FileType, index);
        }else{
            $("#FilesList").append("<tr class = 'result t" + id + "'><td id=" + id + "f class='file'>" + file + "</td></tr>");
        }
        let Fileselector = "#" + id + "f";// creating id's
        id++;
        //extension
        switch(FileType){
            case("Directory"): //if there is no extension (a folder)
                $(Fileselector).click(function (e) { //binding functions to each bit of text
                    PrintFiles(currentpath + file + "/");
                    currentpath = currentpath + file + "/";
                });
            break;
            case("php"): // opens php files -- shown by the browser
            case("pdf"): // opens pdf files -- shown by the browser
                $(Fileselector).click(function (e) {
                    filepath = currentpath + file;
                    filearr = filepath.split("/");
                    filearr.splice(0, 2);
                    currentfile = filearr.join("/");
                    window.location.href = currentfile;
                });
            break;
            case("mp4")://opens mp4 files - video viewer
                $(Fileselector).click(function (e) {
                    $("#Files").hide();       
                    $("#Video").show();
                    let filepath = currentpath + file;
                    let filearr = filepath.split("/");
                    filearr.splice(0, 2);
                    let currentfile = filearr.join("/"); 
                    $("#Video").empty();         
                    $("#Video").append(`<p id='videoback'>Back</p><br><video controls autoplay><source src="` + currentfile + `" type='video/mp4'></video>`);
                    $("#videoback").click(function (e) {
                        $("#Files").show();       
                        $("#Video").hide();
                        $("#Video").empty();
                    }); 
                });
            break;
            case("log"):
            case("file"):
            case("js"):
            case("txt"): //if the file can be edited
            $(Fileselector).click(function (e) { 
                editFile(file);
            });
            break;
        }
    }

}

var filearray = [], fileTypeArray = [];
function PrintFiles(path){// Getting the files from the Server
    $("#Errors, #FilesList").empty();
    if(user_type == "admin" && user_mode == "admin"){
        if(uploadopen){
            $("#UploadFile").html("Upload File to current Directory");
            $("#uploadFileFields").empty();
            uploadopen = false
        }
        if(createopen){
            $("#CreateFileFields, #CreationFields").empty();
            $("#Create").html("Create");
            createopen = false;
        }
    }
    filearray = [], fileTypeArray = [];
    $.post("FileWebsite_server.php", {
        op:"ShowFiles",
        directory:path
    },function (data, status) {
        TableStart(); //creating the back button and path viewer
        if (status == "success"){
            $(data).find("file").each(function() {filearray.push($(this).text())});
            $(data).find("file_type").each(function() {fileTypeArray.push($(this).text())});
            id = 0;
            if (currentpath.length > 1){// if the path you are at isnt blank or /, the back button works
                Back();
            };
            filearray.forEach(DisplayFiles);
            console.log("File count:" + id);//gives incrementing id's to every file in the list
        }else{
            console.log("status:" + status)
        }
});
}

function Back(){//The Back to Parent folder button
    $("#back").click(function (e) {
        $("#FilesList").empty();
        let slashremove = currentpath.split('');
        slashremove.splice(-1, 1);
        let prevdir = slashremove.join('');
        prevdir = prevdir.substring(0, prevdir.lastIndexOf('/') + '/'.length);//removing the most recent file added to the path
        if (prevdir.length == 0){
            prevdir = "/";
        }
        PrintFiles(prevdir);
        currentpath = prevdir;
});
}

function FindExtension(file, index){//finds the extension on the end of the file name
    if(fileTypeArray[index] != "Dir"){
        let filename = file.substring(file.length-5);
        if (filename.includes(".")){ //checking if the filename contains a .
            let arr = filename.split(".");
            return arr.pop();
        }else{
            return "file";
        }
    }else{
        return "Directory";
    }
}


function TableStart(){//empties the error area and the table for the files
    $("#FileExtra").empty();
    $("#FileExtra").append("<tr><td id='CurrentPath'>" + currentpath + "</td></tr><tr><td id='back'>Back to Parent folder</td></tr>")
}

function LogIn(){ //log in function
    $.post("FileWebsite_server.php",{ 
        op: "LogIn",
        email: $("#email").val(),
        password: $("#password").val()
    },
        function(data, Status){
            if(Status == "success"){
                if($(data).find("user_type").text() != "logged_out"){
                    user_type = $(data).find("user_type").text();
                    user_mode = "user";
                    console.log(user_type);
                    $("#loginForm").hide();
                    $("#Files, #Contact").show();
                    if(user_type == "admin"){
                        $("#adminMode").show();
                        $("#adminMode").click(function (e) {
                            AdminToggle();
                        });
                    }
                    PrintFiles("/");
                    $("#logoutButton").click(function (e) {
                        LogOut(); //logout button
                    });
                    $("#Contact").click(function (e) { 
                        ShowContactForm();
                    });
                }else{
                    $("#loginButton").click(function (e) {
                        LogIn();
                    });
                    $("#Errors").empty(); //error if the login information was wrong
                    $("#Errors").append("<p class='errors'>Your login information was incorrect</p>");
                    };
            }
        },
    );
}

function LogOut(){ //logging out
    $.post("FileWebsite_server.php",{
        op:"LogOut"
    },function (data, Status) {//hiding the file browser and showing the login form
        $("#Files, adminMode").hide();
        $("#loginForm").show();
        $("#loginButton").click(function (e) {
            LogIn();
        });
    },);
}

function AdminToggle(){
    if(user_type == "admin"){
        if(user_mode == "user"){
            user_mode = "admin";
            PrintFiles(currentpath);
            $("#adminArea").show();
            adminArea();
        }else{ //if the user is admin
            user_mode = "user"
            PrintFiles(currentpath);
            $("#adminArea").hide();
        }  
    }
}

uploadopen = false, createopen = false;
function adminArea(){// Creating the admin area
    if(user_mode == "admin"){
        $("#adminArea").empty();
        $("#adminArea").append(`
            <input type='password' id='adminPassword' placeholder='Admin Password'>
            <br><button id='CreateUser' class='accountButton'>Create User</button>
            <div id='createUserFields'></div>
            <br><button id='UploadFile' class='accountButton'>Upload File to current Directory</button>
            <div id='uploadFileFields'></div>
            <br><button id='Create' class='accountButton'>Create File or Folder</button>
            <div id='CreateFileFields'></div>
            <div id='CreationFields'></div>`);// Adding admin buttons
        $("#createUserFields, #uploadFileFields").hide();
        $("#CreateUser").click(function (e) { 
            $("#createUserFields").toggle();
            $("#createUserFields").html(`<input type='text' id='userEmail' placeholder='New User Email'>
            <br><input type='password' id='userPassword' placeholder='New User password'>
            <br><button id='confirmUser' class='accountButton'>Create</button>`);// Adding buttons for creating users
            $("#confirmUser").click(function (e) { 
                if($("$userEmail").val().length() >= 10 && $("$userPassword").val() >= 5)
                $.post("FileWebsite_server.php",{
                    op:"CreateUser",
                    email:$("#userEmail").val(),
                    password:$("#userPassword").val()
                },function (data) {
                    if($(data).find("result").text() == "OK"){
                        alert("User with Email: " + $("#userEmail").val() + " added");
                        $("#createUserFields").empty();
                    }else{
                        alert("Error with account creation")
                    }
                },);
            });
        });
        $("#UploadFile").click(function (e) { //Binding the upload button
            if(uploadopen == false){
                $("#UploadFile").html("Close Upload File Fields");// Changing the upload button text
                $("#uploadFileFields").empty();
                Fileuploaddata ='op=UploadForm&file=' + currentpath;//creating the iframe for uploading
                $("#uploadFileFields").html(`<iframe src='FileWebsite_server.php?${Fileuploaddata}' style='border:none; width:300px; overflow:clip;'></iframe>`);
                $("#uploadFileFields").show();
                $("#UploadFilesubmit").click(function (e) { 
                    PrintFiles(currentpath);
                });
                uploadopen = true;
            }else{//Confirm upload button
                $("#UploadFile").html("Upload File to current Directory");
                $("#uploadFileFields").empty();
                uploadopen = false
            }
        });
        $("#Create").click(function (e) { 
            if(createopen == false){
                $("#Create").html("Close");
                $("#CreateFileFields").empty();
                $("#CreateFileFields").html(`<select id='FileOrFolder'><option value='Blank'></option><option value='Folder'>Folder</option><option value='File'>File</option></select>`);
                $("#FileOrFolder").bind("change", function (e) {
                    if($("#FileOrFolder").val() != "Blank"){
                        let name = "", type = "";
                        console.log($("#FileOrFolder").val());
                        if($("#FileOrFolder").val() == "File"){
                            name = "New File Name + Extension", type = "File";
                        }else{
                            name = "New Folder Name", type = "Folder";
                        }
                        let CreateFieldData = `op=CreateFoFForm&name=${name}&type=${type}&path=${currentpath}`;
                        $("#CreationFields").empty();
                        $("#CreationFields").html(`<iframe src='FileWebsite_server.php?${CreateFieldData}' style='border:none; width:300px; overflow:clip;'></iframe>`);
                    }else{
                        $("#CreationFields").empty();
                    }
                });
                createopen = true;
            }else{
                $("#CreateFileFields, #CreationFields").empty();
                $("#Create").html("Create File or Folder");
                createopen = false;
            }
        });
    }
}

function convertFile(file){// video file converting
    if(user_mode == "admin" && user_type == "admin"){
        $.post("FileWebsite_server.php",{
            op:"adminpasscheck",
            input:$("#adminPassword").val()
        },function (data) {
            if($(data).find("result").text() == "true"){
                newfile = prompt("New File name (Relative not absolute) and extension\n Currently" + currentpath + file);// means that you type in Cars(2006).mp4 not /media/external/Movies/Cars(2006)/Cars(2006).mp4
                $.post("FileWebsite_server.php", {
                    op:"ConvertVideo",
                    currentfile:currentpath + file,
                    newfile:currentpath + newfile
                },function (data) {
                    PrintFiles(currentpath);
                },);
            }
        },);
    }

}

function adminFile(file, id, extension, index){//Creating extra button for admin users
    let Buttons = "<tr class = 'result t" + id + "'><td id=" + id + "f class='file'>" + file + "</td><td id='renameid" + id + "'>Rename</td><td id='editid" + id + "'>Edit</td>";
    if(fileTypeArray[index] == "File"){
        Buttons = Buttons + "<td id='deleteid" + id + "'>Delete</td>";
    }else{
        Buttons = Buttons + "<td id='deleteDirId" + id + "'>Delete</td>"
    }
    if(extension == "avi" || extension == "mkv" || extension == "mp4"){
        Buttons = Buttons + "<td id ='convertid" + id + "'>Convert</td></tr>";
    }else{
        Buttons = Buttons + "</tr>";
    }
    $("#FilesList").append(Buttons);//extra button binding
    $("#deleteid" + id).click(function (e) {
        deleteFile(file);
    });
    $("#deleteDirId" + id).click(function (e) { 
        DeleteDir(file);
    });
    $("#convertid" + id).click(function (e) { 
        convertFile(file);
    });
    $("#renameid" + id).click(function (e) { 
        renameFile(file)
    });
    $("#editid" + id).click(function (e) { 
        editFile(file)
    });
}

function renameFile(file){
    if(user_type == "admin" && user_mode == "admin"){
        $.post("FileWebsite_server.php",{
            op:"adminpasscheck",
            input:$("#adminPassword").val()
        },function (data) {
            if($(data).find("result").text() == "true"){
                newname = prompt("New File name (Relative not absolute) and extension\n Currently" + currentpath + file);// means that you type in Cars(2006).mp4 not /media/external/Movies/Cars(2006)/Cars(2006).mp4
                if(newname != ""){
                    $.post("FileWebsite_server.php", {
                        op:"rename",
                        currentfile:currentpath + file,
                        newfile:currentpath + newname
                    },function (data) {
                        PrintFiles(currentpath)
                    },);
                }else{
                    alert("New Name too short")
                }
            }
        },);
    }
}

function deleteFile(file){
    if(!DeleteBlacklist.includes(file)){
        if(user_mode == "admin" && user_type == "admin" && confirm("are you sure you want to delete the file " + currentpath + file)){
            $.post("FileWebsite_server.php", {
                op:"adminpasscheck",
                input:$("#adminPassword").val()
            },function (data) {
                if($(data).find("result").text() == "true"){
                    $.post("FileWebsite_server.php",{
                        op:"Delete",
                        file:currentpath + file
                    },
                        function () {
                            PrintFiles(currentpath);
                            console.log("File deleted");
                        },);
                }else{
                    alert("File deletion aborted");
                }
            },);
        }
    }else{
        alert("This file can not be deleted");
    }
}

function DeleteDir(file){
    if(!DeleteBlacklist.includes(file)){
        if(user_mode == "admin" && user_type == "admin" && confirm("are you sure you want to delete the Directory " + currentpath + file)){
            $.post("FileWebsite_server.php", {
            op:"adminpasscheck",
            input:$("#adminPassword").val()
        },function (data) {
            if($(data).find("result").text() == "true"){
                $.post("FileWebsite_server.php",{
                    op:"DeleteDir",
                    file:currentpath + file
                },function (data) {
                    console.log()
                    PrintFiles(currentpath);
                    console.log("File deleted");
                },);
            }else{
                alert("File deletion aborted");
            }
        },);}
    }else{
        alert("This file can not be deleted");
    }
}

function editFile(file){
    if(user_type == "admin"){
        $.post("FileWebsite_server.php",{
            op:"getFileContents",
            file:currentpath + file
        },function (data, Status) {
            if(Status == "success"){
                AdminToggle();
                EditorShown = true;
                $("#adminMode, #Files, #adminArea").hide();
                $("#Editor").show();
                $("#Editor").append(`<button id='EditorBack'>Back</button><button id='EditorSave'>Save</button><span id='SaveResult'></span>
                <textarea class='cmArea'></textarea>`);
                let textstring = "";
                $(data).find("line").each(function() {textstring = textstring + $(this).text()});
                var code = $(".cmArea")[0];
                editor = CodeMirror.fromTextArea(code, {
                    mode:"php",
                    tabMode: 'indent',
                    lineNumbers : true,
                    lineWrapping: true,
                    scrollbarStyle: "null"
                });
                editor.getDoc().setValue(textstring);
                editor.refresh()
                $("#EditorBack").click(function (e) { 
                    editor.getDoc().setValue("");
                    $("#Editor").empty();
                    $("#Editor").hide();
                    $("#adminMode, #Files").show();
                });
                $("#EditorSave").click(function (e) { 
                    SaveFile(file)
                });
            }
        },);
    }
}

function SaveFile(file){
    if(EditorShown == true){
        let LineCount = editor.lineCount();
        let SaveString = "";
        let i = 0;
        while(i < LineCount){
            if(editor.getLine(i) != undefined ){
                SaveString = SaveString + editor.getLine(i) + "\n";
            }
            i++
        }
        $.post("FileWebsite_server.php", {
            op:"saveFile",
            text:SaveString,
            file:currentpath + file
        },function(data){
            if($(data).find("result").text() == "OK"){// File saved successfully
                $("#SaveResult").html(`<span>File Saved.</span>`);
            }else{
                $("#SaveResult").html(`<span>File Save Failed.</span>`);
            }
        },);
    }
}

function ShowContactForm(){
    $("#MainContent").empty();
    $("#ContactForm").html(``);
}

$(document).mousemove(function(t) {
    mouse.x = t.pageX;
    //console.log(mouse.x);
    mouse.y = t.pageY;
    //console.log(mouse.y);
});