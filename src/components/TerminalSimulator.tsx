import React from 'react';
import { useTerminalSimulation } from '../core/useTerminalSimulation';
import { TerminalControls } from './terminal/TerminalControls';
import { TerminalDisplay } from './terminal/TerminalDisplay';

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
  const {
    preset,
    selectedPresetIndex,
    setSelectedPresetIndex,
    isProcessRunning,
    isAdmin,
    toggleAdmin,
    includeUDP,
    setIncludeUDP,
    resolveDNS,
    setResolveDNS,
    intervalSec,
    setIntervalSec,
    isPaused,
    togglePause,
    trafficBurst,
    readSpeed,
    writeSpeed,
    dnsCacheCount,
    iteration,
    activeSockets,
    bannerNotice,
    handleSimulateCrash,
    handleRestartProcess,
    handleTriggerBurst
  } = useTerminalSimulation({ onAppendCsvRow, isLogActive });

  return (
    <div className="space-y-4">
      <TerminalControls
        preset={preset}
        selectedPresetIndex={selectedPresetIndex}
        onSelectPreset={setSelectedPresetIndex}
        isProcessRunning={isProcessRunning}
        isAdmin={isAdmin}
        onToggleAdmin={toggleAdmin}
        includeUDP={includeUDP}
        onToggleUDP={setIncludeUDP}
        resolveDNS={resolveDNS}
        onToggleDNS={setResolveDNS}
        intervalSec={intervalSec}
        onChangeInterval={setIntervalSec}
        isPaused={isPaused}
        onTogglePause={togglePause}
        trafficBurst={trafficBurst}
        bannerNotice={bannerNotice}
        onSimulateCrash={handleSimulateCrash}
        onRestartProcess={handleRestartProcess}
        onTriggerBurst={handleTriggerBurst}
      />

      <TerminalDisplay
        preset={preset}
        isProcessRunning={isProcessRunning}
        isAdmin={isAdmin}
        intervalSec={intervalSec}
        iteration={iteration}
        readSpeed={readSpeed}
        writeSpeed={writeSpeed}
        dnsCacheCount={dnsCacheCount}
        isLogActive={isLogActive}
        logPath={logPath}
        activeSockets={activeSockets}
        resolveDNS={resolveDNS}
        onRestartProcess={handleRestartProcess}
      />
    </div>
  );
};
