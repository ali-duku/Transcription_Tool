import { parseMultiline, splitMatchingOptions } from "../questionPanelUtils";
import type { QuestionTypeEditorProps } from "../types";
import "./MatchingEditor.css";

export function MatchingEditor({ row, onChange }: QuestionTypeEditorProps) {
  const sides = splitMatchingOptions(row.canonical.options);
  const relationships = Array.isArray(row.canonical.guide_answer) ? row.canonical.guide_answer : [];

  function updateFromText(leftText: string, rightText: string, relationshipText: string) {
    const left = parseMultiline(leftText);
    const right = parseMultiline(rightText);
    const pairs = parseMultiline(relationshipText);
    onChange({
      ...row.canonical,
      options: left.length === 0 && right.length === 0 ? [] : [...left, "---", ...right],
      guide_answer: pairs
    });
  }

  return (
    <div className="nested-editor">
      <strong>Matching Setup</strong>
      <div className="form-row-grid">
        <label className="form-field">
          <span>Left Items (one per line)</span>
          <textarea
            data-field="matching-left"
            value={sides.left.join("\n")}
            onChange={(event) =>
              updateFromText(event.target.value, sides.right.join("\n"), relationships.join("\n"))
            }
          />
        </label>
        <label className="form-field">
          <span>Right Items (one per line)</span>
          <textarea
            data-field="matching-right"
            value={sides.right.join("\n")}
            onChange={(event) =>
              updateFromText(sides.left.join("\n"), event.target.value, relationships.join("\n"))
            }
          />
        </label>
      </div>

      <label className="form-field">
        <span>Relationships (format `left:right`, one per line)</span>
        <textarea
          data-field="matching-relationships"
          value={relationships.join("\n")}
          onChange={(event) => updateFromText(sides.left.join("\n"), sides.right.join("\n"), event.target.value)}
        />
      </label>
    </div>
  );
}
