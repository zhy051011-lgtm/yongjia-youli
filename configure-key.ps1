$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskConfig = Join-Path $taskRoot '.env'
if (Test-Path -LiteralPath $taskConfig) {
  Write-Host 'Existing .env found. Edit it locally; this script will not overwrite it.'
  exit 1
}
$taskSecure = Read-Host 'Enter your DeepSeek API key (hidden; never paste it into chat)' -AsSecureString
$taskPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecure)
try {
  $taskKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer)
  if ([string]::IsNullOrWhiteSpace($taskKey) -or $taskKey.Contains("`n") -or $taskKey.Contains("`r")) { throw 'Invalid key.' }
  [System.IO.File]::WriteAllText($taskConfig, "DEEPSEEK_API_KEY=$taskKey`nDEEPSEEK_MODEL=deepseek-flash`nPORT=3188`n", [System.Text.UTF8Encoding]::new($false))
  Write-Host 'Saved locally to .env. Restart the backend. Do not submit .env.'
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer)
  $taskKey = $null
  $taskSecure.Dispose()
}
