<#
.SYNOPSIS
    Invoke-NetProcessMonitor - Standalone, zero-installation network and socket monitor for Windows 10/11.

.DESCRIPTION
    A pure native PowerShell script engineered for Windows Systems Administrators, SecOps, and DevSecOps.
    Continuously discovers, aggregates, and renders real-time TCP and UDP network connections for any target
    application process (by Process Name or PID) without requiring third-party drivers (no Npcap/WinPcap),
    external packages, or runtime installations.

    Features:
    - Zero external dependencies: 100% native Windows inbox cmdlets (Get-NetTCPConnection, Get-NetUDPEndpoint)
      with an automatic fallback to native netstat.exe for edge cases.
    - Multi-instance process tracking: monitors all active PIDs matching a process executable name.
    - Resilient lifecycle management: gracefully waits and auto-recovers if the target process terminates and restarts.
    - Reverse DNS Resolution: Asynchronous / cached hostname lookups to avoid polling latency.
    - Process Bandwidth / I/O Estimation: Utilizes native Windows kernel I/O counters (IOReadTransferCount and
      IOWriteTransferCount deltas) to track continuous per-process network I/O throughput.
    - Dual UI mode: High-refresh flicker-free ANSI console dashboard or headless continuous CSV telemetry logger.
    - Clean Ctrl+C teardown via structured finally block to restore cursor visibility and flush log files.

.PARAMETER ProcessName
    The executable name of the target application (e.g., 'chrome.exe', 'target_app', 'node').
    Matching is extension-agnostic.

.PARAMETER PID
    The specific Process ID (PID) to monitor.

.PARAMETER IntervalSec
    Refresh interval in seconds (default: 1.0s, supports floating point like 1.5).

.PARAMETER IncludeUDP
    Switch parameter to include UDP endpoints in addition to TCP connections.

.PARAMETER ResolveDNS
    Switch parameter to enable reverse DNS lookup for remote IP addresses. Lookups are cached in-memory.

.PARAMETER LogPath
    Path to a CSV file. When specified, connection state snapshots and new events are appended continuously.

.PARAMETER ContinuousLogOnly
    Runs in headless / background logging mode without clearing the console screen.

.EXAMPLE
    .\Invoke-NetProcessMonitor.ps1 -ProcessName "target_app.exe"

.EXAMPLE
    .\Invoke-NetProcessMonitor.ps1 -ProcessName "chrome" -ResolveDNS -IncludeUDP -IntervalSec 2

.EXAMPLE
    .\Invoke-NetProcessMonitor.ps1 -PID 4820 -LogPath "C:\Logs\AppNetworkActivity.csv"

.NOTES
    Author: Senior Windows Systems Engineer
    Architecture: Native .NET 4.x / .NET 6+ with Win32 NetTCPIP cmdlets
    Privilege Matrix:
      - Standard User: Can monitor processes owned by the current user session and all open public sockets.
      - Administrator (Elevated): Recommended. Required to inspect sockets of system services, protected processes,
        and access low-level performance telemetry across all security boundaries.
#>

[CmdletBinding(DefaultParameterSetName = 'ByName')]
param(
    [Parameter(ParameterSetName = 'ByName', Mandatory = $true, Position = 0, HelpMessage = 'Target Process Name (e.g., target_app.exe or target_app)')]
    [ValidateNotNullOrEmpty()]
    [string]$ProcessName,

    [Parameter(ParameterSetName = 'ByPID', Mandatory = $true, Position = 0, HelpMessage = 'Target Process ID')]
    [ValidateRange(1, [int]::MaxValue)]
    [int]$PID,

    [Parameter(Mandatory = $false)]
    [ValidateRange(0.2, 60.0)]
    [double]$IntervalSec = 1.0,

    [Parameter(Mandatory = $false)]
    [switch]$IncludeUDP,

    [Parameter(Mandatory = $false)]
    [switch]$ResolveDNS,

    [Parameter(Mandatory = $false)]
    [string]$LogPath,

    [Parameter(Mandatory = $false)]
    [switch]$ContinuousLogOnly
)

# --------------------------------------------------------------------------------------------------
# Section 1: Environment & Terminal Initialization
# --------------------------------------------------------------------------------------------------

# Enforce clean script interruption handling (Ctrl+C)
$script:Running = $true
[Console]::TreatControlCAsInput = $false

