# 若 ga4-oauth-grant.mjs 無法開瀏覽器：在 Playground 取得 token 後執行本腳本
# 1) https://developers.google.com/oauthplayground/
# 2) 齒輪 → Use your own OAuth credentials → 填 GSC_OAUTH_CLIENT_ID / SECRET（與 .env.local 相同）
# 3) Scope: https://www.googleapis.com/auth/analytics.manage.users
# 4) Authorize → Exchange → 複製 Access token
# 5) .\scripts\ga4-grant-playground-curl.ps1 -AccessToken "ya29...."

param(
  [Parameter(Mandatory = $true)]
  [string]$AccessToken
)

$SaEmail = (Select-String -Path ".env.local" -Pattern "^GA4_CLIENT_EMAIL=" | ForEach-Object { $_.Line -replace "^GA4_CLIENT_EMAIL=", "" }).Trim().Trim('"')
$PropertyId = "536903218"
$AccountId = "394118928"

Write-Host "服務帳號: $SaEmail"
Write-Host "Property: $PropertyId`n"

$headers = @{
  Authorization = "Bearer $AccessToken"
  "Content-Type" = "application/json"
}

$bodyUserLink = "{`"emailAddress`":`"$SaEmail`",`"directRoles`":[`"VIEWER`"]}"
curl.exe -sS -X POST "https://analyticsadmin.googleapis.com/v1alpha/properties/$PropertyId/userLinks" `
  -H "Authorization: Bearer $AccessToken" -H "Content-Type: application/json" -d $bodyUserLink
Write-Host ""

$bodyBinding = "{`"user`":`"$SaEmail`",`"roles`":[`"predefinedRoles/viewer`"]}"
curl.exe -sS -X POST "https://analyticsadmin.googleapis.com/v1alpha/accounts/$AccountId/accessBindings" `
  -H "Authorization: Bearer $AccessToken" -H "Content-Type: application/json" -d $bodyBinding
Write-Host "`n完成後執行: npx tsx --env-file=.env.local scripts/ga4-diagnose.mjs"
