var currentpath = "/", user_mode, user_type, user_id, EditorShown = false, filearray = [];;
mouse = { x: 0, y: 0 };
class fileClass {
    constructor(name, fileType) {
        this.name = name;
        this.fileType = fileType;
    }
};
class UserTableClass {
    constructor(user_id, name, email, password, user_type, number, temp_pass){
        this.user_id = user_id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.user_type = user_type;
        this.number = number;
        this.temp_pass = temp_pass;
    }
}

$(document).ready(function () {
    $("#adminMode, #Video, #Files, #adminArea, #Editor, #Contact, #DialogBox").hide();
    $.post("FileWebsite_server.php", { //check if the user is logged in
        op: "getLoginStatus"
    }, function (data) {
        //console.log(data);
        if ($(data).find("user_type").text() != "logged_out") { //making sure the user is logged in
            LogIn();
        }else{
            $("#loginButton").click(function (e) {
                logInButton(); //show log in if the user isn't logged in
            });
            $("#loginFormContact").click(function (e) {
                ShowContactForm();
            });
            $("#requestAccountButton").click(function (e) {
                requestAccountform();
            });
            $("#resetPasswordButton").click(function (e) { 
                resetpassword();
            });
            user_type = "logged_out";
        }
    });
    $("#SearchInput").bind("change", function (e) {
        PrintFiles(currentpath);
    });
});

function mainPage(){
    $("#Errors, #accountArea, #DialogBox, #formDiv").empty();
    $("#DialogBox, #Editor, #Video, #accountArea").hide();
    if(user_type != "logged_out"){
        $("#Files, #MainContent").show();
        if(user_mode == "admin"){
            $("#adminArea").show();
        }
    }else{
        $("#loginForm, #loginButton, #loginFormContact, #requestAccountButton").show();
    }
}

function LogIn() { //log in function
    $.post("FileWebsite_server.php", {
        op: "getLoginStatus"
    }, function (data) {
        if ($(data).find("user_type").text() != "logged_out") {
            user_type = $(data).find("user_type").text();
            user_mode = "user";
            $("#loginForm").hide(); //hiding the login form
            $("#Files, #Contact, #MainContent").show(); // showing the files browser
            $("#logoutButton").click(function (e) {
                LogOut();
            })
            $("#Contact").click(function (e) {
                ShowContactForm();
            });
            $("#accountMenu").click(function (e) { 
                showAccountMenu();                
            });
            if (user_type == "admin") {
                $("#adminMode").show();
                $("#adminMode").click(function (e) {
                    AdminToggle();
                });
            }
            PrintFiles("/");
        } else {
            addError("Your login failed");
        }
    });
}

function logInButton() {
    $("#Errors").empty();
    $.post("FileWebsite_server.php", {
        op: "LogIn",
        email: $("#email").val(),
        password: $("#password").val()
    }, function (data) {
        //console.log(data);
        if ($(data).find("user_type").text() != "logged_out" && $(data).find("user_type").text() != "temp") {
            LogIn();
        }else if($(data).find("user_type").text() == "temp"){
            user_type = "temp";
            changePassword($("#email").val());
        }else{
            addError("Your account information is incorrect");
            $("#loginButton").click(function (e) {
                logInButton();
            });
        }
    });
}

//Files blocked to normal users
var Blacklist = ["", ".", "..", "$RECYCLE.BIN", "bin", "boot", "cdrom", "dev", "lib", "lib32", "lib64", "libx32", "lost+found", "mnt", "proc", "root", "run", "sbin", "snap",
    "srv", "swap.img", "sys", "tmp", "var", "usr", "System Volume Information", "UMS.conf", "UMS.cred", "WMPInfo.xml", "database", "debug.log.prev", "Other", "Kids", "games",
    "data", "Subs", "etc", "opt", "minecraft", "MC", "!Albums", "!Games", "!hidden", "~", "Backups"]; // Blacklisting files we don't want viewable
var DeleteBlacklist = ["", ".", "..", "bin", "boot", "cdrom", "dev", "lib", "lib32", "lib64", "libx32", "lost+found", "mnt", "proc", "root", "run", "sbin", "snap",
    "srv", "swap.img", "sys", "tmp", "var", "usr", "System Volume Information", "UMS.conf", "UMS.cred", "WMPInfo.xml", "database", "debug.log.prev", "Other", "Kids", "games",
    "data", "etc", "opt", "home", "media", "external", "Movies", "southserv", "minecraft", "vpnserver", "world", "~", "Backups"]; //Blacklisting files we don't want to be deletable
