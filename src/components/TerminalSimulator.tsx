import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, 
  ShieldAlert, Activity, Wifi, Globe, HardDrive, RefreshCw,
  Zap, Download, FileSpreadsheet, Check
} from 'lucide-react';
import { SocketConnection, PROCESS_PRESETS, ProcessProfile } from '../types';

interface TerminalSimulatorProps {
  onAppendCsvRow?: (row: string) => void;
  isLogActive: boolean;
  logPath: string;
}

export const TerminalSimulator: React.FC<TerminalSimulatorProps> = ({
  onAppendCsvRow,
  isLogActive,
  logPath
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isProcessRunning, setIsProcessRunning] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);
  const [includeUDP, setIncludeUDP] = useState(true);
  const [resolveDNS, setResolveDNS] = useState(true);
  const [intervalSec, setIntervalSec] = useState(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [trafficBurst, setTrafficBurst] = useState(false);

  // Bandwidth telemetry
  const [readSpeed, setReadSpeed] = useState(24.5);
  const [writeSpeed, setWriteSpeed] = useState(12.8);
  const [dnsCacheCount, setDnsCacheCount] = useState(14);
  const [iteration, setIteration] = useState(1);
  const [activeSockets, setActiveSockets] = useState<SocketConnection[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const preset = PROCESS_PRESETS[selectedPresetIndex];

  const activeSocketsRef = useRef<SocketConnection[]>([]);
  const onAppendCsvRowRef = useRef(onAppendCsvRow);
  onAppendCsvRowRef.current = onAppendCsvRow;
  const isLogActiveRef = useRef(isLogActive);
  isLogActiveRef.current = isLogActive;

  // Initialize and update sockets whenever preset changes
  useEffect(() => {
    if (!isProcessRunning) {
      activeSocketsRef.current = [];
      setActiveSockets([]);
      return;
    }

    const initial: SocketConnection[] = preset.defaultSockets
      .filter(s => includeUDP || s.protocol === 'TCP')
      .map((s, idx) => ({
        id: `${s.protocol}-${s.localPort}-${idx}`,
        time: new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100),
        pid: preset.pids[idx % preset.pids.length],
        protocol: s.protocol,
        localAddress: s.state === 'Listen' ? '0.0.0.0' : '192.168.1.145',
        localPort: s.localPort,
        remoteAddress: s.remoteAddress,
        remotePort: s.remotePort,
        state: s.state,
        remoteHost: resolveDNS ? s.remoteHost : '-'
      }));

    activeSocketsRef.current = initial;
    setActiveSockets(initial);
    setReadSpeed(preset.baseReadKBps);
    setWriteSpeed(preset.baseWriteKBps);
  }, [selectedPresetIndex, isProcessRunning, includeUDP, resolveDNS]);

  // Main polling ticker
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setIteration(prev => prev + 1);

      if (!isProcessRunning) {
        // Target process not running, polling in wait loop
        return;
      }

      // Fluctuate I/O bandwidth realistically
      const burstMultiplier = trafficBurst ? 6.5 : 1.0;
      const noise = (Math.random() * 0.4 - 0.2);
      const newRead = Math.max(0.2, (preset.baseReadKBps * (1 + noise)) * burstMultiplier);
      const newWrite = Math.max(0.1, (preset.baseWriteKBps * (1 + noise)) * burstMultiplier);
      setReadSpeed(parseFloat(newRead.toFixed(1)));
      setWriteSpeed(parseFloat(newWrite.toFixed(1)));

      const timeNow = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Math.random() * 900 + 100);
      const current = activeSocketsRef.current;

      const updated = current.map(sock => {
        // Occasionally cycle TimeWait into Established or vice-versa
        let st = sock.state;
        if (sock.protocol === 'TCP' && sock.state !== 'Listen') {
          if (Math.random() < 0.08) {
            st = sock.state === 'Established' ? 'TimeWait' : 'Established';
          }
        }
        return {
          ...sock,
          time: timeNow,
          state: st,
          remoteHost: resolveDNS ? (sock.remoteHost !== '-' ? sock.remoteHost : 'cdn.edge.net') : '-'
        };
      });

      // If burst is active, inject dynamic short-lived connections
      if (trafficBurst && updated.length < 12) {
        const dynamicPort = Math.floor(50000 + Math.random() * 10000);
        const endpoints = [
          { ip: '13.107.42.16', host: 'identity.microsoft.com', proto: 'TCP' as const },
          { ip: '172.217.16.206', host: 'play.googleapis.com', proto: 'TCP' as const },
          { ip: '1.1.1.1', host: 'one.one.one.one', proto: 'TCP' as const },
        ];
        const choice = endpoints[Math.floor(Math.random() * endpoints.length)];
        updated.push({
          id: `transient-${dynamicPort}-${Date.now()}`,
          time: timeNow,
          pid: preset.pids[0],
          protocol: choice.proto,
          localAddress: '192.168.1.145',
          localPort: dynamicPort,
          remoteAddress: choice.ip,
          remotePort: 443,
          state: 'Established',
          remoteHost: resolveDNS ? choice.host : '-'
        });
      }

      activeSocketsRef.current = updated;
      setActiveSockets(updated);

      // CSV appending simulation executed cleanly outside the state updater
      if (isLogActiveRef.current && onAppendCsvRowRef.current && updated.length > 0) {
        const sample = updated[Math.floor(Math.random() * updated.length)];
        const csvLine = `"${sample.time}","${sample.pid}","${preset.name}","${sample.protocol}","${sample.localAddress}","${sample.localPort}","${sample.remoteAddress}","${sample.remotePort}","${sample.state}","${sample.remoteHost}"`;
        onAppendCsvRowRef.current(csvLine);
      }

    }, Math.max(300, intervalSec * 1000));

    return () => clearInterval(timer);
  }, [isPaused, isProcessRunning, intervalSec, trafficBurst, preset, resolveDNS]);

  const handleSimulateCrash = () => {
    setIsProcessRunning(false);
    setBannerNotice('Process terminated externally by SIGKILL/TaskKill.');
    setTimeout(() => setBannerNotice(null), 3000);
  };

  const handleRestartProcess = () => {
    setIsProcessRunning(true);
    setBannerNotice(`Process ${preset.name} launched. WinNetMon automatically re-anchored to PIDs.`);
    setTimeout(() => setBannerNotice(null), 3000);
  };

  const handleTriggerBurst = () => {
    setTrafficBurst(true);
    setBannerNotice('Simulating high-throughput network burst & new socket handshakes...');
    setTimeout(() => {
      setTrafficBurst(false);
      setBannerNotice(null);
    }, 4000);
  };

  const establishedCount = activeSockets.filter(s => s.state === 'Established').length;
  const listenCount = activeSockets.filter(s => s.state === 'Listen' || s.state === 'Listening').length;
  const timeWaitCount = activeSockets.filter(s => s.state === 'TimeWait').length;

  return (
    <div className="space-y-4">
      {/* Simulation Control Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
                Interactive Windows Host Simulator
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  PowerShell 5.1 / 7+
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Test the script in real-time under process termination, multi-PID binding, and high traffic loads.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {isProcessRunning ? (
              <button
                onClick={handleSimulateCrash}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                title="Kill or stop the target application to test graceful recovery"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Simulate Process Crash
              </button>
            ) : (
              <button
                onClick={handleRestartProcess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Relaunch Target Process
              </button>
            )}

            <button
              onClick={handleTriggerBurst}
              disabled={!isProcessRunning || trafficBurst}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                trafficBurst 
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 cursor-pointer'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Generate sudden burst of TCP handshakes and I/O transfer"
            >
              <Zap className="w-3.5 h-3.5" />
              {trafficBurst ? 'Burst Active...' : 'Burst Traffic'}
            </button>

            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              {isPaused ? 'Resume Loop' : 'Pause'}
            </button>
          </div>
        </div>

        {/* Live Adjustments Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 text-xs">
          {/* Target Process Preset */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">Target Application Process</label>
            <select
              value={selectedPresetIndex}
              onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            >
              {PROCESS_PRESETS.map((p, idx) => (
                <option key={p.name} value={idx}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </div>

          {/* Elevation Mode Toggle */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">Execution Security Token</label>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                isAdmin 
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300' 
                  : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
                {isAdmin ? 'Administrator (Elevated)' : 'Standard User (Non-Elevated)'}
              </span>
              <span className="text-[10px] underline">Toggle</span>
            </button>
          </div>

          {/* Toggles: UDP & Reverse DNS */}
          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeUDP}
                onChange={(e) => setIncludeUDP(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>-IncludeUDP</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={resolveDNS}
                onChange={(e) => setResolveDNS(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>-ResolveDNS</span>
            </label>
          </div>

          {/* Polling Interval */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Refresh Interval</span>
              <span className="text-cyan-400 font-mono font-semibold">{intervalSec.toFixed(1)}s</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="5.0"
              step="0.1"
              value={intervalSec}
              onChange={(e) => setIntervalSec(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Temporary Notification Banner */}
        {bannerNotice && (
          <div className="mt-3 p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-xs text-cyan-200 flex items-center gap-2 animate-fadeIn">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>{bannerNotice}</span>
          </div>
        )}
      </div>

      {/* Realistic Windows Terminal Frame */}
      <div className="bg-[#0b1019] border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
        {/* Terminal Header Bar */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-600 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-600 transition-colors cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-600 transition-colors cursor-pointer" />
            </div>
            
            {/* PowerShell Tab */}
            <div className="flex items-center gap-2 bg-[#0b1019] border border-slate-800 border-b-0 px-3 py-1 rounded-t-md text-slate-300 font-medium text-xs">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isAdmin ? 'Administrator: Windows PowerShell (Invoke-NetProcessMonitor.ps1)' : 'Windows PowerShell - Standard User'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isProcessRunning ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
              {isProcessRunning ? 'Active Polling' : 'Auto-Wait Standby'}
            </span>
            <span className="text-slate-600">|</span>
            <span>Iter: #{iteration}</span>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="p-4 bg-[#070b12] text-slate-200 overflow-x-auto min-h-[460px]">
          {!isProcessRunning ? (
            /* Process Terminated / Graceful Auto-Recovery View */
            <div className="space-y-3 font-mono">
              <div className="text-yellow-400 leading-tight">
                ================================================================================<br />
                &nbsp;&nbsp;&nbsp;WinNetMon: Zero-Installation Windows Process Network Monitor<br />
                &nbsp;&nbsp;&nbsp;Target: {preset.name} | Mode: {isAdmin ? 'Administrator' : 'Standard User'}<br />
                ================================================================================
              </div>
              <div className="text-rose-400 font-bold flex items-center gap-2">
                <span>[!] Target process is NOT running or has terminated.</span>
              </div>
              <div className="text-slate-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>[*] Status: Listening... waiting for process to launch/restart (polling every {intervalSec}s).</span>
              </div>
              <div className="text-slate-500">
                [*] Press Ctrl+C at any time to exit cleanly.
              </div>
              <div className="pt-6 border-t border-slate-800/60 text-slate-600 text-xs">
                Tip: Click <span className="text-cyan-400 font-semibold cursor-pointer underline" onClick={handleRestartProcess}>"Relaunch Target Process"</span> above to simulate an application restart and see WinNetMon automatically re-anchor without error.
              </div>
            </div>
          ) : (
            /* Active Live Process Socket Dashboard */
            <div className="space-y-3 font-mono leading-relaxed">
              {/* Header Box */}
              <div className="text-cyan-600 select-none">
                ==========================================================================================================
              </div>
              <div className="text-cyan-400 font-bold text-sm tracking-tight">
                WinNetMon: Zero-Installation Windows Process Network Monitor v1.2
              </div>
              <div className="flex flex-wrap items-center gap-x-4 text-slate-100">
                <span>Process: <strong className="text-white font-semibold">{preset.name}</strong></span>
                <span className="text-slate-500">|</span>
                <span>Instances: <strong className="text-cyan-300">{preset.pids.length}</strong></span>
                <span className="text-slate-500">|</span>
                <span>PIDs: <span className="text-yellow-300 font-semibold">{preset.pids.join(', ')}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span>Privilege:</span>
                <span className={isAdmin ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                  {isAdmin ? '[Administrator (Full Kernel Visibility)]' : '[Standard User (Limited to Owned Sockets)]'}
                </span>
              </div>
              <div className="text-yellow-400 bg-yellow-950/20 px-2 py-1 rounded border border-yellow-800/40 inline-block">
                Bandwidth (I/O): &nbsp;
                <span className="text-slate-200">Read:</span> <strong className="text-cyan-300 font-bold">{readSpeed.toFixed(1)} KB/s</strong> &nbsp;|&nbsp;
                <span className="text-slate-200">Write:</span> <strong className="text-emerald-300 font-bold">{writeSpeed.toFixed(1)} KB/s</strong> &nbsp;|&nbsp;
                <span className="text-slate-200">Total:</span> <strong className="text-yellow-300 font-bold">{(readSpeed + writeSpeed).toFixed(1)} KB/s</strong>
              </div>
              {isLogActive && (
                <div className="text-pink-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Logging: Active -&gt; {logPath} (Appending live events)</span>
                </div>
              )}
              <div className="text-slate-500 text-[11px]">
                Polling Interval: {intervalSec}s &nbsp;|&nbsp; DNS Cache: {dnsCacheCount} hosts &nbsp;|&nbsp; Press Ctrl+C to stop
              </div>
              <div className="text-cyan-600 select-none">
                ==========================================================================================================
              </div>

              {/* Sockets Table */}
              {activeSockets.length === 0 ? (
                <div className="py-8 text-center text-amber-400/80">
                  <p>[i] No active network connections or sockets detected for {preset.name} at this moment.</p>
                  <p className="text-slate-500 text-xs mt-1">(Process is idle or waiting for outbound requests)</p>
                </div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/80 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="py-1.5 pr-3">Time</th>
                        <th className="py-1.5 pr-3">PID</th>
                        <th className="py-1.5 pr-3">Proto</th>
                        <th className="py-1.5 pr-4">Local Endpoint</th>
                        <th className="py-1.5 pr-4">Remote Endpoint</th>
                        <th className="py-1.5 pr-3">State</th>
                        <th className="py-1.5">Process</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {activeSockets.map((sock) => {
                        const isEstablished = sock.state === 'Established';
                        const isListen = sock.state === 'Listen' || sock.state === 'Listening';
                        const isWait = sock.state === 'TimeWait' || sock.state === 'CloseWait';

                        const stateBadgeClass = isEstablished
                          ? 'text-emerald-400 font-semibold'
                          : isListen
                          ? 'text-cyan-400'
                          : isWait
                          ? 'text-amber-400'
                          : 'text-slate-300';

                        const remoteDisplay = resolveDNS && sock.remoteHost !== '-' && sock.remoteHost !== sock.remoteAddress
                          ? `${sock.remoteAddress}:${sock.remotePort} (${sock.remoteHost})`
                          : `${sock.remoteAddress}:${sock.remotePort}`;

                        return (
                          <tr key={sock.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-1.5 pr-3 text-slate-400">{sock.time}</td>
                            <td className="py-1.5 pr-3 text-yellow-300 font-semibold">{sock.pid}</td>
                            <td className="py-1.5 pr-3">
                              <span className={`px-1 py-0.2 rounded text-[10px] font-bold ${sock.protocol === 'TCP' ? 'bg-blue-950 text-blue-300 border border-blue-800/50' : 'bg-purple-950 text-purple-300 border border-purple-800/50'}`}>
                                {sock.protocol}
                              </span>
                            </td>
                            <td className="py-1.5 pr-4 text-slate-300">
                              {sock.localAddress}:{sock.localPort}
                            </td>
                            <td className="py-1.5 pr-4 text-slate-100 max-w-xs truncate" title={remoteDisplay}>
                              {remoteDisplay}
                            </td>
                            <td className={`py-1.5 pr-3 ${stateBadgeClass}`}>
                              {sock.state}
                            </td>
                            <td className="py-1.5 text-cyan-300 font-semibold">
                              {preset.name}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Status Footer */}
              <div className="pt-3 border-t border-slate-800 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  Socket Summary: &nbsp;
                  <span className="text-emerald-400 font-semibold">Established: {establishedCount}</span> &nbsp;|&nbsp;
                  <span className="text-cyan-400 font-semibold">Listen: {listenCount}</span> &nbsp;|&nbsp;
                  <span className="text-amber-400 font-semibold">TimeWait: {timeWaitCount}</span> &nbsp;|&nbsp;
                  <span className="text-white font-semibold">Total: {activeSockets.length}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ctrl+C invokes <code className="text-slate-300">finally</code> block for clean terminal restore
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
