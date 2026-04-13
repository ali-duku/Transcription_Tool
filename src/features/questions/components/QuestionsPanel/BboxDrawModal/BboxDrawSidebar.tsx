import { toLegacyPosition } from "./bboxDrawModalHelpers";
import type { Rect } from "./bboxDrawGeometry";

interface BboxDrawSidebarProps {
  page: number;
  boxes: Rect[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function BboxDrawSidebar({ page, boxes, selectedIndex, onSelect }: BboxDrawSidebarProps) {
  return (
    <aside className="bbox-draw-sidebar">
      <h3>Bounding Boxes</h3>
      <p className="bbox-draw-sidebar-meta">Per current page</p>
      <div className="bbox-draw-list">
        {boxes.length === 0 ? (
          <p className="bbox-draw-empty-list">No saved boxes on this page.</p>
        ) : (
          boxes.map((rect, index) => {
            const legacyPosition = toLegacyPosition(rect);
            const isSelected = selectedIndex === index;
            return (
              <button
                key={`bbox-${page}-${index}`}
                type="button"
                className={`bbox-draw-list-item${isSelected ? " active" : ""}`}
                onClick={() => onSelect(index)}
              >
                <code>{JSON.stringify({ page, position: legacyPosition })}</code>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
