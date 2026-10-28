export * from './telemetry';

export type ActiveTab = 'terminal' | 'script' | 'builder' | 'architecture' | 'csv';

export interface CommandBuilderOptions {
  mode: 'ByName' | 'ByPID';
  processName: string;
  pidValue: string;
  interval: number;
  includeUDP: boolean;
  resolveDNS: boolean;
  enableLogging: boolean;
  logPath: string;
  continuousLogOnly: boolean;
  useBypassPolicy: boolean;
}

export interface GeneratedCommands {
  rawInvocation: string;
  cliStandard: string;
  cliElevated: string;
  cliPwshCore: string;
}
