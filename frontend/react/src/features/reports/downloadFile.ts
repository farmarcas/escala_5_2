export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Dá tempo ao navegador de iniciar o download antes de liberar o arquivo.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadCsv = (content: string, fileName: string) =>
  downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8' }), fileName);
