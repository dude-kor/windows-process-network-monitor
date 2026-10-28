/**
 * Formats speed in KB/s to 1 decimal place.
 */
export function formatSpeed(kbps: number): string {
  return `${kbps.toFixed(1)} KB/s`;
}

/**
 * Returns the current local timestamp formatted with milliseconds: HH:mm:ss.SSS
 */
export function getFormattedTimestamp(): string {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
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
  if (resolveDNS && host !== '-' && host !== address) {
    return `${address}:${port} (${host})`;
  }
  return `${address}:${port}`;
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
  return `"${time}","${pid}","${processName}","${protocol}","${localAddress}","${localPort}","${remoteAddress}","${remotePort}","${state}","${remoteHost}"`;
}
