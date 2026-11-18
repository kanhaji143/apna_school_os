' ==============================================================================
' Apna School OS - Enterprise Standalone Desktop Launcher
' Maintained by Apna Software Hub | 100% Offline Secured | Helpline: +91 8504985149
' ==============================================================================

Option Explicit
Dim WshShell, fso, strDir, nodeExe, serverScript, browserExe, browserArgs
Dim httpObj, i, serverReady, localAppData, activePort, logDir, logFile, cmdLine

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
localAppData = WshShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
activePort = 8085

' Ensure log directory exists
logDir = localAppData & "\ApnaSchoolOS\logs"
On Error Resume Next
If Not fso.FolderExists(localAppData & "\ApnaSchoolOS") Then fso.CreateFolder(localAppData & "\ApnaSchoolOS")
If Not fso.FolderExists(logDir) Then fso.CreateFolder(logDir)
On Error GoTo 0
logFile = logDir & "\server_startup.log"

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

' 2. Check if server is already running
serverReady = False
Set httpObj = CreateObject("MSXML2.ServerXMLHTTP.6.0")

On Error Resume Next
httpObj.Open "GET", "http://127.0.0.1:8085/api/health", False
httpObj.setTimeouts 600, 600, 600, 600
httpObj.Send
If Err.Number = 0 Then
    If httpObj.Status = 200 Then serverReady = True
End If
Err.Clear
On Error GoTo 0

If Not serverReady Then
    ' Start server in background with error logging enabled
    cmdLine = "cmd.exe /c " & Chr(34) & Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverScript & Chr(34) & " >> " & Chr(34) & logFile & Chr(34) & " 2>&1" & Chr(34)
    WshShell.CurrentDirectory = strDir
    WshShell.Run cmdLine, 0, False
    
    ' Poll until server responds with HTTP 200 (up to 15 seconds)
    For i = 1 To 30
        WScript.Sleep 500
        
        ' Read dynamic port if written
        Dim pf1
        pf1 = localAppData & "\APNA_RMS_DATA\active_port.txt"
        If fso.FileExists(pf1) Then
            On Error Resume Next
            Dim oP: Set oP = fso.OpenTextFile(pf1, 1)
            Dim pVal: pVal = Trim(oP.ReadLine())
            oP.Close
            If IsNumeric(pVal) And Len(pVal) >= 4 Then activePort = CInt(pVal)
            On Error GoTo 0
        End If
        
        On Error Resume Next
        httpObj.Open "GET", "http://127.0.0.1:" & activePort & "/api/health", False
        httpObj.setTimeouts 500, 500, 500, 500
        httpObj.Send
        If Err.Number = 0 Then
            If httpObj.Status = 200 Then
                serverReady = True
                Exit For
            End If
        End If
        Err.Clear
        On Error GoTo 0
    Next
End If

' 3. Safety Check: If server failed to start, DO NOT open empty browser!
If Not serverReady Then
    Dim errSnippet: errSnippet = ""
    If fso.FileExists(logFile) Then
        On Error Resume Next
        Dim oErrLog: Set oErrLog = fso.OpenTextFile(logFile, 1)
        errSnippet = oErrLog.ReadAll
        oErrLog.Close
        On Error GoTo 0
    End If
    If Len(errSnippet) > 400 Then errSnippet = Right(errSnippet, 400)
    
    MsgBox "Apna School OS को प्रारंभ करने में समस्या आई है:" & vbCrLf & vbCrLf & _
           "1. कृपया शॉर्टकट पर राइट-क्लिक करके 'Run as administrator' चलाएं।" & vbCrLf & _
           "2. यदि आवश्यक हो तो तकनीकी सहायता हेतु 8504985149 पर संपर्क करें।" & vbCrLf & vbCrLf & _
           "तकनीकी विवरण:" & vbCrLf & errSnippet, vbCritical, "Apna School OS Startup Error"
    WScript.Quit 1
End If

' 4. Detect Native App Mode browser (Edge Chromium or Chrome)
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
    browserArgs = " --app=http://127.0.0.1:" & activePort & " --user-data-dir=" & Chr(34) & localAppData & "\ApnaSchoolOS\app_profile" & Chr(34) & " --window-size=1366,768"
    WshShell.Run Chr(34) & browserExe & Chr(34) & browserArgs, 1, False
Else
    ' Fallback to default browser
    WshShell.Run "http://127.0.0.1:" & activePort, 1, False
End If
