import React, { useState } from 'react';
import { Copy, Check, Download, Search, FileCode, Shield, CheckCircle2 } from 'lucide-react';
import { POWERSHELL_SCRIPT_CODE } from '../scriptData';

export const ScriptViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const lines = POWERSHELL_SCRIPT_CODE.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(POWERSHELL_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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

  const filteredLines = searchQuery.trim()
    ? lines.map((line, idx) => ({ line, originalIdx: idx + 1 })).filter(item => item.line.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">Invoke-NetProcessMonitor.ps1</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Zero Dependencies (Inbox Native)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Single-file, self-contained PowerShell 5.1 &amp; 7+ automation script. Ready for immediate deployment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Script (.ps1)'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-md shadow-cyan-950/40"
            >
              <Download className="w-4 h-4" />
              <span>Download Invoke-NetProcessMonitor.ps1</span>
            </button>
          </div>
        </div>

        {/* Engineering Highlights Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Lines of Code: <strong className="text-white">{lines.length}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Target OS: <strong className="text-white">Windows 10 / 11 / Server</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Runtime: <strong className="text-white">PowerShell 5.1 / 7+</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Driver Required: <strong className="text-emerald-400">NONE (0% Npcap)</strong></span>
          </div>
        </div>
      </div>

      {/* Code Viewer Frame with Search */}
      <div className="bg-[#0b1019] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search functions, parameters, cmdlets (e.g., Get-NetTCPConnection, Calculate-ProcessBandwidth)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-8 pr-3 py-1 text-slate-200 text-xs font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="text-slate-400 text-xs font-mono">
            {filteredLines ? `Showing ${filteredLines.length} matched lines` : `Total ${lines.length} lines`}
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#070b12] overflow-x-auto max-h-[640px] text-xs font-mono leading-relaxed select-text">
          {filteredLines ? (
            <div className="space-y-1">
              {filteredLines.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">No lines matching &quot;{searchQuery}&quot;</div>
              ) : (
                filteredLines.map((item) => (
                  <div key={item.originalIdx} className="flex gap-4 hover:bg-slate-800/40 px-2 py-0.5 rounded">
                    <span className="w-10 text-right text-slate-600 select-none">{item.originalIdx}</span>
                    <span className="text-slate-200 whitespace-pre">{item.line}</span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isComment = line.trim().startsWith('#') || line.trim().startsWith('<#') || line.trim().startsWith('.#') || line.trim().startsWith('*');
                  const isFunction = line.trim().startsWith('function ');
                  const isParam = line.trim().startsWith('param(') || line.trim().startsWith('[Parameter');

                  let textColor = 'text-slate-200';
                  if (isComment) textColor = 'text-emerald-500/80 italic';
                  else if (isFunction) textColor = 'text-yellow-300 font-bold';
                  else if (isParam) textColor = 'text-cyan-300';
                  else if (line.includes('Get-NetTCPConnection') || line.includes('Get-Process') || line.includes('Get-NetUDPEndpoint') || line.includes('netstat')) {
                    textColor = 'text-cyan-200';
                  }

                  return (
                    <tr key={lineNum} className="hover:bg-slate-800/30">
                      <td className="w-12 pr-4 text-right text-slate-600 select-none align-top">
                        {lineNum}
                      </td>
                      <td className={`whitespace-pre ${textColor}`}>
                        {line || ' '}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