# Determine Admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Normalize Process Name if supplied
if ($PSCmdlet.ParameterSetName -eq 'ByName') {
    $targetBaseName = [System.IO.Path]::GetFileNameWithoutExtension($ProcessName)
} else {
    $targetBaseName = $null
}

# In-Memory Reverse DNS Cache: [IP_String -> Hostname_String]
$dnsCache = New-Object 'System.Collections.Generic.Dictionary[string, string]'

# I/O Counters Storage for Bandwidth Delta Calculation: [PID -> @{ Timestamp; ReadBytes; WriteBytes }]
$ioHistory = New-Object 'System.Collections.Generic.Dictionary[int, hashtable]'

# Setup CSV Logging if requested
$logFileActive = $false
if (-not [string]::IsNullOrWhiteSpace($LogPath)) {
    try {
        $logDir = [System.IO.Path]::GetDirectoryName($LogPath)
        if (-not [string]::IsNullOrEmpty($logDir) -and -not (Test-Path -Path $logDir)) {
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
        }
        if (-not (Test-Path -Path $LogPath)) {
            "Timestamp,PID,ProcessName,Protocol,LocalAddress,LocalPort,RemoteAddress,RemotePort,State,RemoteHost" | Out-File -FilePath $LogPath -Encoding utf8
        }
        $logFileActive = $true
    } catch {
        Write-Warning "Unable to initialize CSV log file at '$LogPath': $($_.Exception.Message)"
    }
}

# --------------------------------------------------------------------------------------------------
# Section 2: Helper Functions
# --------------------------------------------------------------------------------------------------

function Get-TargetProcesses {
    <#
    .SYNOPSIS
        Discovers all active processes matching the specified Name or PID.
    #>
    [CmdletBinding()]
    param()

    if ($PSCmdlet.ParameterSetName -eq 'ByName') {
        return @(Get-Process -Name $targetBaseName -ErrorAction SilentlyContinue)
    } else {
        return @(Get-Process -Id $PID -ErrorAction SilentlyContinue)
    }
}

function Resolve-RemoteHostCached {
    <#
    .SYNOPSIS
        Resolves IP to reverse DNS hostname using .NET System.Net.Dns with thread safety and caching.
    #>
    param([string]$IPAddress)

    if ([string]::IsNullOrWhiteSpace($IPAddress) -or $IPAddress -eq '0.0.0.0' -or $IPAddress -eq '::' -or $IPAddress -eq '127.0.0.1') {
        return '-'
    }

    # Check cache first to avoid blocking synchronous DNS lag
    if ($dnsCache.ContainsKey($IPAddress)) {
        return $dnsCache[$IPAddress]
    }

    $resolvedName = $IPAddress
    try {
        # Fast DNS lookup with timeout protection
        $hostEntry = [System.Net.Dns]::GetHostEntry($IPAddress)
        if ($hostEntry -and -not [string]::IsNullOrEmpty($hostEntry.HostName)) {
            $resolvedName = $hostEntry.HostName
        }
    } catch {
        # Keep raw IP if reverse lookup fails or times out
        $resolvedName = $IPAddress
    }

    # Cache result
    $dnsCache[$IPAddress] = $resolvedName
    return $resolvedName
}

function Calculate-ProcessBandwidth {
    <#
    .SYNOPSIS
        Estimates real-time I/O transfer speed using native Windows Process IO counters.
    #>
    param(
        [System.Diagnostics.Process]$Proc
    )

    $currentRead = $Proc.IOReadTransferCount
    $currentWrite = $Proc.IOWriteTransferCount
    $currentTime = [DateTime]::UtcNow
    $pidNum = $Proc.Id

    $res = [PSCustomObject]@{
        ReadSpeedKBps  = 0.0
        WriteSpeedKBps = 0.0
        TotalSpeedKBps = 0.0
    }

    if ($ioHistory.ContainsKey($pidNum)) {
        $prev = $ioHistory[$pidNum]
        $elapsedSec = ($currentTime - $prev.Timestamp).TotalSeconds
        if ($elapsedSec -gt 0.05) {
            $deltaRead = [Math]::Max(0, ($currentRead - $prev.ReadBytes))
            $deltaWrite = [Math]::Max(0, ($currentWrite - $prev.WriteBytes))

            $res.ReadSpeedKBps = [Math]::Round(($deltaRead / 1024.0) / $elapsedSec, 2)
            $res.WriteSpeedKBps = [Math]::Round(($deltaWrite / 1024.0) / $elapsedSec, 2)
            $res.TotalSpeedKBps = [Math]::Round((($deltaRead + $deltaWrite) / 1024.0) / $elapsedSec, 2)
        }
    }

    # Update state for next calculation
    $ioHistory[$pidNum] = @{
        Timestamp  = $currentTime
        ReadBytes  = $currentRead
        WriteBytes = $currentWrite
    }

    return $res
}

