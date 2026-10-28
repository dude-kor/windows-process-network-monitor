import React from 'react';
import { Terminal, FileSpreadsheet } from 'lucide-react';
import { SocketConnection, ProcessProfile } from '../../types/telemetry';
import { SocketTable } from './SocketTable';
import { formatSpeed } from '../../utils/formatters';

interface TerminalDisplayProps {
  preset: ProcessProfile;
  isProcessRunning: boolean;
  isAdmin: boolean;
  intervalSec: number;
  iteration: number;
  readSpeed: number;
  writeSpeed: number;
  dnsCacheCount: number;
  isLogActive: boolean;
  logPath: string;
  activeSockets: SocketConnection[];
  resolveDNS: boolean;
  onRestartProcess: () => void;
}

export const TerminalDisplay: React.FC<TerminalDisplayProps> = ({
  preset,
  isProcessRunning,
  isAdmin,
  intervalSec,
  iteration,
  readSpeed,
  writeSpeed,
  dnsCacheCount,
  isLogActive,
  logPath,
  activeSockets,
  resolveDNS,
  onRestartProcess,
}) => {
  const establishedCount = activeSockets.filter(s => s.state === 'Established').length;
  const listenCount = activeSockets.filter(s => s.state === 'Listen' || s.state === 'Listening').length;
  const timeWaitCount = activeSockets.filter(s => s.state === 'TimeWait').length;

  return (
    <div className="bg-[#0b1019] border border-slate-800 rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Terminal Title Bar */}
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-600 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-600 transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-600 transition-colors cursor-pointer" />
          </div>

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

      {/* Terminal Content Body */}
      <div className="p-4 bg-[#070b12] text-slate-200 overflow-x-auto min-h-[460px]">
        {!isProcessRunning ? (
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
              Tip: Click <span className="text-cyan-400 font-semibold cursor-pointer underline" onClick={onRestartProcess}>"Relaunch Target Process"</span> above to simulate an application restart and see WinNetMon automatically re-anchor without error.
            </div>
          </div>
        ) : (
          <div className="space-y-3 font-mono leading-relaxed">
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
              <span className="text-slate-200">Read:</span> <strong className="text-cyan-300 font-bold">{formatSpeed(readSpeed)}</strong> &nbsp;|&nbsp;
              <span className="text-slate-200">Write:</span> <strong className="text-emerald-300 font-bold">{formatSpeed(writeSpeed)}</strong> &nbsp;|&nbsp;
              <span className="text-slate-200">Total:</span> <strong className="text-yellow-300 font-bold">{formatSpeed(readSpeed + writeSpeed)}</strong>
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

            <SocketTable
              sockets={activeSockets}
              processName={preset.name}
              resolveDNS={resolveDNS}
            />

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
  );
};
