/**
 * Triggers a client-side file download for textual or blob payloads with early returns.
 */
export function downloadFile(
  content: string, 
  filename: string, 
  mimeType = 'text/plain;charset=utf-8'
): void {
  if (!content || !filename || typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
