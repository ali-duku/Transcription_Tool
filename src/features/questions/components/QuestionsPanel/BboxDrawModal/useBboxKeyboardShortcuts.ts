import { useEffect } from "react";

interface UseBboxKeyboardShortcutsArgs {
  open: boolean;
  hasRect: boolean;
  onRequestClose: () => void;
  onNudgeRect: (dx: number, dy: number) => void;
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
  onNudgeRect
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
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNudgeRect(-step, 0);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNudgeRect(step, 0);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        onNudgeRect(0, -step);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onNudgeRect(0, step);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasRect, onNudgeRect, onRequestClose, open]);
}
