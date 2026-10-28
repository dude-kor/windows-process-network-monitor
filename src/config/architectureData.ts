export interface ArchitectureSection {
  id: 'sockets' | 'bandwidth' | 'dns' | 'privileges' | 'compat';
  title: string;
  badge: string;
}

export const ELEVATION_SNIPPET = `# Self-Elevation Wrapper for PowerShell Scripts
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[!] Elevating to Administrator..." -ForegroundColor Yellow
    $argList = "-NoProfile -ExecutionPolicy Bypass -File \`"\$PSCommandPath\`" " + ($MyInvocation.UnboundArguments -join ' ')
    Start-Process -FilePath 'powershell.exe' -ArgumentList $argList -Verb RunAs
    exit
}`;

export const PERF_COUNTER_COMPARE_SNIPPET = `# Method A: High-Reliability PID-Anchored Kernel I/O Delta (Used in WinNetMon)
# Directly reads EPROCESS->IO_COUNTERS with 0ms latency and no PerfMon index collision
$proc = Get-Process -Id $PID
$readDeltaBytes  = $proc.IOReadTransferCount  - $lastReadBytes
$writeDeltaBytes = $proc.IOWriteTransferCount - $lastWriteBytes
$kbPerSec = ($readDeltaBytes + $writeDeltaBytes) / 1024.0 / $elapsedSeconds

# Method B: Windows Performance Counter (Fragile on multi-instance apps)
# Issue: Windows names multiple processes as app#1, app#2. If one closes, index shifts!
Get-Counter "\\Process(target_app)\\IO Data Bytes/sec"`;

export const PRIVILEGE_MATRIX_ROWS = [
  {
    capability: 'Monitor User Application Processes (e.g., Chrome, Slack, Teams, Custom App)',
    standardUser: 'Supported (100%)',
    administrator: 'Supported (100%)',
    standardClass: 'text-emerald-400 font-semibold',
    adminClass: 'text-emerald-400 font-semibold'
  },
  {
    capability: 'Monitor System Services (NT AUTHORITY\\SYSTEM, svchost, spoolsv)',
    standardUser: 'Restricted (Returns no sockets)',
    administrator: 'Full Visibility',
    standardClass: 'text-rose-400 font-semibold',
    adminClass: 'text-emerald-400 font-semibold'
  },
  {
    capability: 'Read Process I/O Transfer Counters',
    standardUser: 'Supported for User Processes',
    administrator: 'Supported for All Processes',
    standardClass: 'text-emerald-400 font-semibold',
    adminClass: 'text-emerald-400 font-semibold'
  },
  {
    capability: 'Reverse DNS Lookups',
    standardUser: 'Supported',
    administrator: 'Supported',
    standardClass: 'text-emerald-400 font-semibold',
    adminClass: 'text-emerald-400 font-semibold'
  },
  {
    capability: 'Save CSV Telemetry Log',
    standardUser: 'Supported in User Directories (Desktop, Documents, %TEMP%)',
    administrator: 'Supported Anywhere (e.g. C:\\Logs, ProgramData)',
    standardClass: 'text-yellow-300',
    adminClass: 'text-emerald-400 font-semibold'
  }
];
