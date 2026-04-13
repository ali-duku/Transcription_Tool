function fitTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.max(textarea.scrollHeight, 80)}px`;
  textarea.style.overflowY = "hidden";
}

function resetTextareaHeight(textarea: HTMLTextAreaElement) {
  textarea.style.removeProperty("height");
  textarea.style.removeProperty("overflow-y");
}

export function applyTextareaAutoResize(enabled: boolean) {
  const textareas = Array.from(document.querySelectorAll("textarea"));
  textareas.forEach((node) => {
    if (!(node instanceof HTMLTextAreaElement)) {
      return;
    }
    if (enabled) {
      fitTextarea(node);
    } else {
      resetTextareaHeight(node);
    }
  });
}

export function attachTextareaAutoResizeListener(enabled: boolean) {
  if (!enabled) {
    return () => {};
  }
  const onInput = (event: Event) => {
    if (!(event.target instanceof HTMLTextAreaElement)) {
      return;
    }
    fitTextarea(event.target);
  };
  document.addEventListener("input", onInput, true);
  return () => {
    document.removeEventListener("input", onInput, true);
  };
}
