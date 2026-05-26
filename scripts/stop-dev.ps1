param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $listeners) {
  Write-Host "No dev server is listening on port $Port."
  exit 0
}

foreach ($listener in $listeners) {
  Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
  Write-Host "Stopped process $($listener.OwningProcess) on port $Port."
}