//Files blocked from everyone
var Fullblacklist = ["", ".", ".."];
//declaring variables outside so everything can see them
var id = 0;
var currentfiles = []//Array to hold files in
function DisplayFiles(file, index) {// Displaying the files on the page
    let filter = $("#SearchInput").val().trim().toLowerCase();// getting the text in the filter
    let filterFile = file.name.toLowerCase(); //making all checks lowercase
    if ((!Blacklist.includes(file.name) || (user_mode == "admin" && !Fullblacklist.includes(file.name))) && filterFile.includes(filter)) {// removing files that are in the blacklist or not in the filter
        filename = file.name.toString();//changing to string in case of numbers
        let FileType = FindExtension(file)
        if (user_mode == "admin") {
            adminFile(file, id, FileType);
        } else {
            $("#FilesList").append("<tr class = 'result t" + id + "'><td id=" + id + "f class='file'>" + file.name + "</td></tr>");
        }
        let Fileselector = "#" + id + "f";// creating id's
        id++;
        //extension
        switch (FileType) {
            case ("Directory"): //if there is no extension (a folder)
                $(Fileselector).click(function (e) { //binding functions to each bit of text
                    PrintFiles(currentpath + file.name + "/");
                    currentpath = currentpath + file.name + "/";
                });
                break;
            case ("php"): // opens php files -- shown by the browser
            case ("pdf"): // opens pdf files -- shown by the browser
            case ("html"): //opens html files -- shown by the browser
                $(Fileselector).click(function (e) {
                    filepath = currentpath + file.name;
                    filearr = filepath.split("/");
                    filearr.splice(0, 2);
                    currentfile = filearr.join("/");
                    window.location.href = currentfile;
                });
                break;
            case ("mp4")://opens mp4 files - video viewer
                $(Fileselector).click(function (e) {
                    $("#Files").hide();
                    $("#Video").show();
                    let filepath = currentpath + file.name;
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
            case ("log"):
            case ("file"):
            case ("js"):
            case ("txt"): //if the file can be edited
                $(Fileselector).click(function (e) {
                    editFile(file.name);
                });
                break;
        }
    }

}

function PrintFiles(path) {// Getting the files from the Server
    $("#Errors, #FilesList").empty();
    $("#DialogBox").hide();
    filearray = [];
    $.post("FileWebsite_server.php", {
        op: "ShowFiles",
        directory: path
    }, function (data, status) {
        TableStart(); //creating the back button and path viewer
        if (status == "success") {
            $("#FilesList").empty();
            filearray = [];
            $(data).find("file").each(function () { filearray.push(new fileClass($(this).text(), "")) });
            $(data).find("file_type").each(function (index) { filearray[index].fileType = $(this).text() })
            id = 0;
            if (currentpath.length > 1) {// if the path you are at isnt blank or /, the back button works
                Back();
            };
            $("#FilesList").empty();
            filearray.forEach(DisplayFiles);
            console.log("File count:" + id);//gives incrementing id's to every file in the list
        } else {
            console.log("status:" + status)
        }
    });
}

function Back() {//The Back to Parent folder button
    $("#back").click(function (e) {
        $("#FilesList").empty();
        let slashremove = currentpath.split('');
        slashremove.splice(-1, 1);
        let prevdir = slashremove.join('');
        prevdir = prevdir.substring(0, prevdir.lastIndexOf('/') + '/'.length);//removing the most recent file added to the path
        if (prevdir.length == 0) {
            prevdir = "/";
        }
        PrintFiles(prevdir);
        currentpath = prevdir;
    });
}

function FindExtension(file) {//finds the extension on the end of the file name
    if (file.fileType != "Dir") {
        let filename = file.name.substring(file.name.length - 5);
        if (filename.includes(".")) { //checking if the filename contains a .
            let arr = filename.split(".");
            return arr.pop();
        } else {
            return "file";
        }
    } else {
        return "Directory";
    }
}


function TableStart() {//empties the error area and the table for the files
    $("#FileExtra").empty();
    $("#FileExtra").append("<tr><td id='CurrentPath'>" + currentpath + "</td></tr><tr><td id='back'>Back to Parent folder</td></tr>")
}

function LogOut() { //logging out
    $.post("FileWebsite_server.php", {
        op: "LogOut"
    }, function (data, Status) {//hiding the file browser and showing the login form
        if($(data).find("user_type").text() == "logged_out"){
            $("#Files, #adminMode").hide();
            $("#loginForm").show();
            $("#loginButton").click(function (e) {
                LogIn();
            });
            user_type = "logged_out";
            $("#loginFormContact").click(function (e) {
                ShowContactForm();
            });
            $("#requestAccountButton").click(function (e) {
                requestAccountform();
            });
            $("#resetPasswordButton").click(function (e) { 
                resetpassword();
            });
        }else{
            addError("There was a problem with logging out, contact an administrator");
        }
    });
}

function AdminToggle() {
    if (user_type == "admin") {
        if (user_mode == "user") {
            user_mode = "admin";
            PrintFiles(currentpath);
            $("#adminArea").show();
            adminArea();
        } else { //if the user is admin
            user_mode = "user"
            PrintFiles(currentpath);
            $("#adminArea").hide();
        }
    }
}

function adminArea() {// Creating the admin area
    if (user_mode == "admin") {
        $("#adminArea").empty();
        $("#adminArea").append(`
            <input type='password' id='adminPassword' placeholder='Admin Password'>
            <button id='CreateUser' class='accountButton'>Create User</button>
            <button id='UploadFile' class='accountButton'>Upload File to current Directory</button>
            <button id='Create' class='accountButton'>Create File or Folder</button>
            <button id='showUsersButton' class='accountButton'>Show Users</button>
            <button id='showUserRequestsButton' class='accountButton'>Show User Requests</button>
            
            <div id='adminAreaContent'></div>
            `);// Adding admin buttons
        $("#CreateUser").click(function (e) {
            $("#DialogBox").toggle();
            createDialogBox(`<input type='text' id='userName' placeholder='New User Name'>
            <br><input type='text' id='userEmail' placeholder='New User Email'>
            <br><input type='password' id='userPassword' placeholder='New User password'>
            <br><button id='confirmUser' class='accountButton'>Create</button>`, "main");// Adding buttons for creating users
            $("#confirmUser").click(function (e) {
                if ($("#userEmail").val().length >= 10 && $("#userPassword").val().length >= 5) {
                    $.post("FileWebsite_server.php", {
                        op: "CreateUser",
                        name: $("#userName").val(),
                        email: $("#userEmail").val(),
                        password: $("#userPassword").val()
                    }, function (data) {
                        if ($(data).find("result").text() == "OK") {
                            alert("User with Email: " + $("#userEmail").val() + " added");
                            $("#createUserFields").empty();
                        } else {
                            alert("Error with account creation")
                        }
                    });
                } else {
                    alert("Information entered too short");
                }
            });
        });
        $("#UploadFile").click(function (e) { //Binding the upload button
            $("#DialogBox").toggle();
            Fileuploaddata = 'op=UploadForm&file=' + currentpath;//creating the iframe for uploading
            createDialogBox(`<iframe src='FileWebsite_server.php?${Fileuploaddata}' style='border:none; width:300px; overflow:clip; height:100px;'></iframe>`, "main");
            $("#UploadFilesubmit").click(function (e) {
                PrintFiles(currentpath);
            });
        });
        $("#Create").click(function (e) {
            $("#DialogBox").toggle();
            createDialogBox(`<div id='FileOrFolderDiv'><select id='FileOrFolder'><option value='Blank'></option><option value='Folder'>Folder</option><option value='File'>File</option></select><div id='CreationFields'></div></div>`, "main");
            $("#FileOrFolder").bind("change", function (e) {
                if ($("#FileOrFolder").val() != "Blank") {
                    let name = "", type = "";
                    if ($("#FileOrFolder").val() == "File") {
                        name = "New File Name and Extension", type = "File";
                    } else {
                        name = "New Folder Name", type = "Folder";
                    }
                    let CreateFieldData = `op=CreateFoFForm&name=${name}&type=${type}&path=${currentpath}`;
                    $("#CreationFields").empty();
                    $("#CreationFields").html(`
                    <input type='text' name='Name' id='FileorFolderInput' placeholder='${name}'>
                    <button id='createFileorFolderConfirm'>Create</button>`);
                    $("#createFileorFolderConfirm").click(function (e) {
                        $.post("FileWebsite_server.php", {
                            op: "Create",
                            FileType: type,
                            Name: $("#FileorFolderInput").val(),
                            Path: currentpath
                        }, function (data) {
                            //console.log(data)
                            if ($(data).find("result").text() == "OK") {
                                $("#FileOrFolderDiv").html(`<p>Created successfully</p>`);
                                PrintFiles(currentpath);
                            } else if ($(data).find("result") == "FAILED") {
                                $("#FileOrFolderDiv").html(`<p>Creation failed</p>`);
                            } else if ($(data).find("result").text() == "EXISTS") {
                                $("#FileOrFolderDiv").html(`<p>Already exists</p>`);
                            }
                        });
                    });
                } else {
                    $("#CreationFields").empty();
                }
            });
        });
        $("#showUsersButton").click(function (e) { 
            showUsersTable("USERS");
        },);
        $("#showUserRequestsButton").click(function (e) { 
            showUsersTable("ACCOUNT_REQUESTS")
        });
    }
}

function convertFile(file) {// video file converting
    if (user_mode == "admin" && user_type == "admin") {
        $.post("FileWebsite_server.php", {
            op: "adminpasscheck",
            input: $("#adminPassword").val()
        }, function (data) {
            if ($(data).find("result").text() == "true") {
                DialogBox("<div id='fileConversionDiv'></div>");
                newfile = prompt("New File name (Relative not absolute) and extension\n Currently" + currentpath + file);// means that you type in Cars(2006).mp4 not /media/external/Movies/Cars(2006)/Cars(2006).mp4
                $.post("FileWebsite_server.php", {
                    op: "ConvertVideo",
                    currentfile: currentpath + file,
                    newfile: currentpath + newfile
                }, function (data) {
                    PrintFiles(currentpath);
                });
            }
        });
    }

}

function adminFile(file, id, extension) {//Creating extra button for admin users
    let Buttons = "<tr class = 'result t" + id + "'><td id=" + id + "f class='file'>" + file.name + "</td><td id='manageid" + id + "' class='ManageButtons'>Manage</td></tr>";
    let DialogBox = "<p id='renameid" + id + "' class='AdminOptions'>Rename</p><p id='editid" + id + "' class='AdminOptions'>Edit</p>"
    if (file.fileType == "File") {
        DialogBox = DialogBox + "<p id='deleteid" + id + "' class='AdminOptions'>Delete</p>";
    } else {
        DialogBox = DialogBox + "<p id='deleteDirId" + id + "' class='AdminOptions'>Delete</p>"
    }
    if (extension == "avi" || extension == "mkv" || extension == "mp4") {
        DialogBox = DialogBox + "<p id='convertid" + id + "' class='AdminOptions'>Convert</p>";
    }
    filepath = currentpath + file.name;
    let filearr = filepath.split("/");
    filearr.splice(0, 2);
    let currentfile = filearr.join("/");
    DialogBox = DialogBox + "<div id='downloadid" + id + "' class='AdminOptions'><a href='" + currentfile + "' download='" + file.name + "'>Download</a></div>"; 
    $("#FilesList").append(Buttons);//extra button binding
    $("#manageid" + id).click(function (e) {
        createDialogBox(DialogBox, "main");
        $("#deleteid" + id).click(function (e) {
            deleteFile(file.name);
        });
        $("#deleteDirId" + id).click(function (e) {
            DeleteDir(file.name);
        });
        $("#convertid" + id).click(function (e) {
            convertFile(file.name);
        });
        $("#renameid" + id).click(function (e) {
            renameFile(file.name)
        });
        $("#editid" + id).click(function (e) {
            editFile(file.name)
        });
    });
}

function renameFile(file) {
    if (user_type == "admin" && user_mode == "admin") {
        $.post("FileWebsite_server.php", {
            op: "adminpasscheck",
            input: $("#adminPassword").val()
        }, function (data) {
            if ($(data).find("result").text() == "true") {
                createDialogBox("<input type='text' id='RenameInput' value='"+file+"'><br><button id='confirmRename' class='accountButton'>Rename</button>", "secondary");
                $("#confirmRename").click(function (e) { 
                    newname = $("#RenameInput").val();
                    if (newname != "" && newname != null) {
                        $.post("FileWebsite_server.php", {
                            op: "rename",
                            currentfile: currentpath + file,
                            newfile: currentpath + newname
                        }, function (data) {
                            PrintFiles(currentpath)
                        });
                    } else {
                        alert("New Name too short")
                    }
                });
            }
        });
    }
}

function deleteFile(file) {
    if (!DeleteBlacklist.includes(file)) {
        if (user_mode == "admin" && user_type == "admin") {
            $.post("FileWebsite_server.php", {
                op: "adminpasscheck",
                input: $("#adminPassword").val()
            }, function (data) {
                if ($(data).find("result").text() == "true") {
                    createDialogBox("<div id='deleteConfirmDiv'><p>Are you sure you want to delete "+currentpath+file+"?</p><br><button id='deleteConfirmTrue' class='accountButton deleteConfirmButtons'>Yes</button><button id='deleteConfirmFalse' class='accountButton deleteConfirmButtons'>No</button></div>", "secondary");
                    $(".deleteConfirmButtons").click(function (e) { 
                        if(e.target.id.includes("True")){
                            $.post("FileWebsite_server.php", {
                                op: "Delete",
                                file: currentpath + file
                            },function () {
                                PrintFiles(currentpath);
                                $("#secondaryDialogBox").html("<p id='closePopup' class='accountButton closePopup'>x</p><br><p>File successfully deleted</p>");
                                $(".closePopup").click(function (e) {
                                    //console.log(e.target.parentNode.id)
                                    $("#" + e.target.parentNode.id + ",#secondaryDialogBox").hide();
                                });
                            });
                        }else{
                            $("#secondaryDialogBox").html("<p id='closePopup' class='accountButton closePopup'>x</p><br><p>File deletion aborted</p>");
                            $(".closePopup").click(function (e) {
                                //console.log(e.target.parentNode.id)
                                $("#" + e.target.parentNode.id + ",#secondaryDialogBox").hide();
                            });
                        }
                    });
                }
            });
        }
    } else {
        alert("This file can not be deleted");
    }
}

function DeleteDir(file) {
    if (!DeleteBlacklist.includes(file)) {
        if (user_mode == "admin" && user_type == "admin") {
            $.post("FileWebsite_server.php", {
                op: "adminpasscheck",
                input: $("#adminPassword").val()
            }, function (data) {
                if ($(data).find("result").text() == "true") {
                    createDialogBox("<div id='deleteConfirmDiv'><p>Are you sure you want to delete "+currentpath+file+"/?</p><br><button id='deleteConfirmTrue' class='accountButton deleteConfirmButtons'>Yes</button><button id='deleteConfirmFalse' class='accountButton deleteConfirmButtons'>No</button></div>", "secondary");
                    $(".deleteConfirmButtons").click(function (e) { 
                        if(e.target.id.includes("True")){
                            $.post("FileWebsite_server.php", {
                                op: "DeleteDir",
                                file: currentpath + file
                            }, function (data) {
                                PrintFiles(currentpath);
                                $("#secondaryDialogBox").html("<p id='closePopup' class='accountButton closePopup'>x</p><br><p>Directory successfully deleted</p>");
                                $(".closePopup").click(function (e) {
                                    //console.log(e.target.parentNode.id)
                                    $("#" + e.target.parentNode.id + ",#secondaryDialogBox").hide();
                                });
                            });
                        }else{
                            $("#secondaryDialogBox").html("<p id='closePopup' class='accountButton closePopup'>x</p><br><p>Directory deletion aborted</p>");
                            $(".closePopup").click(function (e) {
                                //console.log(e.target.parentNode.id)
                                $("#" + e.target.parentNode.id + ",#secondaryDialogBox").hide();
                            });
                        }
                    });
                }
            });
        }
    } else {
        alert("This file can not be deleted");
    }
}

function editFile(file) {
    if (user_type == "admin") {
        $.post("FileWebsite_server.php", {
            op: "getFileContents",
            file: currentpath + file
        }, function (data, Status) {
            if (Status == "success") {
                AdminToggle();
                EditorShown = true;
                $("#adminMode, #Files, #adminArea").hide();
                $("#Editor").show();
                $("#Editor").append(`<button id='EditorBack'>Back</button><button id='EditorSave'>Save</button><span id='SaveResult'></span>
                <textarea class='cmArea'></textarea>`);
                let textstring = "";
                $(data).find("line").each(function () { textstring = textstring + $(this).text() });
                var code = $(".cmArea")[0];
                editor = CodeMirror.fromTextArea(code, {
                    mode: "php",
                    tabMode: 'indent',
                    lineNumbers: true,
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
        });
    }
}

function SaveFile(file) {
    if (EditorShown == true) {
        let LineCount = editor.lineCount();
        let SaveString = "";
        let i = 0;
        while (i < LineCount) {
            if (editor.getLine(i) != undefined) {
                SaveString = SaveString + editor.getLine(i) + "\n";
            }
            i++
        }
        $.post("FileWebsite_server.php", {
            op: "saveFile",
            text: SaveString,
            file: currentpath + file
        }, function (data) {
            if ($(data).find("result").text() == "OK") {// File saved successfully
                $("#SaveResult").html(`<span>File Saved.</span>`);
            } else {
                $("#SaveResult").html(`<span>File Save Failed.</span>`);
            }
        });
    }
}

function ShowContactForm() {
    $("#MainContent, #loginForm").hide();
    $("#formDiv").html(`<p id='ContactFormBack'>Back</p><span class='fieldLabel'>Name</span><input type='text' name='Name' id='ContactNameInput' placeholder='Your name'><br>
    <span class='fieldLabel'>Email</span><input type='text' name='Email' id='ContactEmailInput' placeholder='Your Email'><br>
    <span class='fieldLabel'>Subject</span><input type='text' name='Subject' id='ContactSubjectInput' placeholder='Subject'><br>
    <span class='fieldLabel'>Email Content</span><textarea name='EmailContent' id='ContactContentInput' placeholder='Content' form='ContactForm'></textarea><br>
    <button id='contactFormSubmit'>Submit</button>`);
    $("#contactFormSubmit").click(function (e) {
        $.post("FileWebsite_server.php", {
            op: "Contact",
            Name: $("#ContactNameInput").val(),
            Subject: $("#ContactSubjectInput").val(),
            Email: $("#ContactEmailInput").val(),
            EmailContent: $("#ContactContentInput").val()
        }, function (data) {
            if ($(data).find("result").text() == "OK") {
                alert("Email Sent")
            } else {
                alert($(data).find("result").text());
            }
        });
    });
    $("#ContactFormBack").click(function (e) {
        mainPage();
    });
}

$(document).mousemove(function (t) {
    mouse.x = t.pageX;
    //console.log(mouse.x);
    mouse.y = t.pageY;
    //console.log(mouse.y);
});

function createDialogBox(html, box) {
    selector = "test"
    if(box == "main"){
        selector = "#DialogBox";
    }else if(box == "secondary"){
        selector = "#secondaryDialogBox";
    }
    $(selector).html(`<p id='closePopup' class='accountButton closePopup'>x</p><br>` + html);
    $(selector).css({
        top: mouse.y,
        left: mouse.x,
        "max-height": 200,
        "overflow-y": "auto",
        "display": "block"
    });
    $(selector).show();
    $(".closePopup").click(function (e) {
        //console.log(e.target.parentNode.id)
        $("#" + e.target.parentNode.id + ",#secondaryDialogBox").hide();
    });
}

function requestAccountform() {
    $('#loginForm').hide();
    $("#formDiv").html(`<p id='requestAccountFormBack'>Back</p><p id='requestAccountFormTitle'>Request an account</p>
    <span class='fieldLabel'>Name</span><input type='text' id='requestAccountFormName'><br>
    <span class='fieldLabel'>Email</span><input type='text' id='requestAccountFormEmail'><br>
    <span class='fieldLabel'>Password</span><input type='password' id='requestAccountFormPassword'><br>
    <span class='fieldLabel'>Number*</span><input type='text' id='requestAccountFormNumber'><br>
    <button id='requestAccountFormButton' class='accountButton'>Request</button><br>
    <p id='OptionalText'>* is Optional</p>`);
    $("#requestAccountFormButton").click(function (e) {
        $.post("FileWebsite_server.php", {
            op: "createAccountRequest",
            name: $("#requestAccountFormName").val(),
            email: $("#requestAccountFormEmail").val(),
            password: $("#requestAccountFormPassword").val(),
            number: $("requestAccountFormNumber").val()
        }, function (data) {
            if ($(data).find("result").text() == "OK") {
                addError("Account Requested");
            } else {
                addError($(data).find("result").text());
            }
        });
    });
    $("#requestAccountFormBack").click(function (e) { 
        mainPage();
    });
}

function addError(errorContent) {
    $("#Errors").empty();
    $("#Errors").html(`<p id='errorText'>${errorContent}</p>`);
}

function showAccountMenu() {
    $("#MainContent").hide();
    $("#accountArea").show();
    $.post("FileWebsite_server.php", {
        op: "getAccountInfo"
    }, function (data) {
        if ($(data).find("result").text() == "OK"){
            $("#accountArea").html(`<p id='accountAreaBack'>Back</p>
            <table id='accountAreaTable'>
            <tr><td id='tableNameTitle' class='accountAreaTitles'>Name:</td><td><input type='text' id='tableNameContent' class='AccountMenuData AccountMenuTextBox' value='${$(data).find("name").text()}'></td></tr>
            <tr><td id='tableEmailTitle' class='accountAreaTitles'>Email:</td><td><input type='text' id='tableEmailContent' class='AccountMenuData AccountMenuTextBox' value='${$(data).find("email").text()}'></td></tr>
            <tr><td id='tablePasswordTitle' class='accountAreaTitles'>Password:</td><td id='tablePasswordContent'>Click here to change your password</td></tr>
            <tr><td id='tableNumberTitle' class='accountAreaTitles'>Number:</td><td><input type='text' id='tableNumberContent' class='AccountMenuData AccountMenuTextBox' value='${$(data).find("number").text()}'></td></tr>
            <tr><td id='tableSessionsTitle' class='accountAreaTitles'>Sessions:</td><td id='tableSessionsContent'>${$(data).find("sessions").text()}</td></tr>
            <tr><td id='sessionRemovalTitle'class='accountAreaTitles'>Remove other Sessions</td><td id='removeOtherSessionsButtonTable'><button id='removeOtherSessionsButton' class='accountButtons'>Remove</button></td></tr></table>`);
            $("#tablePasswordContent").click(function (e) { 
                changePassword();
            });
            $("#accountAreaBack").click(function (e) { 
                mainPage();
            });
            $("#removeOtherSessionsButton").click(function (e) { 
                clearAllOtherSessions();
            });
            $(".AccountMenuData").bind("change", function (e) { 
                ParentNode = e.target.parentNode.id;
                selector = ("#" + ParentNode);
                //Id = ParentNode.match(/(\d+)/)[0];
                console.log(Id = $("Table" + ParentNode + "Content").text());

            });
        }else{
            addError("Your account was not found, please contact an administrator")
        }
    });
}

function resetpassword(){
    $("#loginForm").hide();
    $("#formDiv").show();
    $("#formDiv").html(`<p id='passwordResetBack'>Back</p><span class='fieldLabel'>Email</span>
    <input type='text' id='passwordResetInput'><br>
    <button id='resetPasswordConfirmButton' class='accountButton'>Reset Password</button>`);
    $("#resetPasswordConfirmButton").click(function(e){ 
        $("#resetPasswordConfirmButton").unbind("click");
        let PasswordInput = $("#passwordResetInput").val();
        //console.log($("#passwordResetInput").val());
        if($("#passwordResetInput").val() != ""){
            $.post("FileWebsite_server.php", {
                op:"resetPassword",
                email:PasswordInput
            },function (data) {
                //console.log($(data).find("result").text());
                if($(data).find("result").text() == "OKOK"){
                    $("#formDiv").html(`<p>A email has been sent to ${PasswordInput}.</p>`);
                }else{
                    $("#formDiv").html(`<p>There was a problem resetting your password, please contact an administrator or change the email to a valid email.</p>`);
                }
            },);
        }
    });
    $("#passwordResetBack").click(function (e) { 
        mainPage();
    });
}

function clearAllOtherSessions(){
    $.post("FileWebsite_server.php", {
        op:"removeOtherSessions"
    },function (data) {
        if($(data).find("result").text() == "OK"){
            $("#removeOtherSessionsButtonTable").html(`<p>All other sessions cleared.</p>`);
        }
    },);
}

function changePassword(email){
    $("#loginForm, #MainContent, #accountArea").hide();
    var changePasswordOld;
    if(user_type != "logged_out" && user_type != "temp"){//admin or user
        $("#formDiv").html(`<p id='changePasswordBack'>Back</p><br><span class='fieldLabel'>New Password</span><input type='password' placeholder='New Password' id='changePasswordInput'><br>
        <span class='fieldLabel'>password Confirm</span><input type='password' placeholder='New Password Confirm' id='changePasswordInputConfirm'><br>
        <span class='fieldLabel'>Old password</span><input type='password' placeholder='Old Password' id='changePasswordOld'><br>
        <button id='changePasswordConfirmButton' class='accountButton'>Change</button>`);
    }else if(user_type == "temp"){
        $("#formDiv").html(`<p id='changePasswordBack'>Back</p><br><span class='fieldLabel'>New Password</span><input type='password' placeholder='New Password' id='changePasswordInput'><br>
        <span class='fieldLabel'>password Confirm</span><input type='password' placeholder='New Password Confirm' id='changePasswordInputConfirm'><br>
        <button id='changePasswordConfirmButton' class='accountButton'>Change</button>`);
    }
    $("#changePasswordBack").click(function (e) { 
        mainPage();
    });
    if(user_type != "temp"){
        changePasswordOld = $("#changePasswordOld").val();
    }else{
        changePasswordOld = null;
    }
    $("#changePasswordConfirmButton").click(function (e) { 
        if($("#changePasswordInput").val() == $("#changePasswordInputConfirm").val()){
            $.post("FileWebsite_server.php", {
                op:"changePassword",
                user_type:user_type,
                newPass:$("#changePasswordInput").val(),
                oldPass:changePasswordOld,
                email:email
            },function (data) {
                if($(data).find("result").text() == "OK"){
                    $("#formDiv").html(`<p id='changePasswordBack'>Back</p><br><p>Your password has been changed.</p>`);
                }else{
                    $("#formDiv").html(`<p id='changePasswordBack'>Back</p><br><p>There was an error resetting your password please contact an administrator</p>`)
                }
                user_type = "logged_out";
                $("#changePasswordBack").click(function (e) { 
                    mainPage();
                });
            },);
        }else{
            addError("Passwords don't match")
        }
    });
}

function showUsersTable(table){
    $.post("FileWebsite_server.php",{
        op: "getAllUsers",
        table:table
    },function (data){
        userTableDataArray = [], userTable = "";
        $(data).find("user_id").each(function() { userTableDataArray.push(new UserTableClass($(this).text()))});
        $(data).find("name").each(function(index) {userTableDataArray[index].name = $(this).text()});
        $(data).find("email").each(function(index) {userTableDataArray[index].email = $(this).text()});
        $(data).find("password").each(function(index) {userTableDataArray[index].password = $(this).text()});
        $(data).find("user_type").each(function(index) {userTableDataArray[index].user_type = $(this).text()});
        $(data).find("number").each(function(index) {userTableDataArray[index].number = $(this).text()});
        $(data).find("temp_pass").each(function(index) {userTableDataArray[index].temp_pass = $(this).text() || "null"});
        $.each(userTableDataArray, function (index) { 
            userTable = userTable + `<tr><td id='userTableUserId${index}' class='allUsersTable userIdTable' title='Delete User'>${userTableDataArray[index].user_id}</td>
            <td id='userTableName${index}' class='allUsersTable'><input type='text' id='NameInput${index}' class='tableTextBox' value='${userTableDataArray[index].name}'></td>
            <td id='userTableEmail${index}' class='allUsersTable'><input type='text' id='EmailInput${index}' class='tableTextBox' value='${userTableDataArray[index].email}'></td>
            <td id='userTablePassword${index}' class='allUsersTable'><input type='text' id='PasswordInput${index}' class='tableTextBox' value='${userTableDataArray[index].password}'></td>
            <td id='userTableUserType${index}' class='allUsersTable'>${MakeTableUserTypeDefaults(userTableDataArray[index].user_type, userTableDataArray[index].user_id, index)}</td>
            <td id='userTableNumber${index}' class='allUsersTable'><input type='text' id='NumberInput${index}' class='tableTextBox' value='${userTableDataArray[index].number}' style='width:200px;'></td>
            <td id='userTableTempPass${index}' class='allUsersTable'>${userTableDataArray[index].temp_pass}</td></tr>`
        });
        //console.log(userTableDataArray);
        $("#adminAreaContent").html(`<p id='closeTable' class='accountButton'>x</p><div id='usersTable'>
        <table><tr><td>ID</td><td>Name</td>
        <td>Email</td><td>Password</td><td>User Type</td><td>Number</td><td>Temp Pass</td>${userTable}</table></div>`);
        $("#closeTable").click(function (e) { 
            $("#adminAreaContent").empty();
        });
        $(".allUsersTable").bind("change", function (e) {
            ParentNode = e.target.parentNode.id;
            selector = ("#" + ParentNode);
            Id = ParentNode.match(/(\d+)/)[0];
            Id = $("#userTableUserId" + Id).text();
            var TableUserType, TableEmail, TablePassword, TableNumber, Tablename;
            if(ParentNode.includes("UserType")){
                TableUserType = $("#" + ParentNode + " option:selected").text();
            }else if(ParentNode.includes("Email")){
                TableEmail = $("#" + e.target.id).val();
            }else if(ParentNode.includes("Password")){
                TablePassword = $("#" + e.target.id).val();
            }else if(ParentNode.includes("Number")){
                TableNumber = $("#" + e.target.id).val(); 
            }else if(ParentNode.includes("Name")){
                Tablename = $("#" + e.target.id).val();
            }
            $.post("FileWebsite_server.php",{
                op:"updateUser",
                table:table,
                user_id:Id,
                name:Tablename,
                email:TableEmail,
                password:TablePassword,
                number:TableNumber,
                user_type:TableUserType
            },function (data) {
                //console.log($(data).find("result").text());
            },);
        });
        $(".userIdTable").click(function (e) { 
            DeleteId = e.target.id.match(/(\d+)/)[0]
            if(confirm("Are you sure you want to delete this user?")){
                $.post("FileWebsite_server.php", {
                    op: "adminpasscheck",
                    input: $("#adminPassword").val()
                }, function (data) {
                    if ($(data).find("result").text() == "true") {
                        $.post("FileWebsite_server.php", {
                            op:"deleteUser",
                            id:DeleteId,
                            table:table
                        },function (data) {
                            if($(data).find("result").text() == "OK"){
                                alert("User Deleted");
                            }
                        },);
                    }else{
                        alert("Check Admin Password");
                    }
                });
            }
        });
    });
}

function MakeTableUserTypeDefaults(user_type, user_id, index){
    switch(user_type){
        case "admin":
            output = "<option selected>admin</option><option>user</option><option>requested</option>";
        break;
        case "user":
            output = "<option>admin</option><option selected>user</option><option>requested</option>";
        break;
        case "requested":
            output = "<option>admin</option><option>user</option><option selected>requested</option>";
        break;
        default:
            output = "<option>ERROR</option>";
        break;
    }
    return `<select id='userTypeSelect${index}'>${output}</select>` 
}