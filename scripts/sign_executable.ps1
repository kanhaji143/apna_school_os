# ==============================================================================
# Apna School OS - Authenticode Code Signing Utility
# Signs Executables with SHA-256 Certificate to Prevent Windows 11 Error 4551
# ==============================================================================

param(
    [string[]]$FilesToSign
)

$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -like "*Apna Software Hub*" } | Select-Object -First 1
if (-not $cert) {
    Write-Host "[*] Creating Self-Signed Authenticode Certificate..." -ForegroundColor Cyan
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Apna Software Hub (AI & Technology Division)" -CertStoreLocation "Cert:\CurrentUser\My" -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(5)
}

Write-Host "[+] Code Signing Certificate: $($cert.Subject)" -ForegroundColor Green
Write-Host "[+] Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

if (-not $FilesToSign) {
    $FilesToSign = @(
        "d:\School_Lakshya\Apna_School_OS.exe",
        "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\01_Software_Installation\Setup_Apna_School_OS.exe",
        "d:\School_Lakshya\01_CLIENT_DEPLOYMENT_PACKAGE\01_Software_Installation\वैकल्पिक_पारंपरिक_इंस्टॉलर_(Setup_EXE)\Setup_Apna_School_OS.exe"
    )
}

foreach ($f in $FilesToSign) {
    if (Test-Path $f) {
        Write-Host "[*] Signing: $f" -ForegroundColor Yellow
        $sig = Set-AuthenticodeSignature -FilePath $f -Certificate $cert -HashAlgorithm SHA256
        Write-Host "    Status: $($sig.Status)" -ForegroundColor Green
    }
}
