<# 
.SYNOPSIS
  Generate a local Root CA and a wildcard cert (*.meshlogiq.local) under certs\.
.PARAMETERS
  -CertsDir  Target directory (default: certs)
  -Domain    Base domain (default: meshlogiq.local)
#>
param(
  [string]$CertsDir = "traefik\\certs",
  [string]$Domain   = "meshlogiq.local",
  [switch]$UseIntermediate = $false,
  [string]$ClientName = "meshlogiq-device",
  [switch]$CreateClientCert = $true
)

$ErrorActionPreference = "Stop"

$Org   = "MeshLogIQ"
$OU    = "Onsite"
$C     = "US"
$ST    = "New York"
$L     = "Rochester"

New-Item -ItemType Directory -Force -Path $CertsDir | Out-Null
Set-Location $CertsDir

Write-Host "==> Working in: $(Get-Location)"
Write-Host "==> Domain: $Domain  (will issue *.$Domain)"

$CAKey = "MeshLogIQlocalCA.key"
$CACrt = "MeshLogIQlocalCA.pem"
$ICAKey = "MeshLogIQlocalICA.key"
$ICACrt = "MeshLogIQlocalICA.pem"
$WKey  = "wildcard.key"
$WCSR  = "wildcard.csr"
$WCrt  = "wildcard.crt"
$WPfx  = "wildcard.pfx"
$Full  = "wildcard-fullchain.crt"
$CAChain = "meshlogiq-ca-chain.pem"
$ClientKey = "$ClientName.key"
$ClientCSR = "$ClientName.csr"
$ClientCrt = "$ClientName.crt"
$ClientPfx = "$ClientName.pfx"
$SanExt = [System.IO.Path]::GetTempFileName()
$ClientExt = [System.IO.Path]::GetTempFileName()

@"
[ext]
subjectAltName=DNS:*.$Domain,DNS:$Domain
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth,clientAuth
"@ | Set-Content -NoNewline -Encoding ASCII $SanExt

@"
[ext]
keyUsage=digitalSignature
extendedKeyUsage=clientAuth
"@ | Set-Content -NoNewline -Encoding ASCII $ClientExt

# 1) Root CA (5 years)
if (-not (Test-Path $CAKey) -or -not (Test-Path $CACrt)) {
  Write-Host "==> Creating Root CA (5 years)"
  & openssl req -new -newkey rsa:4096 -days 1825 `
    -subj "/C=$C/ST=$ST/L=$L/O=$Org/OU=$OU/CN=meshlogiq Root CA" `
    -addext "basicConstraints=critical,CA:TRUE" `
    -addext "keyUsage=critical,keyCertSign,cRLSign" `
    -addext "subjectKeyIdentifier=hash" `
    -nodes -x509 -sha256 `
    -keyout $CAKey -out $CACrt
} else {
  Write-Host "==> Root CA already exists, skipping."
}

# 1b) Intermediate CA (optional)
if ($UseIntermediate) {
  if (-not (Test-Path $ICAKey) -or -not (Test-Path $ICACrt)) {
    Write-Host "==> Creating Intermediate CA (3 years)"
    & openssl req -new -newkey rsa:4096 -nodes `
      -subj "/C=$C/ST=$ST/L=$L/O=$Org/OU=$OU/CN=meshlogiq Intermediate CA" `
      -keyout $ICAKey -out "$ICAKey.csr"

    & openssl x509 -req -in "$ICAKey.csr" `
      -CA $CACrt -CAkey $CAKey -CAcreateserial `
      -out $ICACrt -days 1095 -sha256 `
      -addext "basicConstraints=critical,CA:TRUE" `
      -addext "keyUsage=critical,keyCertSign,cRLSign" `
      -addext "subjectKeyIdentifier=hash" `
      -addext "authorityKeyIdentifier=keyid,issuer"
  } else {
    Write-Host "==> Intermediate CA already exists, skipping."
  }
}

