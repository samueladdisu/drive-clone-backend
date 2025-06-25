export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isPDF(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
