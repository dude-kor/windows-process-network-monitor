export const APP_CONFIG = {
  name: 'WinNetMon',
  version: '1.2',
  subtitle: 'Zero-Install Windows Process Network Monitor',
  scriptFileName: 'Invoke-NetProcessMonitor.ps1',
  defaultLogPath: 'C:\\Logs\\AppNetworkActivity.csv',
  defaultCsvHeader: 'Timestamp,PID,ProcessName,Protocol,LocalAddress,LocalPort,RemoteAddress,RemotePort,State,RemoteHost',
  minIntervalSec: 0.3,
  maxIntervalSec: 5.0,
  defaultIntervalSec: 1.0,
  maxCsvBufferLength: 200,
  burstDurationMs: 4000,
  burstSpeedMultiplier: 6.5,
  bannerTimeoutMs: 3000,
} as const;

export const INITIAL_CSV_ROWS: string[] = [
  `"07:18:22.104","4820","target_app.exe","TCP","192.168.1.145","52140","104.26.12.31","443","Established","api.cloudflare.com"`,
  `"07:18:22.104","4820","target_app.exe","TCP","192.168.1.145","52141","52.96.166.146","443","Established","outlook.office365.com"`,
  `"07:18:22.105","4820","target_app.exe","TCP","0.0.0.0","8088","0.0.0.0","0","Listen","-"`,
  `"07:18:22.105","4820","target_app.exe","UDP","192.168.1.145","5353","*","*","Listening","-"`
];
