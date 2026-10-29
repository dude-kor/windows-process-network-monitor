import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Copy, Check, Terminal, Shield, Play, Sliders } from 'lucide-react';
import { CommandBuilderOptions } from '../types';
import { generateCliCommands } from '../core';
import { copyToClipboard } from '../utils';

export const CommandBuilder: React.FC = () => {
  const [mode, setMode] = useState<'ByName' | 'ByPID'>('ByName');
  const [processName, setProcessName] = useState('target_app.exe');
  const [pidValue, setPidValue] = useState('4820');
  const [interval, setInterval] = useState(1.0);
  const [includeUDP, setIncludeUDP] = useState(true);
  const [resolveDNS, setResolveDNS] = useState(true);
  const [enableLogging, setEnableLogging] = useState(true);
  const [logPath, setLogPath] = useState('C:\\Logs\\target_app_net.csv');
  const [continuousLogOnly, setContinuousLogOnly] = useState(false);
  const [useBypassPolicy, setUseBypassPolicy] = useState(true);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async (text: string, key: string) => {
    if (!text) {
      return;
    }

    const success = await copyToClipboard(text);
    if (!success) {
      return;
    }

    setCopiedKey(key);
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedKey(null);
      copyTimeoutRef.current = null;
    }, 2000);
  }, []);

  const builderOptions: CommandBuilderOptions = useMemo(() => ({
    mode,
    processName,
    pidValue,
    interval,
    includeUDP,
    resolveDNS,
    enableLogging,
    logPath,
    continuousLogOnly,
    useBypassPolicy,
  }), [mode, processName, pidValue, interval, includeUDP, resolveDNS, enableLogging, logPath, continuousLogOnly, useBypassPolicy]);

  const { cliStandard, cliElevated, cliPwshCore } = useMemo(
    () => generateCliCommands(builderOptions),
    [builderOptions]
  );

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (Number.isNaN(val)) {
      return;
    }
    setInterval(Math.max(0.2, Math.min(60.0, val)));
  };

  return (
    <div className="space-y-6">
      {/* Parameter Configuration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">PowerShell CLI Parameter Configurator</h3>
            <p className="text-xs text-slate-400">Configure parameters interactively and generate production-ready execution commands.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 text-xs">
          {/* Target Mode */}
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">Target Identification Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('ByName')}
                  className={`px-3 py-2 rounded-lg border font-medium text-left transition-all cursor-pointer ${
                    mode === 'ByName'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-white">By Process Name</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">e.g. target_app.exe (Auto multi-PID)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('ByPID')}
                  className={`px-3 py-2 rounded-lg border font-medium text-left transition-all cursor-pointer ${
                    mode === 'ByPID'
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-white">By Specific PID</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">e.g. 4820 (Single process anchor)</div>
                </button>
              </div>
            </div>

            {mode === 'ByName' ? (
              <div>
                <label htmlFor="input-process-name" className="text-slate-300 font-medium block mb-1">Target Process Name</label>
                <input
                  id="input-process-name"
                  type="text"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  placeholder="e.g. target_app.exe, chrome, node"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Extension is optional. Matches all running instances automatically.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="input-pid-val" className="text-slate-300 font-medium block mb-1">Target Process ID (PID)</label>
                <input
                  id="input-pid-val"
                  type="number"
                  value={pidValue}
                  onChange={(e) => setPidValue(e.target.value)}
                  placeholder="e.g. 4820"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}

            {/* Polling Interval */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="input-interval-range" className="text-slate-300 font-medium">Sampling Interval (-IntervalSec)</label>
                <span className="text-cyan-400 font-mono font-semibold">{interval.toFixed(1)}s</span>
              </div>
              <input
                id="input-interval-range"
                type="range"
                min="0.2"
                max="10.0"
                step="0.1"
                value={interval}
                onChange={handleIntervalChange}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.2s (Aggressive)</span>
                <span>1.0s (Recommended)</span>
                <span>10.0s (Low overhead)</span>
              </div>
            </div>
          </div>

          {/* Options & Flags */}
          <div className="space-y-3.5">
            <div>
              <label className="text-slate-300 font-medium block mb-2">Protocol &amp; DNS Switches</label>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-2 bg-slate-950 border border-slate-800/80 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={includeUDP}
                    onChange={(e) => setIncludeUDP(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">-IncludeUDP</span>
                    <p className="text-[11px] text-slate-400">Queries <code className="text-cyan-300">Get-NetUDPEndpoint</code> to monitor listening UDP sockets alongside TCP.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-slate-950 border border-slate-800/80 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={resolveDNS}
                    onChange={(e) => setResolveDNS(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">-ResolveDNS</span>
                    <p className="text-[11px] text-slate-400">Enables in-memory cached reverse DNS lookup for remote IPs with timeout protection.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-slate-950 border border-slate-800/80 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={continuousLogOnly}
                    onChange={(e) => setContinuousLogOnly(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">-ContinuousLogOnly</span>
                    <p className="text-[11px] text-slate-400">Headless streaming log mode. Avoids clearing the terminal screen; ideal for background tasks.</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 bg-slate-950 border border-slate-800/80 rounded-lg cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={useBypassPolicy}
                    onChange={(e) => setUseBypassPolicy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">-ExecutionPolicy Bypass</span>
                    <p className="text-[11px] text-slate-400">Prepend bypass policy flag to bypass Windows script execution restrictions seamlessly.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* CSV Telemetry Export */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-slate-300 font-medium mb-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLogging}
                  onChange={(e) => setEnableLogging(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Persist Telemetry to CSV (-LogPath)</span>
              </label>

              {enableLogging && (
                <input
                  type="text"
                  value={logPath}
                  onChange={(e) => setLogPath(e.target.value)}
                  placeholder="C:\Logs\AppNetworkActivity.csv"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Commands Snippets */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Generated PowerShell Execution Commands
        </h4>

        {/* 1. Standard Interactive Execution */}
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Direct Console Execution (Standard or Elevated Terminal)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(cliStandard, 'std')}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
            >
              {copiedKey === 'std' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'std' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-cyan-300 overflow-x-auto select-all">
            {cliStandard}
          </div>
          <p className="text-[11px] text-slate-500">
            Uses <code className="text-slate-300">-ExecutionPolicy Bypass</code> for immediate zero-friction execution on standard Windows installations.
          </p>
        </div>

        {/* 2. Elevated UAC One-Liner */}
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Launch in Elevated Administrator Window (UAC RunAs One-Liner)
            </span>
            <button
              type="button"
              onClick={() => handleCopy(cliElevated, 'elevated')}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
            >
              {copiedKey === 'elevated' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'elevated' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-emerald-300 overflow-x-auto select-all">
            {cliElevated}
          </div>
          <p className="text-[11px] text-slate-500">
            Automatically triggers the Windows UAC elevation prompt and spawns an administrative PowerShell session with full TCP/IP socket inspect permissions.
          </p>
        </div>

        {/* 3. PowerShell 7 (Core) / Windows Terminal */}
        <div className="bg-[#0b1019] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-400" />
              PowerShell 7+ (pwsh.exe) Modern Terminal Execution
            </span>
            <button
              type="button"
              onClick={() => handleCopy(cliPwshCore, 'pwsh')}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
            >
              {copiedKey === 'pwsh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'pwsh' ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-purple-300 overflow-x-auto select-all">
            {cliPwshCore}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandBuilder;
