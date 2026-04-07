import { isValidRect, normalizeRect, type Rect } from "./bboxDrawGeometry";

export interface Size {
  width: number;
  height: number;
}

function normalizeOrNull(rect: Rect | null): Rect | null {
  return isValidRect(rect) ? normalizeRect(rect) : null;
}

export function areRectsEqual(a: Rect | null, b: Rect | null): boolean {
  const left = normalizeOrNull(a);
  const right = normalizeOrNull(b);
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.x1 === right.x1 &&
    left.y1 === right.y1 &&
    left.x2 === right.x2 &&
    left.y2 === right.y2
  );
}

export function toPageBounds(canvas: HTMLCanvasElement, scale: number): Size {
  const safeScale = Math.max(0.01, scale);
  return {
    width: canvas.width / safeScale,
    height: canvas.height / safeScale
  };
}
