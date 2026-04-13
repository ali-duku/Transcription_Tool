import type { DocumentAction } from "../../../../features/shell/state/documentReducer";
import type { InputSubTabKey } from "../../../../shared/types/navigation";

type ApplyDocumentAction = (action: DocumentAction) => void;

export function clearCurrentSubTabFields(
  subTab: InputSubTabKey,
  applyDocumentAction: ApplyDocumentAction
) {
  if (subTab === "book_metadata") {
    applyDocumentAction({ type: "set_book_title_page", value: null });
    return;
  }
  if (subTab === "unit_preamble") {
    applyDocumentAction({ type: "set_unit_preamble", value: null });
    return;
  }
  if (subTab === "preamble") {
    applyDocumentAction({ type: "set_lesson_preamble", value: null });
    return;
  }
  if (subTab === "basic") {
    applyDocumentAction({ type: "set_textbook_page", value: null });
    applyDocumentAction({ type: "set_textbook_pdf_page", value: null });
    applyDocumentAction({ type: "set_guidebook_pdf_pages", value: null });
    applyDocumentAction({ type: "set_page_type", value: "content" });
    return;
  }
  if (subTab === "content") {
    applyDocumentAction({ type: "content", action: { type: "reset" } });
    return;
  }
  if (subTab === "questions") {
    applyDocumentAction({ type: "questions", action: { type: "reset" } });
  }
}
