import React from 'react';
import { SocketConnection } from '../../types/telemetry';
import { formatRemoteEndpoint } from '../../utils/formatters';

interface SocketTableProps {
  sockets: SocketConnection[];
  processName: string;
  resolveDNS: boolean;
}

export const SocketTable: React.FC<SocketTableProps> = ({
  sockets,
  processName,
  resolveDNS,
}) => {
  if (sockets.length === 0) {
    return (
      <div className="py-8 text-center text-amber-400/80">
        <p>[i] No active network connections or sockets detected for {processName} at this moment.</p>
        <p className="text-slate-500 text-xs mt-1">(Process is idle or waiting for outbound requests)</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-700/80 text-slate-400 text-[11px] uppercase tracking-wider">
            <th className="py-1.5 pr-3">Time</th>
            <th className="py-1.5 pr-3">PID</th>
            <th className="py-1.5 pr-3">Proto</th>
            <th className="py-1.5 pr-4">Local Endpoint</th>
            <th className="py-1.5 pr-4">Remote Endpoint</th>
            <th className="py-1.5 pr-3">State</th>
            <th className="py-1.5">Process</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {sockets.map((sock) => {
            const isEstablished = sock.state === 'Established';
            const isListen = sock.state === 'Listen' || sock.state === 'Listening';
            const isWait = sock.state === 'TimeWait' || sock.state === 'CloseWait';

            const stateBadgeClass = isEstablished
              ? 'text-emerald-400 font-semibold'
              : isListen
              ? 'text-cyan-400'
              : isWait
              ? 'text-amber-400'
              : 'text-slate-300';

            const remoteDisplay = formatRemoteEndpoint(
              sock.remoteAddress,
              sock.remotePort,
              sock.remoteHost,
              resolveDNS
            );

            return (
              <tr key={sock.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-1.5 pr-3 text-slate-400">{sock.time}</td>
                <td className="py-1.5 pr-3 text-yellow-300 font-semibold">{sock.pid}</td>
                <td className="py-1.5 pr-3">
                  <span className={`px-1 py-0.2 rounded text-[10px] font-bold ${
                    sock.protocol === 'TCP'
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                      : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                  }`}>
                    {sock.protocol}
                  </span>
                </td>
                <td className="py-1.5 pr-4 text-slate-300">
                  {sock.localAddress}:{sock.localPort}
                </td>
                <td className="py-1.5 pr-4 text-slate-100 max-w-xs truncate" title={remoteDisplay}>
                  {remoteDisplay}
                </td>
                <td className={`py-1.5 pr-3 ${stateBadgeClass}`}>
                  {sock.state}
                </td>
                <td className="py-1.5 text-cyan-300 font-semibold">
                  {processName}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
