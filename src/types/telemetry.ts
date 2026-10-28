export type ProtocolType = 'TCP' | 'UDP';

export type SocketState = 
  | 'Established' 
  | 'Listen' 
  | 'TimeWait' 
  | 'CloseWait' 
  | 'SynSent' 
  | 'Listening';

export interface SocketConnection {
  id: string;
  time: string;
  pid: number;
  protocol: ProtocolType;
  localAddress: string;
  localPort: number | string;
  remoteAddress: string;
  remotePort: number | string;
  state: SocketState;
  remoteHost: string;
  bytesSec?: number;
}

export interface DefaultSocketConfig {
  protocol: ProtocolType;
  localPort: number;
  remoteAddress: string;
  remotePort: number | string;
  state: SocketState;
  remoteHost: string;
}

export interface ProcessProfile {
  name: string;
  displayName: string;
  pids: number[];
  category: string;
  description: string;
  baseReadKBps: number;
  baseWriteKBps: number;
  defaultSockets: DefaultSocketConfig[];
}

export interface BandwidthTelemetry {
  readSpeed: number;
  writeSpeed: number;
  totalSpeed: number;
}

export interface SimulationConfig {
  preset: ProcessProfile;
  isProcessRunning: boolean;
  isAdmin: boolean;
  includeUDP: boolean;
  resolveDNS: boolean;
  intervalSec: number;
  trafficBurst: boolean;
  isPaused: boolean;
}
