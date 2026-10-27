import React, { useState } from 'react';
import { FileSpreadsheet, Download, Trash2, Copy, Check, Filter } from 'lucide-react';

interface CsvTelemetryViewerProps {
  csvRows: string[];
  onClearRows: () => void;
  logPath: string;
}

export const CsvTelemetryViewer: React.FC<CsvTelemetryViewerProps> = ({
  csvRows,
  onClearRows,
  logPath
}) => {
  const [copied, setCopied] = useState(false);
  const [filterState, setFilterState] = useState<string>('ALL');

  const headers = "Timestamp,PID,ProcessName,Protocol,LocalAddress,LocalPort,RemoteAddress,RemotePort,State,RemoteHost";
  const allCsvText = [headers, ...csvRows].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(allCsvText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([allCsvText], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ProcessNetworkTelemetry.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredRows = csvRows.filter(row => {
    if (filterState === 'ALL') return true;
    return row.includes(`"${filterState}"`);
  });

  return (
    <div className="space-y-4">
      {/* Header Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Live Telemetry CSV Stream</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {csvRows.length} Events Captured
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated file stream replicating <code className="text-cyan-300 font-mono">{logPath}</code> generated via <code className="text-slate-300 font-mono">-LogPath</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={csvRows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer disabled:opacity-40"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied CSV!' : 'Copy CSV'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={csvRows.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download .csv</span>
            </button>

            <button
              onClick={onClearRows}
              disabled={csvRows.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 rounded-lg text-xs border border-slate-700 hover:border-rose-800/40 transition-colors cursor-pointer disabled:opacity-40"
              title="Clear captured events"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter by State:
          </span>
          {['ALL', 'Established', 'Listen', 'TimeWait', 'Listening'].map(st => (
            <button
              key={st}
              onClick={() => setFilterState(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                filterState === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CSV Table / Raw Viewer */}
      <div className="bg-[#0b1019] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#070b12] overflow-x-auto max-h-[500px]">
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p>No CSV telemetry rows recorded yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">Make sure the live simulator is running and -LogPath is active.</p>
            </div>
          ) : (
            <div className="font-mono text-xs space-y-1">
              <div className="text-cyan-400 font-bold border-b border-slate-800 pb-2 select-all">
                {headers}
              </div>
              <div className="space-y-1 pt-2">
                {filteredRows.map((row, idx) => (
                  <div key={idx} className="hover:bg-slate-800/40 px-1 py-0.5 rounded text-slate-300 select-all whitespace-pre">
                    {row}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
