' Apna School OS - Enterprise Desktop Launcher
' Maintained by Apna Software Hub | 100% Offline Secured | Helpline: 8504985149

Option Explicit
Dim WshShell, fso, strDir, nodeExe, serverScript, isRunning, http, errCount

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Locate Node.js executable (bundled or installed)
nodeExe = ""
If fso.FileExists(strDir & "\bin\node.exe") Then
    nodeExe = strDir & "\bin\node.exe"
ElseIf fso.FileExists(strDir & "\app\bin\node.exe") Then
    nodeExe = strDir & "\app\bin\node.exe"
ElseIf fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    nodeExe = "C:\Program Files\nodejs\node.exe"
Else
    ' Try PATH
    On Error Resume Next
    Dim oExec: Set oExec = WshShell.Exec("where node")
    If Not oExec Is Nothing Then
        Dim line: line = Trim(oExec.StdOut.ReadLine())
        If fso.FileExists(line) Then nodeExe = line
    End If
    On Error GoTo 0
End If

' If node is still missing, notify user cleanly without hanging
If nodeExe = "" Then
    MsgBox "Apna School OS Startup Notice:" & vbCrLf & vbCrLf & _
           "The standalone Node runtime engine (bin\node.exe) was not found in:" & vbCrLf & _
           strDir & "\bin\" & vbCrLf & vbCrLf & _
           "Please reinstall using Setup_Apna_School_OS.exe or contact support:" & vbCrLf & _
           "Apna Software Hub Helpline: +91 8504985149", vbCritical, "Apna School OS - Launcher"
    WScript.Quit 1
End If

serverScript = strDir & "\app\src\server.js"
If Not fso.FileExists(serverScript) Then
    MsgBox "Application server script missing: " & vbCrLf & serverScript, vbCritical, "Apna School OS"
    WScript.Quit 1
End If

' 2. Check if server is already running on port 8085
isRunning = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.setTimeouts 1000, 1000, 1000, 1000
http.Open "GET", "http://127.0.0.1:8085/", False
http.Send
If http.Status = 200 Then
    isRunning = True
End If
On Error GoTo 0

' 3. If not running, start server in completely hidden background mode
If Not isRunning Then
    WshShell.CurrentDirectory = strDir
    WshShell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverScript & Chr(34), 0, False
    
    ' Wait for server to bind port and accept connections (max 6 seconds)
    Dim attempts: attempts = 0
    Do While attempts < 6
        WScript.Sleep 1000
        attempts = attempts + 1
        On Error Resume Next
        Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
        http.setTimeouts 1000, 1000, 1000, 1000
        http.Open "GET", "http://127.0.0.1:8085/", False
        http.Send
        If http.Status = 200 Then
            Exit Do
        End If
        On Error GoTo 0
    Loop
End If

' 4. Open default web browser to the dashboard
WshShell.Run "http://localhost:8085"
