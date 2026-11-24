using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace ApnaSchoolOS
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\');
                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string logDir = Path.Combine(localAppData, @"ApnaSchoolOS\logs");
                if (!Directory.Exists(logDir)) Directory.CreateDirectory(logDir);
                string logFile = Path.Combine(logDir, "server_startup.log");

                int activePort = 8085;

                // 1. Locate Node.js executable
                string nodeExe = "";
                string p1 = Path.Combine(baseDir, @"bin\node.exe");
                string p2 = Path.Combine(baseDir, @"app\bin\node.exe");
                string p3 = @"C:\Program Files\nodejs\node.exe";

                if (File.Exists(p1)) nodeExe = p1;
                else if (File.Exists(p2)) nodeExe = p2;
                else if (File.Exists(p3)) nodeExe = p3;
                else
                {
                    // Check PATH
                    string sysPath = Environment.GetEnvironmentVariable("PATH") ?? "";
                    foreach (string dir in sysPath.Split(';'))
                    {
                        string test = Path.Combine(dir.Trim(), "node.exe");
                        if (File.Exists(test)) { nodeExe = test; break; }
                    }
                }

                if (string.IsNullOrEmpty(nodeExe))
                {
                    MessageBox.Show(
                        "Apna School OS Startup Notice:\n\n" +
                        "Standalone Node runtime engine (bin\\node.exe) was not found.\n" +
                        "Please reinstall or contact Apna Software Hub Helpline: 8504985149.",
                        "Apna School OS", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                string serverScript = Path.Combine(baseDir, @"app\src\server.js");
                if (!File.Exists(serverScript))
                {
                    MessageBox.Show(
                        "Application server script missing:\n" + serverScript,
                        "Apna School OS", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 2. Check if server is already running
                bool serverReady = IsServerResponding(activePort);

                if (!serverReady)
                {
                    // Start server in background with hidden window and logging
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = string.Format("/c \"\"{0}\" \"{1}\" >> \"{2}\" 2>&1\"", nodeExe, serverScript, logFile),
                        WorkingDirectory = baseDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                    Process.Start(psi);

                    // Poll until server responds (up to 20 seconds)
                    for (int i = 0; i < 40; i++)
                    {
                        Thread.Sleep(500);

                        // Read dynamic port if written
                        string pf1 = Path.Combine(localAppData, @"Apna_School_OS_Data\active_port.txt");
                        string pf2 = Path.Combine(localAppData, @"APNA_RMS_DATA\active_port.txt");
                        string targetPortFile = File.Exists(pf1) ? pf1 : (File.Exists(pf2) ? pf2 : null);

                        if (targetPortFile != null)
                        {
                            try
                            {
                                string content = File.ReadAllText(targetPortFile).Trim();
                                int p;
                                if (int.TryParse(content, out p) && p >= 1000) activePort = p;
                            }
                            catch { }
                        }

                        if (IsServerResponding(activePort))
                        {
                            serverReady = true;
                            break;
                        }
                    }
                }

                if (!serverReady)
                {
                    string errSnippet = "";
                    if (File.Exists(logFile))
                    {
                        try
                        {
                            string all = File.ReadAllText(logFile);
                            if (all.Length > 400) errSnippet = all.Substring(all.Length - 400);
                            else errSnippet = all;
                        }
                        catch { }
                    }

                    MessageBox.Show(
                        "Apna School OS को प्रारंभ करने में समस्या आई है:\n\n" +
                        "1. कृपया शॉर्टकट पर राइट-क्लिक करके 'Run as administrator' चलाएं।\n" +
                        "2. यदि आवश्यक हो तो तकनीकी सहायता हेतु 8504985149 पर संपर्क करें।\n\n" +
                        "तकनीकी विवरण:\n" + errSnippet,
                        "Apna School OS Startup Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // 3. Launch dedicated standalone desktop app window (Edge Chromium or Chrome)
                string browserExe = "";
                string edge1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                string edge2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                string chrome1 = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                string chrome2 = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
                string chrome3 = Path.Combine(localAppData, @"Google\Chrome\Application\chrome.exe");

                if (File.Exists(edge1)) browserExe = edge1;
                else if (File.Exists(edge2)) browserExe = edge2;
                else if (File.Exists(chrome1)) browserExe = chrome1;
                else if (File.Exists(chrome2)) browserExe = chrome2;
                else if (File.Exists(chrome3)) browserExe = chrome3;

                string appUrl = "http://127.0.0.1:" + activePort;

                if (!string.IsNullOrEmpty(browserExe))
                {
                    string userProfile = Path.Combine(localAppData, @"ApnaSchoolOS\app_profile");
                    string args = string.Format(" --app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1366,768", appUrl, userProfile);
                    ProcessStartInfo bPsi = new ProcessStartInfo
                    {
                        FileName = browserExe,
                        Arguments = args,
                        UseShellExecute = true
                    };
                    Process.Start(bPsi);
                }
                else
                {
                    Process.Start(appUrl);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Startup Exception: " + ex.Message, "Apna School OS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static bool IsServerResponding(int port)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + port + "/api/health");
                req.Timeout = 600;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return res.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }
    }
}
