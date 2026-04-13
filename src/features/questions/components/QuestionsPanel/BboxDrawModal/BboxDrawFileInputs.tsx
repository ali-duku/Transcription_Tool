import type { ChangeEvent } from "react";
import type { PdfViewerSource } from "../../../../pdf/mainViewer/state/pdfViewerReducer";

interface BboxDrawFileInputsProps {
  setTextbookInputRef: (node: HTMLInputElement | null) => void;
  setGuideInputRef: (node: HTMLInputElement | null) => void;
  onUpload: (source: PdfViewerSource, event: ChangeEvent<HTMLInputElement>) => void;
}

export function BboxDrawFileInputs({
  setTextbookInputRef,
  setGuideInputRef,
  onUpload
}: BboxDrawFileInputsProps) {
  return (
    <>
      <input
        ref={setTextbookInputRef}
        type="file"
        accept="application/pdf"
        className="pdf-hidden-input"
        onChange={(event) => void onUpload("textbook", event)}
      />
      <input
        ref={setGuideInputRef}
        type="file"
        accept="application/pdf"
        className="pdf-hidden-input"
        onChange={(event) => void onUpload("guide", event)}
      />
    </>
  );
}
