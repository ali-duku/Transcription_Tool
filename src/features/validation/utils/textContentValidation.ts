import { validateBlockquoteMarkdownStructure } from "./textValidation/blockquoteMarkdownValidation";
import { validateListMarkdownStructure } from "./textValidation/listMarkdownValidation";
import { validateSyntaxAndLatex } from "./textValidation/syntaxAndLatexValidation";
import { validateTableMarkdownStructure } from "./textValidation/tableMarkdownValidation";

export interface TextContentValidationSummary {
  errors: string[];
  warnings: string[];
}

export function validateTextContent(content: string, locationLabel: string): TextContentValidationSummary {
  const text = content ?? "";
  if (text.trim().length === 0) {
    return { errors: [], warnings: [] };
  }

  const syntax = validateSyntaxAndLatex(text, locationLabel);
  const errors = [
    ...syntax.errors,
    ...validateTableMarkdownStructure(text, locationLabel),
    ...validateListMarkdownStructure(text, locationLabel),
    ...validateBlockquoteMarkdownStructure(text, locationLabel)
  ];
  const warnings = [...syntax.warnings];
  return { errors, warnings };
}
