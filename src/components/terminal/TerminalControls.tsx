import React from 'react';
import { 
  Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, 
  ShieldAlert, Activity, RefreshCw, Zap 
} from 'lucide-react';
import { ProcessProfile } from '../../types/telemetry';
import { PROCESS_PRESETS } from '../../config/processPresets';

interface TerminalControlsProps {
  preset: ProcessProfile;
  selectedPresetIndex: number;
  onSelectPreset: (index: number) => void;
  isProcessRunning: boolean;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  includeUDP: boolean;
  onToggleUDP: (val: boolean) => void;
  resolveDNS: boolean;
  onToggleDNS: (val: boolean) => void;
  intervalSec: number;
  onChangeInterval: (val: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  trafficBurst: boolean;
  bannerNotice: string | null;
  onSimulateCrash: () => void;
  onRestartProcess: () => void;
  onTriggerBurst: () => void;
}

export const TerminalControls: React.FC<TerminalControlsProps> = ({
  selectedPresetIndex,
  onSelectPreset,
  isProcessRunning,
  isAdmin,
  onToggleAdmin,
  includeUDP,
  onToggleUDP,
  resolveDNS,
  onToggleDNS,
  intervalSec,
  onChangeInterval,
  isPaused,
  onTogglePause,
  trafficBurst,
  bannerNotice,
  onSimulateCrash,
  onRestartProcess,
  onTriggerBurst,
}) => {
  return (
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

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {isProcessRunning ? (
            <button
              onClick={onSimulateCrash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
              title="Kill or stop the target application to test graceful recovery"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Simulate Process Crash
            </button>
          ) : (
            <button
              onClick={onRestartProcess}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Relaunch Target Process
            </button>
          )}

          <button
            onClick={onTriggerBurst}
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
            onClick={onTogglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            {isPaused ? 'Resume Loop' : 'Pause'}
          </button>
        </div>
      </div>

      {/* Adjustments Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 text-xs">
        <div>
          <label className="text-slate-400 font-medium block mb-1">Target Application Process</label>
          <select
            value={selectedPresetIndex}
            onChange={(e) => onSelectPreset(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
          >
            {PROCESS_PRESETS.map((p, idx) => (
              <option key={p.name} value={idx}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 font-medium block mb-1">Execution Security Token</label>
          <button
            onClick={onToggleAdmin}
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

        <div className="flex items-center gap-4 pt-4">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeUDP}
              onChange={(e) => onToggleUDP(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>-IncludeUDP</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={resolveDNS}
              onChange={(e) => onToggleDNS(e.target.checked)}
              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>-ResolveDNS</span>
          </label>
        </div>

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
            onChange={(e) => onChangeInterval(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {bannerNotice && (
        <div className="mt-3 p-2 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span>{bannerNotice}</span>
        </div>
      )}
    </div>
  );
};
