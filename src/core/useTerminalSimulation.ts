import { useState, useEffect, useRef, useCallback } from 'react';
import { SocketConnection } from '../types/telemetry';
import { PROCESS_PRESETS } from '../config/processPresets';
import { APP_CONFIG } from '../config/constants';
import { 
  calculateSimulatedBandwidth, 
  createInitialSockets, 
  evolveSockets 
} from './telemetryEngine';
import { serializeSocketToCsv } from '../utils/formatters';

interface UseTerminalSimulationProps {
  onAppendCsvRow?: (row: string) => void;
  isLogActive: boolean;
}

export function useTerminalSimulation({
  onAppendCsvRow,
  isLogActive
}: UseTerminalSimulationProps) {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [isProcessRunning, setIsProcessRunning] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);
  const [includeUDP, setIncludeUDP] = useState(true);
  const [resolveDNS, setResolveDNS] = useState(true);
  const [intervalSec, setIntervalSec] = useState<number>(APP_CONFIG.defaultIntervalSec);
  const [isPaused, setIsPaused] = useState(false);
  const [trafficBurst, setTrafficBurst] = useState(false);

  const [readSpeed, setReadSpeed] = useState(24.5);
  const [writeSpeed, setWriteSpeed] = useState(12.8);
  const [dnsCacheCount] = useState(14);
  const [iteration, setIteration] = useState(1);
  const [activeSockets, setActiveSockets] = useState<SocketConnection[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const preset = PROCESS_PRESETS[selectedPresetIndex];

  // Ref locks to avoid stale closures in setInterval and keep renders pure
  const activeSocketsRef = useRef<SocketConnection[]>([]);
  const onAppendCsvRowRef = useRef(onAppendCsvRow);
  onAppendCsvRowRef.current = onAppendCsvRow;
  const isLogActiveRef = useRef(isLogActive);
  isLogActiveRef.current = isLogActive;

  // Initialize and update sockets whenever preset changes or filter toggles change
  useEffect(() => {
    if (!isProcessRunning) {
      activeSocketsRef.current = [];
      setActiveSockets([]);
      return;
    }

    const initial = createInitialSockets(preset, includeUDP, resolveDNS);
    activeSocketsRef.current = initial;
    setActiveSockets(initial);
    setReadSpeed(preset.baseReadKBps);
    setWriteSpeed(preset.baseWriteKBps);
  }, [selectedPresetIndex, isProcessRunning, includeUDP, resolveDNS, preset]);

  // Main polling ticker
  useEffect(() => {
    if (isPaused) return;

    const intervalMs = Math.max(300, intervalSec * 1000);
    const timer = setInterval(() => {
      setIteration(prev => prev + 1);

      if (!isProcessRunning) {
        return;
      }

      // Compute bandwidth fluctuation
      const speeds = calculateSimulatedBandwidth(preset.baseReadKBps, preset.baseWriteKBps, trafficBurst);
      setReadSpeed(speeds.readSpeed);
      setWriteSpeed(speeds.writeSpeed);

      // Evolve active sockets
      const updated = evolveSockets(activeSocketsRef.current, preset, resolveDNS, trafficBurst);
      activeSocketsRef.current = updated;
      setActiveSockets(updated);

      // Clean side effect outside of React state updater function
      if (isLogActiveRef.current && onAppendCsvRowRef.current && updated.length > 0) {
        const sample = updated[Math.floor(Math.random() * updated.length)];
        const csvLine = serializeSocketToCsv(
          sample.time,
          sample.pid,
          preset.name,
          sample.protocol,
          sample.localAddress,
          sample.localPort,
          sample.remoteAddress,
          sample.remotePort,
          sample.state,
          sample.remoteHost
        );
        onAppendCsvRowRef.current(csvLine);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, isProcessRunning, intervalSec, trafficBurst, preset, resolveDNS]);

  const handleSimulateCrash = useCallback(() => {
    setIsProcessRunning(false);
    setBannerNotice('Process terminated externally by SIGKILL/TaskKill.');
    setTimeout(() => setBannerNotice(null), APP_CONFIG.bannerTimeoutMs);
  }, []);

  const handleRestartProcess = useCallback(() => {
    setIsProcessRunning(true);
    setBannerNotice(`Process ${preset.name} launched. WinNetMon automatically re-anchored to PIDs.`);
    setTimeout(() => setBannerNotice(null), APP_CONFIG.bannerTimeoutMs);
  }, [preset.name]);

  const handleTriggerBurst = useCallback(() => {
    setTrafficBurst(true);
    setBannerNotice('Simulating high-throughput network burst & new socket handshakes...');
    setTimeout(() => {
      setTrafficBurst(false);
      setBannerNotice(null);
    }, APP_CONFIG.burstDurationMs);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const toggleAdmin = useCallback(() => {
    setIsAdmin(prev => !prev);
  }, []);

  return {
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
  };
}
