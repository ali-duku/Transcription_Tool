import { AppIcon } from "../../../../../shared/ui/AppIcon";

interface PagedBboxRowActionsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
  onDraw: () => void;
  onPaste: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function PagedBboxRowActions({
  onMoveUp,
  onMoveDown,
  onInsertBefore,
  onInsertAfter,
  onDraw,
  onPaste,
  onCopy,
  onDuplicate,
  onRemove
}: PagedBboxRowActionsProps) {
  return (
    <div className="bbox-editor-row-actions">
      <button type="button" className="tab-button" onClick={onMoveUp}>
        <AppIcon name="arrowUp" />
        <span>Up</span>
      </button>
      <button type="button" className="tab-button" onClick={onMoveDown}>
        <AppIcon name="arrowDown" />
        <span>Down</span>
      </button>
      <button type="button" className="tab-button" onClick={onInsertBefore}>
        <AppIcon name="add" />
        <span>Before</span>
      </button>
      <button type="button" className="tab-button" onClick={onInsertAfter}>
        <AppIcon name="add" />
        <span>After</span>
      </button>
      <button type="button" className="tab-button" onClick={onDraw}>
        <AppIcon name="draw" />
        <span>Draw</span>
      </button>
      <button type="button" className="tab-button" onClick={onPaste}>
        <AppIcon name="paste" />
        <span>Paste</span>
      </button>
      <button type="button" className="tab-button" onClick={onCopy}>
        <AppIcon name="copy" />
        <span>Copy</span>
      </button>
      <button type="button" className="tab-button" onClick={onDuplicate}>
        <AppIcon name="duplicate" />
        <span>Duplicate</span>
      </button>
      <button type="button" className="tab-button" onClick={onRemove}>
        <AppIcon name="close" />
        <span>Remove</span>
      </button>
    </div>
  );
}
