import { useEffect } from "react";
import type { RectEdge } from "./bboxNudgeUtils";

interface UseBboxKeyboardShortcutsArgs {
  open: boolean;
  hasRect: boolean;
  onRequestClose: () => void;
  onNudgeRect: (dx: number, dy: number) => void;
  onNudgeEdge: (edge: RectEdge, delta: number) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return target.isContentEditable;
}

export function useBboxKeyboardShortcuts({
  open,
  hasRect,
  onRequestClose,
  onNudgeRect,
  onNudgeEdge
}: UseBboxKeyboardShortcutsArgs) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onRequestClose();
        return;
      }
      if (!hasRect || isEditableTarget(event.target)) {
        return;
      }

      const step = event.shiftKey ? 10 : 1;
      const edgeMode = event.ctrlKey || event.metaKey;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (edgeMode) {
          onNudgeEdge("x1", -step);
        } else {
          onNudgeRect(-step, 0);
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (edgeMode) {
          onNudgeEdge("x2", step);
        } else {
          onNudgeRect(step, 0);
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        if (edgeMode) {
          onNudgeEdge("y1", -step);
        } else {
          onNudgeRect(0, -step);
        }
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        if (edgeMode) {
          onNudgeEdge("y2", step);
        } else {
          onNudgeRect(0, step);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasRect, onNudgeEdge, onNudgeRect, onRequestClose, open]);
}
