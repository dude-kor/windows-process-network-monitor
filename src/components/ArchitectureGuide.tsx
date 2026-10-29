import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Cpu, Network, ShieldCheck, Database, Layers,
  AlertCircle, Copy, Check
} from 'lucide-react';
import { 
  ELEVATION_SNIPPET, 
  PERF_COUNTER_COMPARE_SNIPPET, 
  PRIVILEGE_MATRIX_ROWS 
} from '../config';
import { copyToClipboard } from '../utils/clipboard';

type SectionKey = 'sockets' | 'bandwidth' | 'dns' | 'privileges' | 'compat';

export const ArchitectureGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('sockets');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async (text: string, id: string) => {
    if (!text) {
      return;
    }

    const success = await copyToClipboard(text);
    if (!success) {
      return;
    }

    setCopiedSnippet(id);
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedSnippet(null);
      copyTimeoutRef.current = null;
    }, 2000);
  }, []);

  const navTabs: Array<{ id: SectionKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'sockets', label: '1. Socket Mapping Engine', icon: Network },
    { id: 'bandwidth', label: '2. Bandwidth & I/O Deltas', icon: Cpu },
    { id: 'dns', label: '3. Reverse DNS & Caching', icon: Database },
    { id: 'privileges', label: '4. Privilege Matrix & UAC', icon: ShieldCheck },
    { id: 'compat', label: '5. PS 5.1 vs PS 7 Compatibility', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Senior Windows Systems Engineering &amp; Architecture Dossier
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Technical breakdown of Windows NT kernel networking, socket discovery internals, performance counter nuances, and zero-install execution.
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800 text-xs">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Socket Mapping Engine */}
      {activeSection === 'sockets' && (
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Socket Discovery: Why Zero Installation Works Without WinPcap / Npcap
            </h3>
            <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              100% Kernel-Native
            </span>
          </div>

          <p>
            Traditional packet sniffers (Wireshark, tcpdump) require kernel-mode Network Driver Interface Specification (NDIS) filter drivers like <strong>Npcap</strong> or <strong>WinPcap</strong> to copy raw ethernet frames. For process-to-socket attribution, this is unnecessarily heavy, requires rebooting or driver installs, and violates zero-installation constraints.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-cyan-300">1. Primary: NetTCPIP Cmdlets</div>
              <p className="text-[11px] text-slate-400">
                <code className="text-slate-200">Get-NetTCPConnection</code> and <code className="text-slate-200">Get-NetUDPEndpoint</code> query the inbox Windows Management Instrumentation (WMI) / CIM provider <code className="text-slate-300">MSFT_NetTCPConnection</code>. They query <code className="text-slate-300">tcpip.sys</code> directly with zero overhead.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-emerald-300">2. Fallback: netstat -ano</div>
              <p className="text-[11px] text-slate-400">
                If the WMI/CIM repository is corrupt or restricted, WinNetMon automatically invokes an internal regex parser over the built-in Windows binary <code className="text-slate-200">netstat.exe</code>. This ensures uninterrupted execution even in stripped-down environments.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-purple-300">3. Under the Hood: IP Helper</div>
              <p className="text-[11px] text-slate-400">
                Both tools interface with <code className="text-slate-200">iphlpapi.dll!GetExtendedTcpTable</code> with <code className="text-slate-300">TCP_TABLE_OWNER_PID_ALL</code>, retrieving socket tables containing local/remote addresses, ports, MIB connection states, and process IDs in memory.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <h4 className="font-semibold text-white mb-2">IPv6 &amp; Endpoint Parsing Robustness:</h4>
            <p className="text-slate-300 text-[11px]">
              A common bug in naïve netstat parsers is splitting strings on colons (<code className="text-cyan-300">:</code>). In IPv6 endpoints like <code className="text-slate-200">[fe80::1]:443</code> or <code className="text-slate-200">[::]:8080</code>, standard splitting breaks the IP address. WinNetMon utilizes negative lookahead regex <code className="text-cyan-300">:(?!.*:)</code> to strictly split on the <em>final</em> port colon, flawlessly preserving both IPv4 and IPv6 formatting.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Bandwidth & I/O Deltas */}
      {activeSection === 'bandwidth' && (
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Bandwidth Tracking: Why PID-Anchored Kernel I/O Deltas Outperform PerfMon
            </h3>
            <span className="text-amber-400 font-mono text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
              Senior Engineering Decision
            </span>
          </div>

          <p>
            Windows administrators often reach for <code className="text-slate-200">Get-Counter &apos;\Process(name)\IO Read Bytes/sec&apos;</code>. However, in production Windows environments, Windows Performance Counters have a critical architectural flaw:
          </p>

          <div className="bg-rose-950/20 border border-rose-800/40 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              The Performance Counter &quot;Instance Index Collision&quot; Flaw
            </div>
            <p className="text-slate-300 text-[11px]">
              When an application spawns multiple processes (e.g. Chrome, Teams, Edge, Node worker pools), Windows names them <code className="text-rose-200 font-mono">chrome</code>, <code className="text-rose-200 font-mono">chrome#1</code>, <code className="text-rose-200 font-mono">chrome#2</code>. If process #1 terminates, the remaining instances instantly shift indexes. Querying PerfMon counters by name causes index desynchronization, stale readings, and crashes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">WinNetMon&apos;s Solution: Kernel IO_COUNTERS Delta Calculation</span>
              <button
                type="button"
                onClick={() => handleCopy(PERF_COUNTER_COMPARE_SNIPPET, 'perf')}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copiedSnippet === 'perf' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'perf' ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-200 overflow-x-auto">
              {PERF_COUNTER_COMPARE_SNIPPET}
            </pre>
          </div>

          <p className="text-[11px] text-slate-400">
            By querying <code className="text-slate-200">System.Diagnostics.Process</code> properties (<code className="text-cyan-300">IOReadTransferCount</code> and <code className="text-cyan-300">IOWriteTransferCount</code>), the script reads directly from the Windows NT kernel <code className="text-slate-200">EPROCESS-&gt;IOCounters</code> block. Each reading is anchored strictly to the immutable numeric Process ID (PID). The calculation has 0ms counter warmup latency and negligible CPU footprint.
          </p>
        </div>
      )}

      {/* Tab 3: Reverse DNS & Caching */}
      {activeSection === 'dns' && (
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Reverse DNS Optimization: Zero-Lag In-Memory Lookup Cache
            </h3>
            <span className="text-cyan-400 font-mono text-[11px] bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
              System.Net.Dns
            </span>
          </div>

          <p>
            When monitoring network connections at a 1-second interval, reverse DNS lookups (<code className="text-slate-200">PTR queries</code>) are a notorious source of UI freezing. If a remote server has no PTR record or the DNS resolver drops UDP packets, a synchronous <code className="text-slate-200">[System.Net.Dns]::GetHostEntry($ip)</code> call can block execution for 2 to 4 seconds, destroying console refresh fluidity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-cyan-300">1. In-Memory Hash Cache</div>
              <p className="text-[11px] text-slate-400">
                WinNetMon initializes a strongly-typed .NET <code className="text-slate-200">[System.Collections.Generic.Dictionary[string, string]]</code>. Every resolved IP address is stored in RAM. Successive queries for the same IP are returned in O(1) microsecond time with 0 network calls.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-emerald-300">2. Fallback on Failure</div>
              <p className="text-[11px] text-slate-400">
                If a lookup throws a <code className="text-slate-200">SocketException</code> (e.g. host not found), the cache records the raw IP as the resolved value. This ensures the script never redundantly re-queries unresolvable endpoints on subsequent iterations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Privilege Matrix & UAC */}
      {activeSection === 'privileges' && (
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Windows Security &amp; Privilege Matrix
            </h3>
            <span className="text-purple-400 font-mono text-[11px] bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              RBAC / UAC
            </span>
          </div>

          <p>
            WinNetMon is designed to run in both <strong>Standard User</strong> (unprivileged) and <strong>Administrator</strong> (elevated) sessions. Below is the exact operational matrix of what Windows NT security boundaries allow:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                  <th className="p-3">Capability / Feature</th>
                  <th className="p-3">Standard User (Non-Elevated)</th>
                  <th className="p-3">Administrator (Elevated)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {PRIVILEGE_MATRIX_ROWS.map((row) => (
                  <tr key={row.capability}>
                    <td className="p-3 text-slate-300">{row.capability}</td>
                    <td className={`p-3 ${row.standardClass}`}>{row.standardUser}</td>
                    <td className={`p-3 ${row.adminClass}`}>{row.administrator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Self-Elevation Snippet (Can be prepended if Administrator is strictly required):</span>
              <button
                type="button"
                onClick={() => handleCopy(ELEVATION_SNIPPET, 'elev')}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {copiedSnippet === 'elev' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet === 'elev' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-300 overflow-x-auto">
              {ELEVATION_SNIPPET}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: PS 5.1 vs PS 7 Compatibility */}
      {activeSection === 'compat' && (
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-6 space-y-5 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Cross-Version Compatibility: Windows PowerShell 5.1 vs PowerShell 7+
            </h3>
            <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Universal Support
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-cyan-300">Windows PowerShell 5.1 (Pre-installed on all Windows 10/11)</div>
              <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                <li>Runs on the classic .NET Framework 4.8 runtime.</li>
                <li>Uses native inbox module <code className="text-slate-300">NetTCPIP</code> located at <code className="text-slate-300">C:\Windows\System32\WindowsPowerShell\v1.0\Modules</code>.</li>
                <li>Execution policy default is often <code className="text-yellow-300">Restricted</code>, easily bypassed using <code className="text-cyan-300">-ExecutionPolicy Bypass</code>.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-purple-300">PowerShell 7.x+ (Modern .NET Core Runtime)</div>
              <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                <li>Runs on .NET 8 / 9 with modern high-performance JIT and memory efficiency.</li>
                <li>Supports identical cmdlet signatures and Win32 interop.</li>
                <li>Enhanced ANSI terminal formatting support in Windows Terminal.</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-white">Execution Policy Bypass Quick Reference:</div>
            <p className="text-[11px] text-slate-400">
              If running in a locked-down enterprise workstation where scripts are blocked, run:
            </p>
            <div className="bg-slate-950 p-2.5 rounded font-mono text-cyan-300 text-[11px]">
              Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
            </div>
            <p className="text-[11px] text-slate-500">
              The <code className="text-slate-300">-Scope Process</code> parameter changes the policy <em>strictly</em> for the current terminal session without requiring administrative rights and leaves no permanent system changes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureGuide;
