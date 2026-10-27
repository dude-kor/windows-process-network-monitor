export interface SocketConnection {
  id: string;
  time: string;
  pid: number;
  protocol: 'TCP' | 'UDP';
  localAddress: string;
  localPort: number | string;
  remoteAddress: string;
  remotePort: number | string;
  state: 'Established' | 'Listen' | 'TimeWait' | 'CloseWait' | 'SynSent' | 'Listening';
  remoteHost: string;
  bytesSec?: number;
}

export interface ProcessProfile {
  name: string;
  displayName: string;
  pids: number[];
  category: string;
  description: string;
  baseReadKBps: number;
  baseWriteKBps: number;
  defaultSockets: Array<{
    protocol: 'TCP' | 'UDP';
    localPort: number;
    remoteAddress: string;
    remotePort: number | string;
    state: 'Established' | 'Listen' | 'TimeWait' | 'CloseWait' | 'SynSent' | 'Listening';
    remoteHost: string;
  }>;
}

export const PROCESS_PRESETS: ProcessProfile[] = [
  {
    name: 'target_app.exe',
    displayName: 'target_app.exe (Default Target)',
    pids: [4820],
    category: 'Application',
    description: 'Custom client/server enterprise desktop app communicating via HTTPS and local IPC.',
    baseReadKBps: 24.5,
    baseWriteKBps: 12.8,
    defaultSockets: [
      { protocol: 'TCP', localPort: 52140, remoteAddress: '104.26.12.31', remotePort: 443, state: 'Established', remoteHost: 'api.cloudflare.com' },
      { protocol: 'TCP', localPort: 52141, remoteAddress: '52.96.166.146', remotePort: 443, state: 'Established', remoteHost: 'outlook.office365.com' },
      { protocol: 'TCP', localPort: 52145, remoteAddress: '127.0.0.1', remotePort: 1883, state: 'Established', remoteHost: 'localhost-ipc' },
      { protocol: 'TCP', localPort: 8088, remoteAddress: '0.0.0.0', remotePort: 0, state: 'Listen', remoteHost: '-' },
      { protocol: 'UDP', localPort: 5353, remoteAddress: '*', remotePort: '*', state: 'Listening', remoteHost: '-' },
    ]
  },
  {
    name: 'chrome.exe',
    displayName: 'chrome.exe (Google Chrome - Multi-PID)',
    pids: [10424, 11892, 14208, 15330],
    category: 'Web Browser',
    description: 'Multi-process browser architecture with separate renderers, network service, and GPU processes.',
    baseReadKBps: 185.2,
    baseWriteKBps: 42.6,
    defaultSockets: [
      { protocol: 'TCP', localPort: 58210, remoteAddress: '142.250.190.46', remotePort: 443, state: 'Established', remoteHost: 'syd15s12-in-f14.1e100.net' },
      { protocol: 'TCP', localPort: 58211, remoteAddress: '172.217.167.78', remotePort: 443, state: 'Established', remoteHost: 'youtube-ui.1e100.net' },
      { protocol: 'TCP', localPort: 58219, remoteAddress: '140.82.112.4', remotePort: 443, state: 'Established', remoteHost: 'lb-140-82-112-4-iad.github.com' },
      { protocol: 'TCP', localPort: 58230, remoteAddress: '151.101.65.140', remotePort: 443, state: 'TimeWait', remoteHost: 'reddit.map.fastly.net' },
      { protocol: 'UDP', localPort: 54112, remoteAddress: '*', remotePort: '*', state: 'Listening', remoteHost: '-' },
    ]
  },
  {
    name: 'curl.exe',
    displayName: 'curl.exe (CLI Transfer Tool)',
    pids: [9240],
    category: 'Utility',
    description: 'Command-line tool executing REST API downloads and socket streaming.',
    baseReadKBps: 840.0,
    baseWriteKBps: 4.2,
    defaultSockets: [
      { protocol: 'TCP', localPort: 49812, remoteAddress: '199.232.69.194', remotePort: 443, state: 'Established', remoteHost: 'fastly.cdn.jsdelivr.net' }
    ]
  },
  {
    name: 'node.exe',
    displayName: 'node.exe (Backend Service / Server)',
    pids: [6104],
    category: 'Server / Runtime',
    description: 'Node.js backend service listening on development ports and making outbound Redis/DB queries.',
    baseReadKBps: 18.0,
    baseWriteKBps: 22.4,
    defaultSockets: [
      { protocol: 'TCP', localPort: 3000, remoteAddress: '0.0.0.0', remotePort: 0, state: 'Listen', remoteHost: '-' },
      { protocol: 'TCP', localPort: 53102, remoteAddress: '127.0.0.1', remotePort: 5432, state: 'Established', remoteHost: 'localhost-postgres' },
      { protocol: 'TCP', localPort: 53108, remoteAddress: '34.120.55.8', remotePort: 443, state: 'Established', remoteHost: 'gcs-storage.googleapis.com' },
      { protocol: 'UDP', localPort: 59320, remoteAddress: '*', remotePort: '*', state: 'Listening', remoteHost: '-' },
    ]
  },
  {
    name: 'teams.exe',
    displayName: 'teams.exe (Microsoft Teams)',
    pids: [8312, 8740],
    category: 'Collaboration',
    description: 'Real-time media and signaling sockets handling VoIP UDP streams and WebSockets.',
    baseReadKBps: 95.0,
    baseWriteKBps: 68.0,
    defaultSockets: [
      { protocol: 'TCP', localPort: 51200, remoteAddress: '52.114.132.8', remotePort: 443, state: 'Established', remoteHost: 'teams.trafficmanager.net' },
      { protocol: 'UDP', localPort: 50020, remoteAddress: '*', remotePort: '*', state: 'Listening', remoteHost: '-' },
      { protocol: 'TCP', localPort: 51204, remoteAddress: '20.190.159.23', remotePort: 443, state: 'Established', remoteHost: 'login.microsoftonline.com' }
    ]
  }
];
