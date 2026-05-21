# 測試 Vercel Admin env-check（需先登入後台取得 Cookie）
# 用法：
#   1. 瀏覽器登入 https://zenith-mind.vercel.app/admin
#   2. F12 → Application → Cookies → 複製 access_token 值
#   3. $env:ADMIN_ACCESS_TOKEN="貼上"; .\scripts\test-admin-env-check.ps1

$BaseUrl = if ($env:VERCEL_ADMIN_URL) { $env:VERCEL_ADMIN_URL } else { "https://zenith-mind.vercel.app" }
$Token = $env:ADMIN_ACCESS_TOKEN

if (-not $Token) {
  Write-Host "請設定環境變數 ADMIN_ACCESS_TOKEN（後台 JWT Cookie 值）" -ForegroundColor Yellow
  Write-Host "或先執行: Invoke-WebRequest $BaseUrl/admin/login"
  exit 1
}

$uri = "$BaseUrl/api/admin/env-check"
try {
  $res = Invoke-WebRequest -Uri $uri -Headers @{
    Cookie = "access_token=$Token"
  } -UseBasicParsing
  Write-Host "HTTP $($res.StatusCode)"
  $res.Content | ConvertFrom-Json | ConvertTo-Json -Depth 6
} catch {
  Write-Host "HTTP $($_.Exception.Response.StatusCode.value__)"
  $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
  Write-Host $reader.ReadToEnd()
  exit 1
}
