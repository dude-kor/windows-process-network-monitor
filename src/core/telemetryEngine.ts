import { SocketConnection, ProcessProfile } from '../types/telemetry';
import { getFormattedTimestamp } from '../utils';
import { APP_CONFIG } from '../config';

const TRANSIENT_ENDPOINTS = [
  { ip: '13.107.42.16', host: 'identity.microsoft.com', proto: 'TCP' as const },
  { ip: '172.217.16.206', host: 'play.googleapis.com', proto: 'TCP' as const },
  { ip: '1.1.1.1', host: 'one.one.one.one', proto: 'TCP' as const },
] as const;

/**
 * Calculates simulated bandwidth read/write speeds based on process profiles, jitter, and bursts.
 */
export function calculateSimulatedBandwidth(
  baseReadKBps: number,
  baseWriteKBps: number,
  trafficBurst: boolean
): { readSpeed: number; writeSpeed: number } {
  const safeBaseRead = Number.isFinite(baseReadKBps) && baseReadKBps > 0 ? baseReadKBps : 10.0;
  const safeBaseWrite = Number.isFinite(baseWriteKBps) && baseWriteKBps > 0 ? baseWriteKBps : 5.0;

  const burstMultiplier = trafficBurst ? APP_CONFIG.burstSpeedMultiplier : 1.0;
  const noise = Math.random() * 0.4 - 0.2;
  const newRead = Math.max(0.2, safeBaseRead * (1 + noise) * burstMultiplier);
  const newWrite = Math.max(0.1, safeBaseWrite * (1 + noise) * burstMultiplier);

  return {
    readSpeed: parseFloat(newRead.toFixed(1)),
    writeSpeed: parseFloat(newWrite.toFixed(1))
  };
}

/**
 * Generates initial active socket list for a process preset with defensive PID validation.
 */
export function createInitialSockets(
  preset: ProcessProfile,
  includeUDP: boolean,
  resolveDNS: boolean
): SocketConnection[] {
  const timeNow = getFormattedTimestamp();
  const availablePids = Array.isArray(preset.pids) && preset.pids.length > 0 
    ? preset.pids 
    : [4820];

  const sockets = Array.isArray(preset.defaultSockets) ? preset.defaultSockets : [];

  return sockets
    .filter(s => includeUDP || s.protocol === 'TCP')
    .map((s, idx) => ({
      id: `${s.protocol}-${s.localPort}-${idx}`,
      time: timeNow,
      pid: availablePids[idx % availablePids.length] ?? 4820,
      protocol: s.protocol,
      localAddress: s.state === 'Listen' ? '0.0.0.0' : '192.168.1.145',
      localPort: s.localPort,
      remoteAddress: s.remoteAddress,
      remotePort: s.remotePort,
      state: s.state,
      remoteHost: resolveDNS ? s.remoteHost : '-'
    }));
}

/**
 * Updates existing socket states and optionally injects dynamic burst connections.
 */
export function evolveSockets(
  current: SocketConnection[],
  preset: ProcessProfile,
  resolveDNS: boolean,
  trafficBurst: boolean
): SocketConnection[] {
  const timeNow = getFormattedTimestamp();
  const availablePids = Array.isArray(preset.pids) && preset.pids.length > 0 
    ? preset.pids 
    : [4820];

  const updated: SocketConnection[] = current.map(sock => {
    let nextState = sock.state;
    if (sock.protocol === 'TCP' && sock.state !== 'Listen') {
      if (Math.random() < 0.08) {
        nextState = sock.state === 'Established' ? 'TimeWait' : 'Established';
      }
    }
    return {
      ...sock,
      time: timeNow,
      state: nextState,
      remoteHost: resolveDNS ? (sock.remoteHost !== '-' ? sock.remoteHost : 'cdn.edge.net') : '-'
    };
  });

  if (trafficBurst && updated.length < 12) {
    const dynamicPort = Math.floor(50000 + Math.random() * 10000);
    const randomIndex = Math.floor(Math.random() * TRANSIENT_ENDPOINTS.length);
    const choice = TRANSIENT_ENDPOINTS[randomIndex] ?? TRANSIENT_ENDPOINTS[0];

    updated.push({
      id: `transient-${dynamicPort}-${Date.now()}`,
      time: timeNow,
      pid: availablePids[0] ?? 4820,
      protocol: choice.proto,
      localAddress: '192.168.1.145',
      localPort: dynamicPort,
      remoteAddress: choice.ip,
      remotePort: 443,
      state: 'Established',
      remoteHost: resolveDNS ? choice.host : '-'
    });
  }

  return updated;
}
