import "./PreviewSectionHeading.css";

export function PreviewSectionHeading({
  label,
  onEdit
}: {
  label: string;
  onEdit?: () => void;
}) {
  return (
    <div className="preview-section-heading">
      <strong>{label}</strong>
      {onEdit ? (
        <button type="button" className="preview-jump-button preview-jump-button-inline" onClick={onEdit}>
          Edit
        </button>
      ) : null}
    </div>
  );
}
