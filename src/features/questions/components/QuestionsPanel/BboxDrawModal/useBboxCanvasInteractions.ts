import { useCallback, useState, type Dispatch, type MouseEvent, type RefObject, type SetStateAction } from "react";
import {
  clamp,
  clampPointToBounds,
  hitTestHandle,
  isValidRect,
  moveRect,
  normalizeRect,
  pointInRect,
  resizeRectByHandle,
  type Rect,
  type RectHandle
} from "./bboxDrawGeometry";
import type { Size } from "./bboxDrawModalUtils";

type DragState =
  | { mode: "draw"; origin: { x: number; y: number } }
  | { mode: "resize"; handle: RectHandle; startRect: Rect }
  | { mode: "move"; origin: { x: number; y: number }; startRect: Rect }
  | null;

interface UseBboxCanvasInteractionsArgs {
  drawCanvasRef: RefObject<HTMLCanvasElement | null>;
  scale: number;
  pageBounds: Size;
  currentRect: Rect | null;
  setCurrentRect: Dispatch<SetStateAction<Rect | null>>;
}

export function useBboxCanvasInteractions({
  drawCanvasRef,
  scale,
  pageBounds,
  currentRect,
  setCurrentRect
}: UseBboxCanvasInteractionsArgs) {
  const [dragState, setDragState] = useState<DragState>(null);

  function pointerToPdfPoint(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = drawCanvasRef.current;
    if (!canvas) {
      return null;
    }
    const canvasRect = canvas.getBoundingClientRect();
    const x = clamp(event.clientX - canvasRect.left, 0, canvas.width);
    const y = clamp(event.clientY - canvasRect.top, 0, canvas.height);
    const safeScale = Math.max(0.01, scale);
    return clampPointToBounds(
      { x: x / safeScale, y: y / safeScale },
      pageBounds
    );
  }

  function onPointerDown(event: MouseEvent<HTMLCanvasElement>) {
    const point = pointerToPdfPoint(event);
    if (!point) {
      return;
    }
    if (isValidRect(currentRect)) {
      const handle = hitTestHandle(point, currentRect, 8 / Math.max(0.01, scale));
      if (handle) {
        setDragState({ mode: "resize", handle, startRect: currentRect });
        return;
      }
      if (pointInRect(point, currentRect)) {
        setDragState({ mode: "move", origin: point, startRect: currentRect });
        return;
      }
    }
    setCurrentRect({ x1: point.x, y1: point.y, x2: point.x, y2: point.y });
    setDragState({ mode: "draw", origin: point });
  }

  function onPointerMove(event: MouseEvent<HTMLCanvasElement>) {
    if (!dragState) {
      return;
    }
    const point = pointerToPdfPoint(event);
    if (!point) {
      return;
    }

    if (dragState.mode === "draw") {
      setCurrentRect(
        normalizeRect({
          x1: dragState.origin.x,
          y1: dragState.origin.y,
          x2: point.x,
          y2: point.y
        })
      );
      return;
    }

    if (dragState.mode === "resize") {
      setCurrentRect(resizeRectByHandle(dragState.startRect, dragState.handle, point, pageBounds));
      return;
    }

    setCurrentRect(
      moveRect(
        dragState.startRect,
        { x: point.x - dragState.origin.x, y: point.y - dragState.origin.y },
        pageBounds
      )
    );
  }

  const onPointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    resetDragState: onPointerUp
  };
}
