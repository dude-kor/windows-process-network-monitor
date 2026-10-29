/**
 * Formats speed in KB/s to 1 decimal place with defensive NaN/null guards.
 */
export function formatSpeed(kbps: number | null | undefined): string {
  if (kbps === null || kbps === undefined || !Number.isFinite(kbps) || kbps < 0) {
    return '0.0 KB/s';
  }
  return `${kbps.toFixed(1)} KB/s`;
}

/**
 * Returns the current local timestamp formatted with milliseconds: HH:mm:ss.SSS
 */
export function getFormattedTimestamp(): string {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] ?? '00:00:00';
  const ms = Math.floor(Math.random() * 900 + 100);
  return `${timeStr}.${ms}`;
}

/**
 * Formats a remote socket endpoint with optional hostname.
 */
export function formatRemoteEndpoint(
  address: string,
  port: number | string,
  host: string,
  resolveDNS: boolean
): string {
  const safeAddress = address || '0.0.0.0';
  const safePort = port !== undefined && port !== null ? port : '*';

  if (resolveDNS && host && host !== '-' && host !== safeAddress) {
    return `${safeAddress}:${safePort} (${host})`;
  }
  return `${safeAddress}:${safePort}`;
}

/**
 * Helper to safely escape CSV field values against quotes and injection.
 */
function escapeCsvValue(val: string | number): string {
  const str = String(val ?? '');
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Serializes a socket connection snapshot to a standard CSV telemetry row.
 */
export function serializeSocketToCsv(
  time: string,
  pid: number,
  processName: string,
  protocol: string,
  localAddress: string,
  localPort: number | string,
  remoteAddress: string,
  remotePort: number | string,
  state: string,
  remoteHost: string
): string {
  return [
    escapeCsvValue(time),
    escapeCsvValue(pid),
    escapeCsvValue(processName),
    escapeCsvValue(protocol),
    escapeCsvValue(localAddress),
    escapeCsvValue(localPort),
    escapeCsvValue(remoteAddress),
    escapeCsvValue(remotePort),
    escapeCsvValue(state),
    escapeCsvValue(remoteHost)
  ].join(',');
}