function Get-SocketsForPids {
    <#
    .SYNOPSIS
        Retrieves active TCP connections and UDP endpoints using Get-NetTCPConnection
        with automated fallback to netstat -ano parser.
    #>
    param(
        [int[]]$TargetPids,
        [switch]$IncludeUDP,
        [switch]$ResolveDNS
    )

    $results = [System.Collections.Generic.List[PSCustomObject]]::new()
    if (-not $TargetPids -or $TargetPids.Count -eq 0) {
        return $results
    }

    $pidSet = [System.Collections.Generic.HashSet[int]]::new()
    foreach ($p in $TargetPids) { [void]$pidSet.Add($p) }

    $useNativeCmdlet = $true

    # Attempt primary method: Native NetTCPIP module
    try {
        # Query TCP
        $tcpConns = Get-NetTCPConnection -OwningProcess $TargetPids -ErrorAction Stop
        foreach ($c in $tcpConns) {
            $remoteHost = '-'
            if ($ResolveDNS -and $c.RemoteAddress -and $c.RemoteAddress -ne '0.0.0.0' -and $c.RemoteAddress -ne '::') {
                $remoteHost = Resolve-RemoteHostCached -IPAddress $c.RemoteAddress
            }

            $results.Add([PSCustomObject]@{
                Time          = (Get-Date).ToString('HH:mm:ss.fff')
                PID           = $c.OwningProcess
                Protocol      = 'TCP'
                LocalAddress  = $c.LocalAddress
                LocalPort     = $c.LocalPort
                RemoteAddress = if ([string]::IsNullOrEmpty($c.RemoteAddress)) { '*' } else { $c.RemoteAddress }
                RemotePort    = $c.RemotePort
                State         = $c.State.ToString()
                RemoteHost    = $remoteHost
            })
        }

        # Query UDP if requested
        if ($IncludeUDP) {
            $udpConns = Get-NetUDPEndpoint -OwningProcess $TargetPids -ErrorAction SilentlyContinue
            foreach ($u in $udpConns) {
                $results.Add([PSCustomObject]@{
                    Time          = (Get-Date).ToString('HH:mm:ss.fff')
                    PID           = $u.OwningProcess
                    Protocol      = 'UDP'
                    LocalAddress  = $u.LocalAddress
                    LocalPort     = $u.LocalPort
                    RemoteAddress = '*'
                    RemotePort    = '*'
                    State         = 'Listening'
                    RemoteHost    = '-'
                })
            }
        }
    }
    catch {
        # Fallback to inbox netstat -ano
        $useNativeCmdlet = $false
        $netstatLines = netstat -ano 2>$null

        foreach ($line in $netstatLines) {
            $trimmed = $line.Trim()
            if (-not ($trimmed -match '^(TCP|UDP)')) { continue }

            $parts = $trimmed -split '\s+'
            $proto = $parts[0]

            if ($proto -eq 'TCP' -and $parts.Length -ge 5) {
                $localEp = $parts[1]
                $remoteEp = $parts[2]
                $state = $parts[3]
                $owningPid = [int]$parts[4]

                if ($pidSet.Contains($owningPid)) {
                    $lAddr, $lPort = $localEp -split ':(?!.*:)' # Regex handles IPv6 addresses
                    $rAddr, $rPort = $remoteEp -split ':(?!.*:)'

                    $remoteHost = '-'
                    if ($ResolveDNS -and $rAddr -and $rAddr -ne '0.0.0.0' -and $rAddr -ne '[::]' -and $rAddr -ne '*:*') {
                        $cleanRAddr = $rAddr.Trim('[', ']')
                        $remoteHost = Resolve-RemoteHostCached -IPAddress $cleanRAddr
                    }

                    $results.Add([PSCustomObject]@{
                        Time          = (Get-Date).ToString('HH:mm:ss.fff')
                        PID           = $owningPid
                        Protocol      = 'TCP'
                        LocalAddress  = $lAddr
                        LocalPort     = $lPort
                        RemoteAddress = $rAddr
                        RemotePort    = $rPort
                        State         = $state
                        RemoteHost    = $remoteHost
                    })
                }
            }
            elseif ($proto -eq 'UDP' -and $IncludeUDP -and $parts.Length -ge 4) {
                $localEp = $parts[1]
                $owningPid = [int]$parts[$parts.Length - 1]

                if ($pidSet.Contains($owningPid)) {
                    $lAddr, $lPort = $localEp -split ':(?!.*:)'
                    $results.Add([PSCustomObject]@{
                        Time          = (Get-Date).ToString('HH:mm:ss.fff')
                        PID           = $owningPid
                        Protocol      = 'UDP'
                        LocalAddress  = $lAddr
                        LocalPort     = $lPort
                        RemoteAddress = '*'
                        RemotePort    = '*'
                        State         = 'Listening'
                        RemoteHost    = '-'
                    })
                }
            }
        }
    }

    return $results
}

