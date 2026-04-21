import {
  appendImageReferenceToken,
  appendImageReferenceTokenAtIndex
} from "../../../../../shared/utils/imageReference";
import { appendLoosePagedBboxRow } from "../../../../../shared/utils/pagedBbox";
import { LiveFieldPreview } from "../../../../preview/components/LiveFieldPreview";
import type { QuestionTypeEditorProps } from "../types";
import { PagedBboxListEditor } from "../PagedBboxListEditor";
import "./ManualGuideAnswerEditor.css";

export function ManualGuideAnswerEditor({ row, onChange }: QuestionTypeEditorProps) {
  const value = row.canonical.guide_answer.length > 0 ? row.canonical.guide_answer[0] : "";
  const answerImageCount = Array.isArray(row.canonical.guide_answer_images)
    ? row.canonical.guide_answer_images.length
    : 0;

  return (
    <div className="manual-answer-editor">
      <label className="form-field">
        <span className="manual-answer-header">
          <span>Guide Answer</span>
          <button
            type="button"
            className="tab-button"
            onClick={() => {
              const description = window.prompt("Enter image description:");
              if (description === null) {
                return;
              }
              onChange({
                ...row.canonical,
                options: null,
                guide_answer: [appendImageReferenceTokenAtIndex(value, answerImageCount, description)],
                guide_answer_images: appendLoosePagedBboxRow(
                  row.canonical.guide_answer_images,
                  row.canonical.guide_pdf_page
                )
              });
            }}
          >
            Insert Image
          </button>
          <button
            type="button"
            className="tab-button"
            disabled={answerImageCount <= 0}
            onClick={() =>
              onChange({
                ...row.canonical,
                options: null,
                guide_answer: [appendImageReferenceToken(value, answerImageCount, "Guide Image")]
              })
            }
          >
            Insert Image Ref
          </button>
        </span>
        <textarea
          data-field="guide-answer"
          value={value}
          onChange={(event) =>
            onChange({
              ...row.canonical,
              options: null,
              guide_answer: event.target.value.trim().length === 0 ? [] : [event.target.value]
            })
          }
        />
        <LiveFieldPreview text={value} images={row.canonical.guide_answer_images} />
      </label>
      <PagedBboxListEditor
        label="Guide Answer Images"
        value={row.canonical.guide_answer_images}
        onCommit={(next) =>
          onChange({
            ...row.canonical,
            guide_answer_images: next
          })
        }
      />
    </div>
  );
}
