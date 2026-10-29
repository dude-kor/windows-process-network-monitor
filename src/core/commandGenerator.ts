import { CommandBuilderOptions, GeneratedCommands } from '../types';
import { APP_CONFIG } from '../config';

/**
 * Pure generator to transform CLI builder form options into execution commands with defensive sanitization.
 */
export function generateCliCommands(options: CommandBuilderOptions): GeneratedCommands {
  const args: string[] = [];

  if (options.mode === 'ByName') {
    const rawName = options.processName ?? '';
    const pName = rawName.trim() || 'target_app.exe';
    args.push(`-ProcessName "${pName}"`);
  } else {
    const rawPid = options.pidValue ?? '';
    const pid = rawPid.trim() || '1';
    args.push(`-PID ${pid}`);
  }

  const safeInterval = Number.isFinite(options.interval) ? options.interval : 1.0;
  if (safeInterval !== 1.0) {
    args.push(`-IntervalSec ${safeInterval.toFixed(1)}`);
  }

  if (options.includeUDP) {
    args.push('-IncludeUDP');
  }

  if (options.resolveDNS) {
    args.push('-ResolveDNS');
  }

  const rawLogPath = options.logPath ?? '';
  if (options.enableLogging && rawLogPath.trim()) {
    args.push(`-LogPath "${rawLogPath.trim()}"`);
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

export default generateCliCommands;
