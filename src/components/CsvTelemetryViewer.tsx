import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { FileSpreadsheet, Download, Trash2, Copy, Check, Filter } from 'lucide-react';
import { copyToClipboard, downloadFile } from '../utils';
import { APP_CONFIG } from '../config';

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

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const allCsvText = useMemo(() => {
    return [APP_CONFIG.defaultCsvHeader, ...csvRows].join('\n');
  }, [csvRows]);

  const handleCopy = useCallback(async () => {
    if (!allCsvText) {
      return;
    }

    const success = await copyToClipboard(allCsvText);
    if (!success) {
      return;
    }

    setCopied(true);
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      copyTimeoutRef.current = null;
    }, 2000);
  }, [allCsvText]);

  const handleDownload = useCallback(() => {
    if (!allCsvText) {
      return;
    }
    downloadFile(allCsvText, 'ProcessNetworkTelemetry.csv', 'text/csv;charset=utf-8');
  }, [allCsvText]);

  const filteredRows = useMemo(() => {
    if (filterState === 'ALL') {
      return csvRows;
    }
    return csvRows.filter(row => row.includes(`"${filterState}"`));
  }, [csvRows, filterState]);

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
                Real-time CSV records captured when running with <code className="text-cyan-300">-LogPath &quot;{logPath}&quot;</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={csvRows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied CSV' : 'Copy CSV'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={csvRows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .csv</span>
            </button>

            <button
              type="button"
              onClick={onClearRows}
              disabled={csvRows.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-300 rounded-lg text-xs font-medium border border-rose-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filter Socket State:</span>
            {['ALL', 'Established', 'Listen', 'TimeWait'].map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setFilterState(st)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  filterState === st
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="text-slate-500 text-[11px] font-mono">
            Buffered limit: {APP_CONFIG.maxCsvBufferLength} rows (FIFO)
          </div>
        </div>
      </div>

      {/* CSV Code Display */}
      <div className="bg-[#0b1019] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between font-mono text-xs text-slate-400">
          <span>Telemetry Stream Buffer</span>
          <span>Showing {filteredRows.length} of {csvRows.length} events</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] font-mono text-xs text-slate-300 space-y-1">
          <div className="text-emerald-400 font-semibold select-all">
            {APP_CONFIG.defaultCsvHeader}
          </div>
          {filteredRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No matching CSV telemetry rows available. Sockets will stream automatically when the simulation is active.
            </div>
          ) : (
            filteredRows.map((row, idx) => (
              <div key={`row-${idx}-${row.slice(0, 16)}`} className="hover:bg-slate-800/40 px-1 py-0.5 rounded select-all font-mono text-[11px] text-slate-300">
                {row}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CsvTelemetryViewer;
