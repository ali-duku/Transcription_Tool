import type { MouseEvent } from "react";
import { clamp, normalizeRect, type Rect } from "./bboxDrawGeometry";
import type { Size } from "./bboxDrawModalUtils";

export type PageBboxMap = Record<number, Rect[]>;

export function toLegacyPosition(rect: Rect): [[number, number], [number, number]] {
  const normalized = normalizeRect(rect);
  return [
    [Math.round(normalized.x2), Math.round(normalized.y1)],
    [Math.round(normalized.x1), Math.round(normalized.y2)]
  ];
}

export function hasAnyBoxes(map: PageBboxMap): boolean {
  return Object.values(map).some((items) => items.length > 0);
}

export function readPdfPointFromMouseEvent(
  event: MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  scale: number,
  pageBounds: Size
) {
  const rect = canvas.getBoundingClientRect();
  const localX = clamp(event.clientX - rect.left, 0, canvas.width);
  const localY = clamp(event.clientY - rect.top, 0, canvas.height);
  const safeScale = Math.max(0.01, scale);
  const x = clamp(localX / safeScale, 0, Math.max(0, pageBounds.width));
  const y = clamp(localY / safeScale, 0, Math.max(0, pageBounds.height));
  return { x, y };
}
