# PowerShell script to update Firestore via REST API
# Usage: .\update-teams-rest.ps1

$projectId = "square-picks-vpbb8d"
$serviceAccountPath = "..\certificates\firebase-admin-key.json"

# Load service account
Write-Host "Loading service account..." -ForegroundColor Cyan
if (-not (Test-Path $serviceAccountPath)) {
    Write-Host "Service account file not found: $serviceAccountPath" -ForegroundColor Red
    exit 1
}

$serviceAccount = Get-Content $serviceAccountPath | ConvertFrom-Json

# Get OAuth2 token using service account
Write-Host "Getting OAuth2 token..." -ForegroundColor Cyan
$jwtHeader = @{
    alg = "RS256"
    typ = "JWT"
} | ConvertTo-Json -Compress

$now = [Math]::Floor([decimal](Get-Date(Get-Date).ToUniversalTime()-uformat "%s"))
$jwtClaim = @{
    iss = $serviceAccount.client_email
    scope = "https://www.googleapis.com/auth/datastore"
    aud = "https://oauth2.googleapis.com/token"
    exp = $now + 3600
    iat = $now
} | ConvertTo-Json -Compress

# Base64 URL encode
function ConvertTo-Base64Url($text) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    $base64 = [Convert]::ToBase64String($bytes)
    return $base64.Replace('+', '-').Replace('/', '_').Replace('=', '')
}

$headerEncoded = ConvertTo-Base64Url $jwtHeader
$claimEncoded = ConvertTo-Base64Url $jwtClaim
$toSign = "$headerEncoded.$claimEncoded"

# Sign with private key
$privateKey = $serviceAccount.private_key
$rsa = [System.Security.Cryptography.RSA]::Create()
$rsa.ImportFromPem($privateKey)
$signature = $rsa.SignData([System.Text.Encoding]::UTF8.GetBytes($toSign), [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
$signatureEncoded = ConvertTo-Base64Url ([Convert]::ToBase64String($signature))

$jwt = "$toSign.$signatureEncoded"

# Exchange JWT for access token
$tokenResponse = Invoke-RestMethod -Uri "https://oauth2.googleapis.com/token" -Method Post -Body @{
    grant_type = "urn:ietf:params:oauth:grant-type:jwt-bearer"
    assertion = $jwt
} -ContentType "application/x-www-form-urlencoded"

$token = $tokenResponse.access_token
Write-Host "Token obtained. Starting updates..." -ForegroundColor Green

# Team enrichment data: old_doc_id -> (espn_id, abbrev)
$teams = @{
    "RDnjryTT2mkizKSm9ikl" = @{espn="33"; abbrev="BAL"}
    "EQIgUZ28Cf6FrITIxWy7" = @{espn="29"; abbrev="CAR"}
    "WOItYy5G1yRVG0fESSmF" = @{espn="17"; abbrev="NE"}
    "DjbPCyd97B5OqLNRGsym" = @{espn="7"; abbrev="DEN"}
    "NGTMc6cY1ZCdDOJx93RP" = @{espn="28"; abbrev="WSH"}
    "M81pkB3UYIsVdy8YyjlE" = @{espn="34"; abbrev="HOU"}
    "pOPmOJG8juYhDHPhABTZ" = @{espn="18"; abbrev="NO"}
    "KP13Gr1Pcl0v1E4beCZg" = @{espn="8"; abbrev="DET"}
    "kUoV2wNaHKyhoRpzBZZM" = @{espn="3"; abbrev="CHI"}
    "V4yqAwq5XzJFpTsTB4Fe" = @{espn="15"; abbrev="MIA"}
}

$count = 0
foreach ($docId in $teams.Keys) {
    $data = $teams[$docId]
    $url = "https://firestore.googleapis.com/v1/projects/$projectId/databases/(default)/documents/teams/${docId}?updateMask.fieldPaths=externalIds&updateMask.fieldPaths=abbrev&updateMask.fieldPaths=sport"
    
    $body = @{
        fields = @{
            externalIds = @{
                mapValue = @{
                    fields = @{
                        espn = @{ stringValue = $data.espn }
                    }
                }
            }
            abbrev = @{ stringValue = $data.abbrev }
            sport = @{ stringValue = "NFL" }
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        Invoke-RestMethod -Uri $url -Method Patch -Headers @{Authorization="Bearer $token"} -Body $body -ContentType "application/json" | Out-Null
        Write-Host "✓ Updated $docId ($($data.abbrev))" -ForegroundColor Green
        $count++
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "✗ Failed ${docId}: $errorMsg" -ForegroundColor Red
    }
}

Write-Host "`n✅ Updated $count teams" -ForegroundColor Cyan

