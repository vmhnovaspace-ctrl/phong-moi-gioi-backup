param(
  [int]$Port = 3000,
  [switch]$OpenBrowser,
  [switch]$Restart
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$nextBin = Join-Path $root "node_modules\next\dist\bin\next"
$nextCmd = Join-Path $root "node_modules\.bin\next.cmd"
$serverCmd = Join-Path $root "RUN_WEB_SERVER.cmd"
$serverScript = Join-Path $root "scripts\serve-next.mjs"
$logDir = Join-Path $root ".next\dev-logs"
$stdoutLog = Join-Path $logDir "next-dev.out.log"
$stderrLog = Join-Path $logDir "next-dev.err.log"

function Test-IsUnderRoot {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $false
  }

  $resolvedRoot = (Resolve-Path -LiteralPath $root).Path
  $resolvedPath = (Resolve-Path -LiteralPath $Path).Path

  return $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)
}

function Repair-ProcessPathEnvironment {
  $pathValue = [Environment]::GetEnvironmentVariable("Path", "Process")
  if ([string]::IsNullOrWhiteSpace($pathValue)) {
    $pathValue = [Environment]::GetEnvironmentVariable("PATH", "Process")
  }

  if (-not [string]::IsNullOrWhiteSpace($pathValue)) {
    [Environment]::SetEnvironmentVariable("Path", $pathValue, "Process")
    [Environment]::SetEnvironmentVariable("PATH", $null, "Process")
  }
}

function Stop-PortListener {
  param([int]$TargetPort)

  $listeners = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
  foreach ($processId in ($listeners | Select-Object -ExpandProperty OwningProcess -Unique)) {
    if ($processId -and $processId -ne $PID) {
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped process $processId on port $TargetPort."
    }
  }
}

function Stop-WorkspaceNodeProcesses {
  try {
    $processes = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" -ErrorAction Stop
  } catch {
    Write-Host "Could not inspect node.exe command lines. Continuing with port cleanup only."
    return
  }

  foreach ($process in $processes) {
    $commandLine = [string]$process.CommandLine
    if ($process.ProcessId -eq $PID) {
      continue
    }

    if ($commandLine.IndexOf($root, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped workspace node process $($process.ProcessId)."
    }
  }
}

function Wait-PortReleased {
  param([int]$TargetPort)

  for ($attempt = 1; $attempt -le 20; $attempt++) {
    $listener = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) {
      return
    }

    Start-Sleep -Milliseconds 500
  }
}

function Remove-PathWithRetry {
  param([string]$TargetPath)

  if (-not (Test-Path -LiteralPath $TargetPath)) {
    return
  }

  if (-not (Test-IsUnderRoot -Path $TargetPath)) {
    throw "Refusing to remove path outside workspace: $TargetPath"
  }

  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      Remove-Item -LiteralPath $TargetPath -Recurse -Force -ErrorAction Stop
      return
    } catch {
      if ($attempt -eq 5) {
        throw
      }

      Start-Sleep -Seconds 1
    }
  }
}

if (-not (Test-Path -LiteralPath $nextBin) -or -not (Test-Path -LiteralPath $nextCmd) -or -not (Test-Path -LiteralPath $serverCmd) -or -not (Test-Path -LiteralPath $serverScript)) {
  throw "Next.js binary not found. Run 'corepack pnpm install' first."
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

if ($Restart) {
  Stop-PortListener -TargetPort $Port
  Stop-WorkspaceNodeProcesses
  Wait-PortReleased -TargetPort $Port

  $nextServerDir = Join-Path $root ".next\server"
  $nextBuildId = Join-Path $root ".next\BUILD_ID"
  Remove-PathWithRetry -TargetPath $nextServerDir
  Remove-PathWithRetry -TargetPath $nextBuildId
}

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $listener) {
  Set-Location -LiteralPath $root
  $buildIdPath = Join-Path $root ".next\BUILD_ID"
  $corepack = Get-Command corepack -ErrorAction SilentlyContinue

  if ($corepack) {
    Write-Host "Building local production bundle..."
    & $corepack.Source pnpm build
    if ($LASTEXITCODE -ne 0) {
      throw "Build failed. Fix the build errors before starting the local web server."
    }
  } elseif (Test-Path -LiteralPath $buildIdPath) {
    Write-Host "corepack was not found in PATH. Using existing .next build."
  } else {
    throw "corepack was not found and no .next build exists. Run 'corepack pnpm build' once, then start again."
  }

  $node = (Get-Command node -ErrorAction Stop).Source
  Repair-ProcessPathEnvironment
  $arguments = "`"$serverScript`" $Port"

  $process = Start-Process `
    -FilePath $node `
    -ArgumentList $arguments `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -PassThru

  Write-Host "Started local web server PID $($process.Id)."
} else {
  Write-Host "Local web server is already listening on port $Port."
}

$url = "http://localhost:$Port"
$healthUrl = "http://127.0.0.1:$Port/login"
$ready = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
      $ready = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 1
  }
}

if (-not $ready) {
  throw "Local web server did not become ready. Check logs: $stdoutLog and $stderrLog"
}

Write-Host "Ready: $url"
Write-Host "Use STOP_WEB.cmd when you want to stop it."

if ($OpenBrowser) {
  Start-Process $url
}
