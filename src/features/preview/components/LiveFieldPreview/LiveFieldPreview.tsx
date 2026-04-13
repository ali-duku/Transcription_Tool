import { RichTextPreview } from "../FinalPreviewPanel/RichTextPreview";
import "./LiveFieldPreview.css";

interface LiveFieldPreviewProps {
  text: string | null | undefined;
  images?: unknown[] | null;
  label?: string;
  emptyPlaceholder?: string;
}

export function LiveFieldPreview({
  text,
  images = null,
  label = "Output Preview",
  emptyPlaceholder = "(empty)"
}: LiveFieldPreviewProps) {
  return (
    <div className="live-field-preview-wrap">
      <label className="live-field-preview-label">{label}</label>
      <div className="live-field-preview-box">
        <RichTextPreview text={text} images={images} emptyPlaceholder={emptyPlaceholder} />
      </div>
    </div>
  );
}