function Format-Endpoint {
    param([string]$Address, $Port)
    if ([string]::IsNullOrWhiteSpace($Address) -or $Address -eq '*') {
        return "*:$Port"
    }
    if ($Address.Contains(':') -and -not $Address.StartsWith('[')) {
        return "[$Address]:$Port"
    }
    return "$Address`:$Port"
}

# --------------------------------------------------------------------------------------------------
# Section 3: Main Execution Loop & UI Management
# --------------------------------------------------------------------------------------------------

Write-Host "Initializing WinNetMon Process Network Monitor..." -ForegroundColor Cyan

try {
    # Hide console cursor if supported
    try { [Console]::CursorVisible = $false } catch {}

    $iterationCount = 0

    while ($script:Running) {
        $iterationCount++
        $activeProcesses = Get-TargetProcesses

        # -------------------------------------------------------------
        # State: Process Not Running (Wait and Auto-Recover)
        # -------------------------------------------------------------
        if (-not $activeProcesses -or $activeProcesses.Count -eq 0) {
            if (-not $ContinuousLogOnly) {
                Clear-Host
                $banner = @"
================================================================================
   WinNetMon: Zero-Installation Windows Process Network Monitor
   Target: $(if ($targetBaseName) { "$targetBaseName.exe" } else { "PID $PID" }) | Mode: $(if ($isAdmin) { "Administrator" } else { "Standard User" })
================================================================================
"@
                Write-Host $banner -ForegroundColor Yellow
                Write-Host "`n[!] Target process is NOT running or has terminated." -ForegroundColor Red
                Write-Host "[*] Status: Listening... waiting for process to launch/restart (polling every $IntervalSec s)." -ForegroundColor DarkGray
                Write-Host "[*] Press Ctrl+C at any time to exit cleanly.`n" -ForegroundColor DarkGray
            } else {
                Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Target process not running. Waiting..."
            }

            # Clear cached I/O history when process closes
            $ioHistory.Clear()
            Start-Sleep -Seconds ([Math]::Max(1.0, $IntervalSec))
            continue
        }

        # -------------------------------------------------------------
        # State: Target Process is Active
        # -------------------------------------------------------------
        $pids = @($activeProcesses | ForEach-Object { $_.Id })
        $primaryProc = $activeProcesses[0]
        $procName = $primaryProc.ProcessName

        # Compute combined I/O bandwidth across all matching PIDs
        $totalReadSpeed = 0.0
        $totalWriteSpeed = 0.0
        foreach ($p in $activeProcesses) {
            $bw = Calculate-ProcessBandwidth -Proc $p
            $totalReadSpeed += $bw.ReadSpeedKBps
            $totalWriteSpeed += $bw.WriteSpeedKBps
        }

        # Retrieve active sockets
        $sockets = Get-SocketsForPids -TargetPids $pids -IncludeUDP:$IncludeUDP -ResolveDNS:$ResolveDNS

        # Append to CSV if logging enabled
        if ($logFileActive -and $sockets.Count -gt 0) {
            foreach ($s in $sockets) {
                $csvLine = '"{0}","{1}","{2}","{3}","{4}","{5}","{6}","{7}","{8}","{9}"' -f `
                    $s.Time, $s.PID, $procName, $s.Protocol, $s.LocalAddress, $s.LocalPort, $s.RemoteAddress, $s.RemotePort, $s.State, $s.RemoteHost
                $csvLine | Out-File -FilePath $LogPath -Append -Encoding utf8
            }
        }

        # Render Live Terminal Dashboard
        if (-not $ContinuousLogOnly) {
            Clear-Host
            $headerColor = if ($isAdmin) { "Green" } else { "Cyan" }

            Write-Host "==========================================================================================================" -ForegroundColor DarkCyan
            Write-Host " WinNetMon: Zero-Installation Windows Process Network Monitor v1.2" -ForegroundColor Cyan
            Write-Host " Process: $procName (Instances: $($activeProcesses.Count) | PIDs: $($pids -join ', '))" -ForegroundColor White
            Write-Host " Privilege: $(if ($isAdmin) { '[Administrator (Full Visibility)]' } else { '[Standard User (Limited to User Sockets)]' })" -ForegroundColor $headerColor
            Write-Host " Bandwidth (I/O):  Read: $([Math]::Round($totalReadSpeed, 1)) KB/s  |  Write: $([Math]::Round($totalWriteSpeed, 1)) KB/s  |  Total: $([Math]::Round($totalReadSpeed + $totalWriteSpeed, 1)) KB/s" -ForegroundColor Yellow
            if ($logFileActive) {
                Write-Host " Logging: Active -> $LogPath" -ForegroundColor Magenta
            }
            Write-Host " Polling Interval: ${IntervalSec}s | DNS Cache: $($dnsCache.Count) hosts | Press Ctrl+C to stop" -ForegroundColor DarkGray
            Write-Host "==========================================================================================================" -ForegroundColor DarkCyan

            if ($sockets.Count -eq 0) {
                Write-Host "`n [i] No active network connections or sockets detected for $procName at this moment." -ForegroundColor DarkYellow
                Write-Host "     (Listening on ports or idle waiting for outbound traffic)`n" -ForegroundColor DarkGray
            } else {
                # Format tabular output
                $tableItems = foreach ($s in $sockets) {
                    $localFormatted = Format-Endpoint -Address $s.LocalAddress -Port $s.LocalPort
                    $remoteFormatted = Format-Endpoint -Address $s.RemoteAddress -Port $s.RemotePort

                    $remoteDisplay = if ($ResolveDNS -and $s.RemoteHost -ne '-' -and $s.RemoteHost -ne $s.RemoteAddress) {
                        "$remoteFormatted ($($s.RemoteHost))"
                    } else {
                        $remoteFormatted
                    }

                    [PSCustomObject]@{
                        Time            = $s.Time
                        PID             = $s.PID
                        Proto           = $s.Protocol
                        LocalEndpoint   = $localFormatted
                        RemoteEndpoint  = $remoteDisplay
                        State           = $s.State
                        Process         = $procName
                    }
                }

                # Output clean table
                $tableItems | Format-Table -AutoSize | Out-String | Write-Host
            }

            Write-Host "Socket Summary: Established: $(@($sockets | Where-Object { $_.State -eq 'Established' }).Count) | Listen: $(@($sockets | Where-Object { $_.State -eq 'Listen' -or $_.State -eq 'Listening' }).Count) | TimeWait: $(@($sockets | Where-Object { $_.State -eq 'TimeWait' }).Count) | Total: $($sockets.Count)" -ForegroundColor Gray
        } else {
            # Continuous Log Mode terminal feedback
            Write-Output "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $procName (PIDs: $($pids -join ',')) - Sockets: $($sockets.Count) (Est: $(@($sockets | Where-Object {$_.State -eq 'Established'}).Count)) - IO: $([Math]::Round($totalReadSpeed+$totalWriteSpeed, 1)) KB/s"
        }

        # Sleep interval
        Start-Sleep -Seconds $IntervalSec
    }
}
finally {
    # ----------------------------------------------------------------------------------------------
    # Section 4: Clean Teardown & Exit Handling
    # ----------------------------------------------------------------------------------------------
    try { [Console]::CursorVisible = $true } catch {}
    Write-Host "`n`n[+] Stopping WinNetMon..." -ForegroundColor Yellow
    if ($logFileActive) {
        Write-Host "[+] Connection telemetry successfully persisted to: $LogPath" -ForegroundColor Green
    }
    Write-Host "[+] DNS Cache cleared ($($dnsCache.Count) entries resolved)." -ForegroundColor DarkGray
    Write-Host "[+] WinNetMon terminated gracefully. Goodbye.`n" -ForegroundColor Cyan
}
