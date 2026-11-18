' ==============================================================================
' Apna School OS - Enterprise Standalone Desktop Launcher
' Maintained by Apna Software Hub | 100% Offline Secured | Helpline: +91 8504985149
' ==============================================================================

Option Explicit
Dim WshShell, fso, strDir, nodeExe, serverScript, browserExe, browserArgs
Dim httpObj, i, serverReady, localAppData, targetPort

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
localAppData = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
targetPort = 8085

' 1. Locate Node.js executable (bundled engine takes top priority)
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

' 2. Check if server is already running on port 8085
serverReady = False
Set httpObj = CreateObject("MSXML2.ServerXMLHTTP.6.0")

On Error Resume Next
httpObj.Open "GET", "http://127.0.0.1:8085/api/health", False
httpObj.setTimeouts 600, 600, 600, 600
httpObj.Send
If httpObj.Status = 200 Then serverReady = True
On Error GoTo 0

If Not serverReady Then
    ' Start server in completely hidden background mode (window style 0)
    WshShell.CurrentDirectory = strDir
    WshShell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverScript & Chr(34), 0, False
    
    ' Wait and ping until server responds with HTTP 200 (up to 15 seconds)
    For i = 1 To 30
        WScript.Sleep 500
        On Error Resume Next
        httpObj.Open "GET", "http://127.0.0.1:8085/api/health", False
        httpObj.setTimeouts 500, 500, 500, 500
        httpObj.Send
        If httpObj.Status = 200 Then
            serverReady = True
            Exit For
        End If
        On Error GoTo 0
    Next
End If

' 3. Detect Native App Mode browser (Edge Chromium or Chrome)
' Opens a Dedicated Standalone Desktop Window without URL bar, tabs, or bookmarks
browserExe = ""

If fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
    browserExe = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists("C:\Program Files\Microsoft\Edge\Application\msedge.exe") Then
    browserExe = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    browserExe = "C:\Program Files\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists("C:\Program Files (x86)\Google\Chrome\Application\chrome.exe") Then
    browserExe = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
ElseIf fso.FileExists(localAppData & "\Google\Chrome\Application\chrome.exe") Then
    browserExe = localAppData & "\Google\Chrome\Application\chrome.exe"
End If

If browserExe <> "" Then
    ' Launch as Dedicated Desktop App Window
    browserArgs = " --app=http://127.0.0.1:8085 --user-data-dir=" & Chr(34) & localAppData & "\ApnaSchoolOS\app_profile" & Chr(34) & " --window-size=1366,768"
    WshShell.Run Chr(34) & browserExe & Chr(34) & browserArgs, 1, False
Else
    ' Fallback to default browser
    WshShell.Run "http://127.0.0.1:8085", 1, False
End If
