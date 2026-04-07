import type { ChangeEvent } from "react";
import type { ChoiceEditorProps } from "../types";
import "./ChoiceEditor.css";

export function ChoiceEditor({ row, isCheckbox, onChange }: ChoiceEditorProps) {
  const options = Array.isArray(row.canonical.options) && row.canonical.options.length > 0
    ? row.canonical.options
    : ["Option 1"];
  const selected = row.canonical.guide_answer;

  function updateOptions(nextOptions: string[], nextSelected: string[] = selected) {
    onChange({
      ...row.canonical,
      options: nextOptions,
      guide_answer: nextSelected
    });
  }

  function onOptionTextChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const nextOptions = [...options];
    const previousText = nextOptions[index] ?? "";
    const nextText = event.target.value;
    nextOptions[index] = nextText;
    const nextSelected = selected.map((item) => (item === previousText ? nextText : item));
    updateOptions(nextOptions, nextSelected);
  }

  function removeOption(index: number) {
    if (options.length <= 1) {
      return;
    }
    const removed = options[index];
    const nextOptions = options.filter((_, optionIndex) => optionIndex !== index);
    const nextSelected = selected.filter((item) => item !== removed);
    updateOptions(nextOptions, nextSelected);
  }

  function addOption() {
    const nextOptions = [...options, `Option ${options.length + 1}`];
    updateOptions(nextOptions);
  }

  return (
    <div className="nested-editor">
      <div className="subtab-header-row">
        <strong>Options</strong>
        <button type="button" className="tab-button" onClick={addOption}>
          Add Option
        </button>
      </div>

      {options.map((option, index) => (
        <div key={`${row.uid}-option-${index}`} className="choice-row">
          <input
            data-field="choice-option"
            data-option-index={index + 1}
            type="text"
            value={option}
            onChange={(event) => onOptionTextChange(index, event)}
          />

          {isCheckbox ? (
            <label className="choice-toggle">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  const nextSelected = checked
                    ? [...new Set([...selected, option])]
                    : selected.filter((item) => item !== option);
                  updateOptions(options, nextSelected);
                }}
              />
              Correct
            </label>
          ) : (
            <label className="choice-toggle">
              <input
                type="radio"
                name={`mcq-${row.uid}`}
                checked={selected[0] === option}
                onChange={() => updateOptions(options, [option])}
              />
              Correct
            </label>
          )}

          <button type="button" className="tab-button" onClick={() => removeOption(index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
