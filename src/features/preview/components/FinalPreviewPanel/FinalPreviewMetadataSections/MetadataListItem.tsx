import type { InputScrollTarget } from "../../../../../shared/types/navigation";
import "./MetadataListItem.css";

interface MetadataListItemProps {
  label: string;
  value: string;
  target: InputScrollTarget;
  onNavigateToInput?: (target: InputScrollTarget) => void;
}

export function MetadataListItem({
  label,
  value,
  target,
  onNavigateToInput
}: MetadataListItemProps) {
  return (
    <li className="metadata-list-item">
      <span>
        {label}: {value}
      </span>
      {onNavigateToInput ? (
        <button
          type="button"
          className="preview-jump-button preview-jump-button-inline"
          onClick={() => onNavigateToInput(target)}
        >
          Edit
        </button>
      ) : null}
    </li>
  );
}
