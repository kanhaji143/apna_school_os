' Apna School OS - Enterprise Desktop Launcher
' Maintained by Apna Software Hub | 100% Offline Secured | Helpline: +91 8504985149

Option Explicit
Dim WshShell, fso, strDir, nodeExe, serverScript, logFile, isRunning, http, attempts

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
logFile = strDir & "\server_startup.log"

' 1. Locate Node.js executable (bundled or installed)
nodeExe = ""
If fso.FileExists(strDir & "\bin\node.exe") Then
    nodeExe = strDir & "\bin\node.exe"
ElseIf fso.FileExists(strDir & "\app\bin\node.exe") Then
    nodeExe = strDir & "\app\bin\node.exe"
ElseIf fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    nodeExe = "C:\Program Files\nodejs\node.exe"
Else
    On Error Resume Next
    Dim oExec: Set oExec = WshShell.Exec("where node")
    If Not oExec Is Nothing Then
        Dim line: line = Trim(oExec.StdOut.ReadLine())
        If fso.FileExists(line) Then nodeExe = line
    End If
    On Error GoTo 0
End If

If nodeExe = "" Then
    MsgBox "Apna School OS Startup Notice:" & vbCrLf & vbCrLf & _
           "Standalone Node engine (bin\node.exe) was not found." & vbCrLf & _
           "Please reinstall or contact Apna Software Hub (+91 8504985149).", vbCritical, "Apna School OS"
    WScript.Quit 1
End If

serverScript = strDir & "\app\src\server.js"
If Not fso.FileExists(serverScript) Then
    MsgBox "Application server script missing: " & vbCrLf & serverScript, vbCritical, "Apna School OS"
    WScript.Quit 1
End If

' 2. Check if server is already responding on port 8085
isRunning = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 800, 800, 800, 800
http.Open "GET", "http://127.0.0.1:8085/", False
http.Send
If http.Status = 200 Then
    isRunning = True
End If
On Error GoTo 0

' 3. If not running, start server in background with error logging
If Not isRunning Then
    WshShell.CurrentDirectory = strDir
    
    ' Launch node server with stdout/stderr logged to server_startup.log
    Dim launchCmd
    launchCmd = "cmd.exe /c " & Chr(34) & Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverScript & Chr(34) & " > " & Chr(34) & logFile & Chr(34) & " 2>&1" & Chr(34)
    WshShell.Run launchCmd, 0, False
    
    ' Wait for server to bind port and accept connections (max 6 seconds)
    attempts = 0
    Do While attempts < 6
        WScript.Sleep 1000
        attempts = attempts + 1
        On Error Resume Next
        Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
        http.setTimeouts 800, 800, 800, 800
        http.Open "GET", "http://127.0.0.1:8085/", False
        http.Send
        If http.Status = 200 Then
            isRunning = True
            Exit Do
        End If
        On Error GoTo 0
    Loop
End If

' 4. Open browser directly to 127.0.0.1 (immune to localhost DNS quirks)
If isRunning Then
    WshShell.Run "http://127.0.0.1:8085"
Else
    ' If server failed to start, read log and inform user
    Dim errMsg: errMsg = ""
    If fso.FileExists(logFile) Then
        On Error Resume Next
        Dim tf: Set tf = fso.OpenTextFile(logFile, 1)
        errMsg = tf.ReadAll()
        tf.Close
        On Error GoTo 0
    End If
    
    If InStr(errMsg, "EADDRINUSE") > 0 Then
        MsgBox "पोर्ट 8085 पहले से व्यस्त है (Port 8085 is in use)!" & vbCrLf & vbCrLf & _
               "कृपया 'Stop_School_RMS.bat' चलाएं अथवा कंप्यूटर रीस्टार्ट करके पुनः खोलें।", vbExclamation, "Apna School OS"
    ElseIf errMsg <> "" Then
        ' Still try opening browser in case it took slightly longer
        WshShell.Run "http://127.0.0.1:8085"
    Else
        WshShell.Run "http://127.0.0.1:8085"
    End If
End If
