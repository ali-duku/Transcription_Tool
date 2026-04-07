export const MIN_SCALE = 0.2;
export const MAX_SCALE = 8;
export const SCALE_STEP = 0.1;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function clampPage(value: number, totalPages: number): number {
  return Math.max(1, Math.min(Math.max(1, totalPages), Math.floor(value)));
}

export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}