# 2) Wildcard CSR
if (-not (Test-Path $WKey) -or -not (Test-Path $WCSR)) {
  Write-Host "==> Creating wildcard key+CSR for *.$Domain"
  & openssl req -new -newkey rsa:2048 -nodes `
    -keyout $WKey -out $WCSR `
    -subj "/C=$C/ST=$ST/L=$L/O=$Org/OU=$OU/CN=*.$Domain/" `
    -addext "subjectAltName=DNS:*.$Domain,DNS:$Domain"
} else {
  Write-Host "==> Wildcard key/CSR already exists, skipping."
}

# 3) Sign CSR with CA (1 year)
if ($UseIntermediate) {
  Write-Host "==> Signing wildcard certificate with Intermediate CA (1 year)"
  & openssl x509 -req -in $WCSR `
    -CA $ICACrt -CAkey $ICAKey -CAcreateserial `
    -out $WCrt -days 365 -sha256 `
    -extfile $SanExt -extensions ext
} else {
  Write-Host "==> Signing wildcard certificate with Root CA (1 year)"
  & openssl x509 -req -in $WCSR `
    -CA $CACrt -CAkey $CAKey -CAcreateserial `
    -out $WCrt -days 365 -sha256 `
    -extfile $SanExt -extensions ext
}

# 4) Verify (print short header)
Write-Host "==> Verifying certificate:"
& openssl x509 -in $WCrt -text -noout | Select-Object -First 25 | Out-Host

# 5) PFX (empty password)
if (-not (Test-Path $WPfx)) {
  Write-Host "==> Creating PFX bundle"
  & openssl pkcs12 -export -out $WPfx -inkey $WKey -in $WCrt -certfile $CACrt -passout pass:
}

# 6) Fullchain + CA chain
if ($UseIntermediate) {
  Get-Content $WCrt, $ICACrt, $CACrt | Set-Content -Encoding ASCII $Full
  Get-Content $ICACrt, $CACrt | Set-Content -Encoding ASCII $CAChain
} else {
  Get-Content $WCrt, $CACrt | Set-Content -Encoding ASCII $Full
  Get-Content $CACrt | Set-Content -Encoding ASCII $CAChain
}

# 7) Client cert for devices (optional)
if ($CreateClientCert) {
  if (-not (Test-Path $ClientKey) -or -not (Test-Path $ClientCrt)) {
    Write-Host "==> Creating client cert for $ClientName"
    & openssl req -new -newkey rsa:2048 -nodes `
      -keyout $ClientKey -out $ClientCSR `
      -subj "/C=$C/ST=$ST/L=$L/O=$Org/OU=$OU/CN=$ClientName"

    if ($UseIntermediate) {
      & openssl x509 -req -in $ClientCSR `
        -CA $ICACrt -CAkey $ICAKey -CAcreateserial `
        -out $ClientCrt -days 365 -sha256 `
        -extfile $ClientExt -extensions ext
    } else {
      & openssl x509 -req -in $ClientCSR `
        -CA $CACrt -CAkey $CAKey -CAcreateserial `
        -out $ClientCrt -days 365 -sha256 `
        -extfile $ClientExt -extensions ext
    }

    if (-not (Test-Path $ClientPfx)) {
      & openssl pkcs12 -export -out $ClientPfx -inkey $ClientKey -in $ClientCrt -certfile $CAChain -passout pass:
    }
  } else {
    Write-Host "==> Client cert already exists, skipping."
  }
}

# Lock down keys (best-effort on Windows)
try { icacls $CAKey /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null } catch {}
try { icacls $WKey  /inheritance:r /grant:r "$($env:USERNAME):(R,W)" | Out-Null } catch {}

Remove-Item $SanExt -ErrorAction SilentlyContinue
Remove-Item $ClientExt -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "==> Done. Files in $(Get-Location):"
Get-ChildItem $CAKey,$CACrt,$ICAKey,$ICACrt,$WKey,$WCSR,$WCrt,$WPfx,$Full,$CAChain,$ClientKey,$ClientCSR,$ClientCrt,$ClientPfx -ErrorAction SilentlyContinue | Select-Object Name,Length | Format-Table

Write-Host ""
Write-Host "==> Next:"
Write-Host "   1) Import Root CA into Trusted Root (Cert Manager):  $(Get-Location)\$CACrt"
Write-Host "   2) Use wildcard certs (wildcard.crt/key or wildcard-fullchain.crt)."
Write-Host "   3) hosts entry:"
Write-Host "      127.0.0.1 api.$Domain dev.$Domain traefik.$Domain pgadmin.$Domain minio.$Domain"
