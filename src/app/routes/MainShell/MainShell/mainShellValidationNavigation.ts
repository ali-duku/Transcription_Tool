import type { InputScrollTarget } from "../../../../shared/types/navigation";
import { resolveInputTargetFromValidationMessage } from "../../../../features/validation/utils/validationMessageNavigation";

function focusAndHighlightField(field: HTMLElement) {
  field.scrollIntoView({ behavior: "smooth", block: "center" });
  field.focus();
  field.classList.add("validation-focus-target");
  window.setTimeout(() => {
    field.classList.remove("validation-focus-target");
  }, 1600);
}

function queryHTMLElement(root: ParentNode, selector: string): HTMLElement | null {
  const element = root.querySelector(selector);
  return element instanceof HTMLElement ? element : null;
}

function resolveScopedCard(target: InputScrollTarget): HTMLElement | null {
  if (typeof target.questionIndex === "number" && target.questionIndex > 0) {
    return queryHTMLElement(document, `[data-question-index="${target.questionIndex}"]`);
  }
  if (typeof target.contentIndex === "number" && target.contentIndex > 0) {
    return queryHTMLElement(document, `[data-content-index="${target.contentIndex}"]`);
  }
  return null;
}

export function scrollToInputTarget(target: InputScrollTarget): void {
  window.requestAnimationFrame(() => {
    const scopedCard = resolveScopedCard(target);
    if (scopedCard) {
      scopedCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (!target.fieldSelector) {
      if (scopedCard) {
        scopedCard.classList.add("validation-focus-target");
        window.setTimeout(() => {
          scopedCard.classList.remove("validation-focus-target");
        }, 1600);
      }
      return;
    }

    window.setTimeout(
      () => {
        const scopedField =
          scopedCard !== null ? queryHTMLElement(scopedCard, target.fieldSelector ?? "") : null;
        const globalField = queryHTMLElement(document, target.fieldSelector ?? "");
        const field = scopedField ?? globalField;
        if (!field) {
          return;
        }
        focusAndHighlightField(field);
      },
      scopedCard ? 160 : 0
    );
  });
}

export function scrollToValidationTarget(message: string): void {
  const target = resolveInputTargetFromValidationMessage(message);
  if (!target) {
    return;
  }
  scrollToInputTarget(target);
}
