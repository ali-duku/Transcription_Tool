import {
  countUnescaped,
  findLatexSegments,
  normalizeLineEndings,
  removeMathExpressions,
  type SimpleValidationSummary
} from "./textValidationShared";

function validateForbiddenHtmlTags(text: string, locationLabel: string, errors: string[]) {
  const htmlListMatches = text.match(/<\s*\/?\s*(ul|li)\b[^>]*>/gi) ?? [];
  if (htmlListMatches.length > 0) {
    errors.push(
      `${locationLabel}: HTML list tags (<ul>, <li>) are not allowed. Use markdown bullets instead.`
    );
  }
  const brMatches = text.match(/<br\s*\/?>/gi) ?? [];
  if (brMatches.length > 0) {
    errors.push(`${locationLabel}: <br> tags are not allowed.`);
  }
}

function validateForbiddenLatexCommands(text: string, locationLabel: string, errors: string[]) {
  const forbidden = [
    {
      pattern: /\\neq\b/g,
      message: `${locationLabel}: Forbidden LaTeX command \\neq detected. Use "!=" instead.`
    },
    {
      pattern: /\\nearrow\b/g,
      message: `${locationLabel}: Forbidden LaTeX command \\nearrow detected. Use a supported arrow command.`
    }
  ];
  forbidden.forEach((rule) => {
    if (rule.pattern.test(text)) {
      errors.push(rule.message);
    }
  });
}

function validateQuotesAndDollars(text: string, locationLabel: string, errors: string[], warnings: string[]) {
  const quoteCount = countUnescaped(text, "\"");
  if (quoteCount > 0 && quoteCount % 2 !== 0) {
    warnings.push(`${locationLabel}: Unmatched double quote detected (${quoteCount} total).`);
  }

  const dollarCount = countUnescaped(text, "$");
  if (dollarCount > 0 && dollarCount % 2 !== 0) {
    errors.push(`${locationLabel}: Unmatched dollar sign detected (${dollarCount} total).`);
  }
}

function validateBlankInLatex(text: string, locationLabel: string, errors: string[]) {
  const blankPattern = /___\d+___/;
  const hasBlankInLatex = findLatexSegments(text).some((segment) => blankPattern.test(segment));
  if (hasBlankInLatex) {
    errors.push(`${locationLabel}: Blank markers (___n___) cannot appear inside LaTeX expressions.`);
  }
}

function validateLatexBlockFormat(text: string, locationLabel: string, errors: string[]) {
  if (!text.includes("$$")) {
    return;
  }
  const legacyInlineBlocks = text.match(/\$\$([\s\S]*?)\$\$/g) ?? [];
  legacyInlineBlocks.forEach((block) => {
    const validEscapedNewline = /^\$\$\s*\\n[\s\S]*?\\n\s*\$\$$/.test(block);
    const validRealNewline = /^\$\$\s*\n[\s\S]*?\n\s*\$\$$/.test(block);
    if (!validEscapedNewline && !validRealNewline) {
      const inner = block.replace(/^\$\$/, "").replace(/\$\$$/, "").trim();
      if (inner.length > 0) {
        errors.push(
          `${locationLabel}: Block LaTeX must use $$\\n...\\n$$ (or real newlines) delimiters.`
        );
      }
    }
  });

  const validBlocks = [
    ...(text.match(/\$\$\s*\\n([\s\S]*?)\\n\s*\$\$/g) ?? []),
    ...(text.match(/\$\$\s*\n([\s\S]*?)\n\s*\$\$/g) ?? [])
  ];
  validBlocks.forEach((block) => {
    const inner = block
      .replace(/^\$\$\s*(\\n|\n)/, "")
      .replace(/(\\n|\n)\s*\$\$$/, "")
      .trim();
    if (inner.length === 0) {
      errors.push(`${locationLabel}: Block LaTeX cannot be empty.`);
      return;
    }
    const normalizedInner = inner.replace(/\\n/g, "\n");
    if (normalizedInner.includes("\n")) {
      errors.push(`${locationLabel}: Block LaTeX cannot contain extra newlines inside content.`);
    }
  });
}

function validateImageDescriptionRules(text: string, locationLabel: string, errors: string[]) {
  const normalized = normalizeLineEndings(text);
  const imageRegex = /!\[([\s\S]*?)\]\(\s*\d+\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = imageRegex.exec(normalized)) !== null) {
    const description = match[1] ?? "";
    if (description.includes("\n")) {
      errors.push(`${locationLabel}: Image descriptions cannot contain newlines.`);
    }
    if (description.includes("$$")) {
      errors.push(`${locationLabel}: Block LaTeX is not allowed in image descriptions.`);
    }
    const withoutMath = removeMathExpressions(description);
    if (withoutMath.includes("\\n") || withoutMath.includes("\\r")) {
      errors.push(`${locationLabel}: Image descriptions cannot contain escaped newline sequences.`);
    }
  }
}

export function validateSyntaxAndLatex(content: string, locationLabel: string): SimpleValidationSummary {
  const errors: string[] = [];
  const warnings: string[] = [];
  const text = content ?? "";

  validateForbiddenHtmlTags(text, locationLabel, errors);
  validateForbiddenLatexCommands(text, locationLabel, errors);
  validateQuotesAndDollars(text, locationLabel, errors, warnings);
  validateBlankInLatex(text, locationLabel, errors);
  validateLatexBlockFormat(text, locationLabel, errors);
  validateImageDescriptionRules(text, locationLabel, errors);

  return { errors, warnings };
}
