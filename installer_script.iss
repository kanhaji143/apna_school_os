; Inno Setup Script for Apna School OS (Apna Institute Edition)
; Developed & Maintained By Apna Software Hub (AI & Technology Division) | Helpline: 8504985149 | Dedicated Port 8085 | 100% Offline Secured

[Setup]
AppId={{D703F7E0-C276-46D1-8BEA-7D4191F6E463}
AppName=Apna School OS
AppVersion=2.0.0
AppVerName=Apna School OS v2.0 (Apna Institute Edition)
AppPublisher=Apna Software Hub
AppPublisherURL=https://apnasoftwarehub.com
AppSupportURL=https://apnasoftwarehub.com
AppUpdatesURL=https://apnasoftwarehub.com
DefaultDirName={autopf}\\Apna School OS
DefaultGroupName=Apna School OS
AllowNoIcons=yes
LicenseFile=
OutputDir=d:\\School_Lakshya
OutputBaseFilename=Setup_Apna_School_OS
SetupIconFile=d:\\School_Lakshya\\app_icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=auto
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkablealone

[Files]
Source: "d:\\School_Lakshya\\bin\\*"; DestDir: "{app}\\bin"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "d:\\School_Lakshya\\app\\*"; DestDir: "{app}\\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "d:\\School_Lakshya\\app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\\School_Lakshya\\Apna_School_OS.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\\School_Lakshya\\01_CLIENT_DEPLOYMENT_PACKAGE\\02_Official_Manuals\\STAFF_TRAINING_MANUAL.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\\School_Lakshya\\01_CLIENT_DEPLOYMENT_PACKAGE\\02_Official_Manuals\\USER_OPERATING_MANUAL.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\\School_Lakshya\\01_CLIENT_DEPLOYMENT_PACKAGE\\02_Official_Manuals\\CLIENT_INSTALLATION_&_TROUBLESHOOTING_GUIDE.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\\School_Lakshya\\01_CLIENT_DEPLOYMENT_PACKAGE\\02_Official_Manuals\\CAMPUS_MULTI_STATION_DEPLOYMENT_GUIDE_EN.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\\School_Lakshya\\01_CLIENT_DEPLOYMENT_PACKAGE\\02_Official_Manuals\\OFFLINE_WIFI_CAMPUS_NETWORKING_GUIDE.pdf"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\\Apna School OS"; Filename: "{app}\\Apna_School_OS.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\\app_icon.ico"
Name: "{group}\\Start School OS (Console Log Mode)"; Filename: "{app}\\Launch_School_RMS.bat"; WorkingDir: "{app}"
Name: "{group}\\📖 Staff Training Manual (PDF)"; Filename: "{app}\\STAFF_TRAINING_MANUAL.pdf"; WorkingDir: "{app}"
Name: "{group}\\📖 User Operating Manual (PDF)"; Filename: "{app}\\USER_OPERATING_MANUAL.pdf"; WorkingDir: "{app}"
Name: "{group}\\🔧 Installation & Troubleshooting Guide (Hindi PDF)"; Filename: "{app}\\CLIENT_INSTALLATION_&_TROUBLESHOOTING_GUIDE.pdf"; WorkingDir: "{app}"
Name: "{group}\\🌐 Multi-Station Deployment Guide (English PDF)"; Filename: "{app}\\CAMPUS_MULTI_STATION_DEPLOYMENT_GUIDE_EN.pdf"; WorkingDir: "{app}"
Name: "{group}\\📡 Offline Wi-Fi Campus Networking Guide (PDF)"; Filename: "{app}\\OFFLINE_WIFI_CAMPUS_NETWORKING_GUIDE.pdf"; WorkingDir: "{app}"
Name: "{group}\\Backup School Database"; Filename: "{app}\\Backup_Database.bat"; WorkingDir: "{app}"
Name: "{group}\\Stop School OS"; Filename: "{app}\\Stop_School_RMS.bat"; WorkingDir: "{app}"
Name: "{group}\\{cm:UninstallProgram,Apna School OS}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\Apna School OS"; Filename: "{app}\\Apna_School_OS.vbs"; WorkingDir: "{app}"; IconFilename: "{app}\\app_icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\\Apna_School_OS.vbs"; Description: "{cm:LaunchProgram,Apna Institute School OS}"; Flags: shellexec postinstall nowait skipifsilent