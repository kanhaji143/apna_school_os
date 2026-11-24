; ==============================================================================
; Inno Setup Script for Apna School OS (Enterprise Edition)
; Developed & Maintained By Apna Software Hub (AI & Technology Division)
; Official Helpline: 8504985149 / 8303324088 | Email: krishnaskb143@gmail.com
; 100% Offline-First Secured Architecture | Self-Healing Shadow Vault
; Windows 11 Smart App Control & Error 4551 Hardened Architecture
; ==============================================================================

[Setup]
AppId={{D703F7E0-C276-46D1-8BEA-7D4191F6E463}
AppName=Apna School OS
AppVersion=2.1.0.0
AppVerName=Apna School OS v2.1 Enterprise Edition (Apna Institute Edition)
AppPublisher=Apna Software Hub (AI & Technology Division)
AppPublisherURL=https://apnasoftwarehub.com
AppSupportURL=https://apnasoftwarehub.com
AppUpdatesURL=https://apnasoftwarehub.com
AppContact=8504985149
AppComments=Official Helpline: 8504985149 / 8303324088 | Email: krishnaskb143@gmail.com | Developed & Licensed by Apna Software Hub (Krishna ji)
DefaultDirName={autopf}\Apna School OS
DefaultGroupName=Apna School OS
AllowNoIcons=yes
OutputDir=d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\01_Software_Installation
OutputBaseFilename=Setup_Apna_School_OS
SetupIconFile=d:\School_Lakshya\app_icon.ico
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=commandline
DisableProgramGroupPage=auto
ArchitecturesInstallIn64BitMode=x64compatible

; --- Windows Properties -> Details Tab Metadata (Rule 7 & Problem 12 Compliant) ---
VersionInfoVersion=2.1.0.0
VersionInfoProductVersion=2.1.0.0
VersionInfoCompany=Apna Software Hub (Helpline: 8504985149)
VersionInfoDescription=Apna School OS Enterprise Setup - Offline-First Multi-Board School Management Desktop Application (Helpline: 8504985149)
VersionInfoCopyright=Copyright (C) 2026 Apna Software Hub (Krishna ji). All rights reserved.
VersionInfoProductName=Apna School OS
VersionInfoOriginalFileName=Setup_Apna_School_OS.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "d:\School_Lakshya\Apna_School_OS.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\bin\*"; DestDir: "{app}\bin"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "d:\School_Lakshya\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "d:\School_Lakshya\app_icon.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\Apna_School_OS.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\Launch_School_RMS.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\Backup_Database.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\Stop_School_RMS.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\02_Official_Manuals\2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\02_Official_Manuals\STAFF_TRAINING_MANUAL.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\02_Official_Manuals\USER_OPERATING_MANUAL.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\02_Official_Manuals\CLIENT_INSTALLATION_&_TROUBLESHOOTING_GUIDE.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\02_Official_Manuals\CAMPUS_MULTI_STATION_DEPLOYMENT_GUIDE_EN.pdf"; DestDir: "{app}"; Flags: ignoreversion
Source: "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\02_Official_Manuals\OFFLINE_WIFI_CAMPUS_NETWORKING_GUIDE.pdf"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\Apna School OS"; Filename: "{app}\Apna_School_OS.exe"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"
Name: "{group}\⚡ 2-Minute Sales Pitch Card (PDF)"; Filename: "{app}\2_MINUTE_EXECUTIVE_SALES_FLASHCARD.pdf"; WorkingDir: "{app}"
Name: "{group}\Start School OS (Console Log Mode)"; Filename: "{app}\Launch_School_RMS.bat"; WorkingDir: "{app}"
Name: "{group}\📖 Staff Training Manual (PDF)"; Filename: "{app}\STAFF_TRAINING_MANUAL.pdf"; WorkingDir: "{app}"
Name: "{group}\📖 User Operating Manual (PDF)"; Filename: "{app}\USER_OPERATING_MANUAL.pdf"; WorkingDir: "{app}"
Name: "{group}\🔧 Installation & Troubleshooting Guide (Hindi PDF)"; Filename: "{app}\CLIENT_INSTALLATION_&_TROUBLESHOOTING_GUIDE.pdf"; WorkingDir: "{app}"
Name: "{group}\🌐 Multi-Station Deployment Guide (English PDF)"; Filename: "{app}\CAMPUS_MULTI_STATION_DEPLOYMENT_GUIDE_EN.pdf"; WorkingDir: "{app}"
Name: "{group}\📡 Offline Wi-Fi Campus Networking Guide (PDF)"; Filename: "{app}\OFFLINE_WIFI_CAMPUS_NETWORKING_GUIDE.pdf"; WorkingDir: "{app}"
Name: "{group}\Backup School Database"; Filename: "{app}\Backup_Database.bat"; WorkingDir: "{app}"
Name: "{group}\Stop School OS"; Filename: "{app}\Stop_School_RMS.bat"; WorkingDir: "{app}"
Name: "{group}\{cm:UninstallProgram,Apna School OS}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Apna School OS"; Filename: "{app}\Apna_School_OS.exe"; WorkingDir: "{app}"; IconFilename: "{app}\app_icon.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\Apna_School_OS.exe"; Description: "{cm:LaunchProgram,Apna Institute School OS}"; Flags: postinstall nowait skipifsilent
