import { useState, useCallback, useEffect, useRef } from 'react';
import { ActiveTab } from './types';
import { TerminalSimulator } from './components/TerminalSimulator';
import { ScriptViewer } from './components/ScriptViewer';
import { CommandBuilder } from './components/CommandBuilder';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { CsvTelemetryViewer } from './components/CsvTelemetryViewer';
import { Layout } from './components/Layout';
import { POWERSHELL_SCRIPT_CODE } from './scriptData';
import { APP_CONFIG, INITIAL_CSV_ROWS } from './config';
import { copyToClipboard, downloadFile } from './utils';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');
  const [copiedScript, setCopiedScript] = useState(false);
  const [csvRows, setCsvRows] = useState<string[]>(INITIAL_CSV_ROWS);

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleAppendCsvRow = useCallback((row: string) => {
    if (!row) {
      return;
    }
    setCsvRows(prev => [row, ...prev.slice(0, APP_CONFIG.maxCsvBufferLength - 1)]);
  }, []);

  const handleClearCsv = useCallback(() => {
    setCsvRows([]);
  }, []);

  const handleCopyScript = useCallback(async () => {
    const success = await copyToClipboard(POWERSHELL_SCRIPT_CODE);
    if (!success) {
      return;
    }

    setCopiedScript(true);
    if (copyTimeoutRef.current !== null) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedScript(false);
      copyTimeoutRef.current = null;
    }, 2000);
  }, []);

  const handleDownloadScript = useCallback(() => {
    downloadFile(POWERSHELL_SCRIPT_CODE, APP_CONFIG.scriptFileName);
  }, []);

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      csvCount={csvRows.length}
      copiedScript={copiedScript}
      onCopyScript={handleCopyScript}
      onDownloadScript={handleDownloadScript}
    >
      {activeTab === 'terminal' && (
        <TerminalSimulator
          onAppendCsvRow={handleAppendCsvRow}
          isLogActive={true}
          logPath={APP_CONFIG.defaultLogPath}
        />
      )}

      {activeTab === 'script' && <ScriptViewer />}

      {activeTab === 'builder' && <CommandBuilder />}

      {activeTab === 'architecture' && <ArchitectureGuide />}

      {activeTab === 'csv' && (
        <CsvTelemetryViewer
          csvRows={csvRows}
          onClearRows={handleClearCsv}
          logPath={APP_CONFIG.defaultLogPath}
        />
      )}
    </Layout>
  );
}

export default App;
