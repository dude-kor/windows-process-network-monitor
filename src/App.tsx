import React, { useState } from 'react';
import { 
  Terminal, FileCode, Sliders, Cpu, FileSpreadsheet, Download, 
  Copy, Check, ShieldCheck, Activity, Wifi, HardDrive, RefreshCw
} from 'lucide-react';
import { TerminalSimulator } from './components/TerminalSimulator';
import { ScriptViewer } from './components/ScriptViewer';
import { CommandBuilder } from './components/CommandBuilder';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { CsvTelemetryViewer } from './components/CsvTelemetryViewer';
import { POWERSHELL_SCRIPT_CODE } from './scriptData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'script' | 'builder' | 'architecture' | 'csv'>('terminal');
  const [copiedScript, setCopiedScript] = useState(false);
  const [csvRows, setCsvRows] = useState<string[]>([
    `"07:18:22.104","4820","target_app.exe","TCP","192.168.1.145","52140","104.26.12.31","443","Established","api.cloudflare.com"`,
    `"07:18:22.104","4820","target_app.exe","TCP","192.168.1.145","52141","52.96.166.146","443","Established","outlook.office365.com"`,
    `"07:18:22.105","4820","target_app.exe","TCP","0.0.0.0","8088","0.0.0.0","0","Listen","-"`,
    `"07:18:22.105","4820","target_app.exe","UDP","192.168.1.145","5353","*","*","Listening","-"`
  ]);

  const handleAppendCsvRow = (row: string) => {
    setCsvRows(prev => [row, ...prev.slice(0, 199)]);
  };

  const handleClearCsv = () => {
    setCsvRows([]);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(POWERSHELL_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([POWERSHELL_SCRIPT_CODE], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Invoke-NetProcessMonitor.ps1';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Engineering Nav / Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-mono font-bold shadow-lg shadow-cyan-500/20">
              <Terminal className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-wide">
                  WinNetMon
                </h1>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Zero-Install Windows Script
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Native PowerShell 5.1/7+ Process Network &amp; Socket Activity Monitor
              </p>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> 0% Third-Party Drivers (No Npcap)
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Wifi className="w-4 h-4" /> TCP + UDP + Reverse DNS
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 text-yellow-400">
              <HardDrive className="w-4 h-4" /> Kernel I/O Bandwidth
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied .ps1' : 'Copy Script'}</span>
            </button>

            <button
              onClick={handleDownloadScript}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors cursor-pointer shadow-md shadow-cyan-950/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ps1</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1 border-t border-slate-800/80 pt-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'terminal', label: 'Live Console Simulator', icon: Terminal, badge: 'Interactive' },
              { id: 'script', label: 'Script Inspector (.ps1)', icon: FileCode, badge: 'Production' },
              { id: 'builder', label: 'CLI Parameter Builder', icon: Sliders, badge: 'Generator' },
              { id: 'architecture', label: 'Systems Engineering Dossier', icon: Cpu, badge: 'Docs' },
              { id: 'csv', label: 'CSV Telemetry Stream', icon: FileSpreadsheet, badge: `${csvRows.length}` },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                      isActive 
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'terminal' && (
          <TerminalSimulator
            onAppendCsvRow={handleAppendCsvRow}
            isLogActive={true}
            logPath="C:\Logs\AppNetworkActivity.csv"
          />
        )}

        {activeTab === 'script' && <ScriptViewer />}

        {activeTab === 'builder' && <CommandBuilder />}

        {activeTab === 'architecture' && <ArchitectureGuide />}

        {activeTab === 'csv' && (
          <CsvTelemetryViewer
            csvRows={csvRows}
            onClearRows={handleClearCsv}
            logPath="C:\Logs\AppNetworkActivity.csv"
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 sm:px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
          <div>
            WinNetMon v1.2 — Senior Windows Systems Engineering &amp; PowerShell Toolkit
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Requires: Windows 10/11 or Windows Server 2016-2025</span>
            <span className="text-slate-700">•</span>
            <span>PowerShell 5.1 (Desktop) / PowerShell 7+ (Core)</span>
            <span className="text-slate-700">•</span>
            <span className="text-emerald-400">No Npcap / Zero Drivers</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
