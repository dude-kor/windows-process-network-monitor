import { CommandBuilderOptions, GeneratedCommands } from '../types';
import { APP_CONFIG } from '../config/constants';

/**
 * Pure generator to transform CLI builder form options into execution commands.
 */
export function generateCliCommands(options: CommandBuilderOptions): GeneratedCommands {
  const args: string[] = [];

  if (options.mode === 'ByName') {
    const pName = options.processName.trim() || 'target_app.exe';
    args.push(`-ProcessName "${pName}"`);
  } else {
    const pid = options.pidValue.trim() || '1';
    args.push(`-PID ${pid}`);
  }

  if (options.interval !== 1.0) {
    args.push(`-IntervalSec ${options.interval}`);
  }

  if (options.includeUDP) {
    args.push('-IncludeUDP');
  }

  if (options.resolveDNS) {
    args.push('-ResolveDNS');
  }

  if (options.enableLogging && options.logPath.trim()) {
    args.push(`-LogPath "${options.logPath.trim()}"`);
  }

  if (options.continuousLogOnly) {
    args.push('-ContinuousLogOnly');
  }

  const argString = args.join(' ');
  const scriptName = `.\\${APP_CONFIG.scriptFileName}`;
  const rawInvocation = `${scriptName} ${argString}`;

  const cliStandard = options.useBypassPolicy
    ? `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ${scriptName} ${argString}`
    : rawInvocation;

  const cliElevated = `Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File \\"\`$PWD\\${APP_CONFIG.scriptFileName}\\" ${argString}"`;

  const cliPwshCore = `pwsh -NoProfile -File ${scriptName} ${argString}`;

  return {
    rawInvocation,
    cliStandard,
    cliElevated,
    cliPwshCore
  };
}
