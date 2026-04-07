export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type RectHandle = "nw" | "ne" | "sw" | "se";

interface Point {
  x: number;
  y: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeRect(rect: Rect): Rect {
  return {
    x1: Math.min(rect.x1, rect.x2),
    y1: Math.min(rect.y1, rect.y2),
    x2: Math.max(rect.x1, rect.x2),
    y2: Math.max(rect.y1, rect.y2)
  };
}

export function isValidRect(rect: Rect | null): rect is Rect {
  if (!rect) {
    return false;
  }
  const normalized = normalizeRect(rect);
  return normalized.x2 > normalized.x1 && normalized.y2 > normalized.y1;
}

export function pointInRect(point: Point, rect: Rect): boolean {
  const normalized = normalizeRect(rect);
  return (
    point.x >= normalized.x1 &&
    point.x <= normalized.x2 &&
    point.y >= normalized.y1 &&
    point.y <= normalized.y2
  );
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function cornerPoints(rect: Rect): Record<RectHandle, Point> {
  const normalized = normalizeRect(rect);
  return {
    nw: { x: normalized.x1, y: normalized.y1 },
    ne: { x: normalized.x2, y: normalized.y1 },
    sw: { x: normalized.x1, y: normalized.y2 },
    se: { x: normalized.x2, y: normalized.y2 }
  };
}

export function hitTestHandle(point: Point, rect: Rect, radius = 8): RectHandle | null {
  const corners = cornerPoints(rect);
  if (distance(point, corners.nw) <= radius) return "nw";
  if (distance(point, corners.ne) <= radius) return "ne";
  if (distance(point, corners.sw) <= radius) return "sw";
  if (distance(point, corners.se) <= radius) return "se";
  return null;
}

export function clampPointToBounds(point: Point, bounds: { width: number; height: number }): Point {
  return {
    x: clamp(point.x, 0, Math.max(0, bounds.width)),
    y: clamp(point.y, 0, Math.max(0, bounds.height))
  };
}

export function moveRect(
  rect: Rect,
  delta: Point,
  bounds: { width: number; height: number }
): Rect {
  const normalized = normalizeRect(rect);
  const width = normalized.x2 - normalized.x1;
  const height = normalized.y2 - normalized.y1;
  const maxX = Math.max(0, bounds.width - width);
  const maxY = Math.max(0, bounds.height - height);
  const nextX = clamp(normalized.x1 + delta.x, 0, maxX);
  const nextY = clamp(normalized.y1 + delta.y, 0, maxY);
  return {
    x1: nextX,
    y1: nextY,
    x2: nextX + width,
    y2: nextY + height
  };
}

export function resizeRectByHandle(
  rect: Rect,
  handle: RectHandle,
  point: Point,
  bounds: { width: number; height: number }
): Rect {
  const normalized = normalizeRect(rect);
  const clamped = clampPointToBounds(point, bounds);
  switch (handle) {
    case "nw":
      return normalizeRect({
        x1: clamped.x,
        y1: clamped.y,
        x2: normalized.x2,
        y2: normalized.y2
      });
    case "ne":
      return normalizeRect({
        x1: normalized.x1,
        y1: clamped.y,
        x2: clamped.x,
        y2: normalized.y2
      });
    case "sw":
      return normalizeRect({
        x1: clamped.x,
        y1: normalized.y1,
        x2: normalized.x2,
        y2: clamped.y
      });
    case "se":
      return normalizeRect({
        x1: normalized.x1,
        y1: normalized.y1,
        x2: clamped.x,
        y2: clamped.y
      });
    default:
      return normalized;
  }
}

export function drawOverlay(
  canvas: HTMLCanvasElement | null,
  rect: Rect | null,
  scale: number
): void {
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!isValidRect(rect)) {
    return;
  }

  const normalized = normalizeRect(rect);
  const displayRect = {
    x1: normalized.x1 * scale,
    y1: normalized.y1 * scale,
    x2: normalized.x2 * scale,
    y2: normalized.y2 * scale
  };
  const width = Math.max(1, displayRect.x2 - displayRect.x1);
  const height = Math.max(1, displayRect.y2 - displayRect.y1);

  context.lineWidth = 2;
  context.strokeStyle = "#22c55e";
  context.fillStyle = "rgba(34, 197, 94, 0.16)";
  context.strokeRect(displayRect.x1, displayRect.y1, width, height);
  context.fillRect(displayRect.x1, displayRect.y1, width, height);

  const handleSize = 8;
  context.fillStyle = "#f8fafc";
  context.strokeStyle = "#15803d";
  const handles = cornerPoints(displayRect);
  (Object.keys(handles) as RectHandle[]).forEach((key) => {
    const p = handles[key];
    context.beginPath();
    context.rect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize);
    context.fill();
    context.stroke();
  });
}
