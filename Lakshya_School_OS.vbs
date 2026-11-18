' Apna School OS - Enterprise Desktop Launcher
' Maintained by Apna Software Hub | 100% Offline Secured | Helpline: +91 8504985149
' Auto-Port Scanning & Zero-Error Fallback Engine (Ports 8085 - 8095)

Option Explicit
Dim WshShell, fso, strDir, nodeExe, serverScript, logFile
Dim testPort, foundPort, attempts, activePort, http, launchCmd

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

' 2. Check if server is already running on any port between 8085 and 8095
foundPort = 0
For testPort = 8085 To 8095
    On Error Resume Next
    Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    http.setTimeouts 300, 300, 300, 300
    http.Open "GET", "http://127.0.0.1:" & testPort & "/api/profile", False
    http.Send
    If http.Status = 200 Then
        foundPort = testPort
        Exit For
    End If
    On Error GoTo 0
Next

' If already running on any port, just open browser immediately!
If foundPort > 0 Then
    WshShell.Run "http://127.0.0.1:" & foundPort
    WScript.Quit 0
End If

' 3. Start server in background with auto-port hunting
WshShell.CurrentDirectory = strDir
launchCmd = "cmd.exe /c " & Chr(34) & Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverScript & Chr(34) & " > " & Chr(34) & logFile & Chr(34) & " 2>&1" & Chr(34)
WshShell.Run launchCmd, 0, False

' 4. Wait up to 6 seconds for whichever port binds successfully
activePort = 0
For attempts = 1 To 6
    WScript.Sleep 1000
    For testPort = 8085 To 8095
        On Error Resume Next
        Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
        http.setTimeouts 300, 300, 300, 300
        http.Open "GET", "http://127.0.0.1:" & testPort & "/api/profile", False
        http.Send
        If http.Status = 200 Then
            activePort = testPort
            Exit For
        End If
        On Error GoTo 0
    Next
    If activePort > 0 Then Exit For
Next

If activePort = 0 Then
    ' Fallback to active_port.txt if written
    If fso.FileExists(strDir & "\active_port.txt") Then
        On Error Resume Next
        Dim pf: Set pf = fso.OpenTextFile(strDir & "\active_port.txt", 1)
        Dim pt: pt = Trim(pf.ReadLine())
        pf.Close
        If IsNumeric(pt) Then activePort = CInt(pt)
        On Error GoTo 0
    End If
End If

If activePort = 0 Then activePort = 8085

' 5. Open browser seamlessly to the live running port
WshShell.Run "http://127.0.0.1:" & activePort
