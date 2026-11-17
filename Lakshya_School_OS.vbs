Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Run launcher script completely hidden in background (window style 0 = hidden)
WshShell.Run Chr(34) & strDir & "\Launch_School_RMS.bat" & Chr(34), 0, False
