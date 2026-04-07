import katex from "katex";

function normalizeExpression(value: string): string {
  return (value ?? "").trim();
}

export function renderLatexToHtml(value: string, displayMode: boolean): string | null {
  const expression = normalizeExpression(value);
  if (!expression) {
    return null;
  }

  try {
    return katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      strict: "warn",
      trust: false
    });
  } catch {
    return null;
  }
}
