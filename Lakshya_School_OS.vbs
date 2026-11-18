' Apna School OS - Enterprise Desktop Launcher
' Maintained by Apna Software Hub | 100% Offline Secured | Helpline: +91 8504985149

Option Explicit
Dim WshShell, fso, strDir, nodeExe, serverScript

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

' 2. Start server directly without CMD wrapper (window style 0 = completely hidden)
WshShell.CurrentDirectory = strDir
WshShell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverScript & Chr(34), 0, False

' 3. Wait 2 seconds for server socket to initialize
WScript.Sleep 2000

' 4. Open default web browser directly to 127.0.0.1:8085
WshShell.Run "http://127.0.0.1:8085"
