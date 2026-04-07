import { clamp, moveRect, normalizeRect, type Rect } from "./bboxDrawGeometry";
import type { Size } from "./bboxDrawModalUtils";

export type RectEdge = "x1" | "x2" | "y1" | "y2";

export function nudgeRectPosition(
  rect: Rect,
  bounds: Size,
  delta: { x: number; y: number }
): Rect {
  return moveRect(normalizeRect(rect), delta, bounds);
}

export function nudgeRectEdge(rect: Rect, bounds: Size, edge: RectEdge, amount: number): Rect {
  const normalized = normalizeRect(rect);
  const maxWidth = Math.max(1, bounds.width);
  const maxHeight = Math.max(1, bounds.height);
  switch (edge) {
    case "x1":
      return normalizeRect({
        ...normalized,
        x1: clamp(normalized.x1 + amount, 0, Math.max(0, normalized.x2 - 1))
      });
    case "x2":
      return normalizeRect({
        ...normalized,
        x2: clamp(normalized.x2 + amount, Math.min(maxWidth, normalized.x1 + 1), maxWidth)
      });
    case "y1":
      return normalizeRect({
        ...normalized,
        y1: clamp(normalized.y1 + amount, 0, Math.max(0, normalized.y2 - 1))
      });
    case "y2":
      return normalizeRect({
        ...normalized,
        y2: clamp(normalized.y2 + amount, Math.min(maxHeight, normalized.y1 + 1), maxHeight)
      });
    default:
      return normalized;
  }
}
