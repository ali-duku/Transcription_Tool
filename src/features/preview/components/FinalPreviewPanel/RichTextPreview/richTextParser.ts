import { splitTableRowSafe } from "./tableSplit";

export type TableCellAlignment = "left" | "center" | "right";

export interface ImageReferenceToken {
  kind: "image_ref";
  description: string;
  index: number;
}

export interface TextToken {
  kind: "text" | "bold" | "italic" | "code" | "inline_math" | "link";
  value: string;
  href?: string;
}

export type InlineToken = TextToken | ImageReferenceToken;

export type RichTextBlock =
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "unordered_list"; items: Array<{ text: string; depth: number }> }
  | { kind: "ordered_list"; items: Array<{ text: string; depth: number }> }
  | { kind: "blockquote"; text: string }
  | { kind: "table"; headers: string[]; alignments: TableCellAlignment[]; rows: string[][] }
  | { kind: "math_block"; content: string };

const INLINE_TOKEN_PATTERN =
  /!\[([\s\S]*?)\]\(\s*(\d+)\s*\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\$([^$\n]+)\$|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function splitTableRow(line: string): string[] {
  return splitTableRowSafe(line);
}

function isTableDelimiter(line: string): boolean {
  const cells = splitTableRow(line);
  if (cells.length === 0) {
    return false;
  }
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s+/g, "")));
}

function parseAlignment(delimiterCell: string): TableCellAlignment {
  const compact = delimiterCell.replace(/\s+/g, "");
  if (compact.startsWith(":") && compact.endsWith(":")) {
    return "center";
  }
  if (compact.endsWith(":")) {
    return "right";
  }
  return "left";
}

function startsUnorderedList(line: string): boolean {
  return /^\s*[-*]\s+/.test(line);
}

function startsOrderedList(line: string): boolean {
  return /^\s*\d+\.\s+/.test(line);
}

function startsBlockquote(line: string): boolean {
  return /^\s*>\s?/.test(line);
}

function parseHeading(line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null {
  const match = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
  if (!match) {
    return null;
  }
  const level = match[1].length as 1 | 2 | 3 | 4 | 5 | 6;
  return { level, text: match[2].trim() };
}

function parseUnorderedItem(line: string): { text: string; depth: number } | null {
  const match = line.match(/^(\s*)[-*]\s+(.+)$/);
  if (!match) {
    return null;
  }
  const spaces = match[1].replace(/\t/g, "  ").length;
  return { text: match[2], depth: Math.floor(spaces / 2) };
}

function parseOrderedItem(line: string): { text: string; depth: number } | null {
  const match = line.match(/^(\s*)\d+\.\s+(.+)$/);
  if (!match) {
    return null;
  }
  const spaces = match[1].replace(/\t/g, "    ").length;
  return { text: match[2], depth: Math.floor(spaces / 4) };
}

function mathBlockMarker(index: number): string {
  return `@@RICH_TEXT_MATH_BLOCK_${index}@@`;
}

function extractMathBlocks(input: string): { text: string; blocks: string[] } {
  const blocks: string[] = [];
  let normalized = input;

  normalized = normalized.replace(/\$\$\s*\\n([\s\S]*?)\\n\s*\$\$/g, (_match, inner: string) => {
    const marker = mathBlockMarker(blocks.length);
    blocks.push(inner.replace(/\\n/g, "\n").trim());
    return `\n${marker}\n`;
  });

  normalized = normalized.replace(/\$\$\s*\n([\s\S]*?)\n\s*\$\$/g, (_match, inner: string) => {
    const marker = mathBlockMarker(blocks.length);
    blocks.push(inner.trim());
    return `\n${marker}\n`;
  });

  return { text: normalized, blocks };
}

function isBlockStart(current: string, next: string): boolean {
  if (startsUnorderedList(current) || startsOrderedList(current) || startsBlockquote(current)) {
    return true;
  }
  if (parseHeading(current) !== null) {
    return true;
  }
  if (splitTableRow(current).length > 0 && isTableDelimiter(next)) {
    return true;
  }
  return /^@@RICH_TEXT_MATH_BLOCK_(\d+)@@$/.test(current.trim());
}

export function tokenizeInlineText(value: string): InlineToken[] {
  const text = value ?? "";
  if (!text) {
    return [{ kind: "text", value: "" }];
  }

  const tokens: InlineToken[] = [];
  INLINE_TOKEN_PATTERN.lastIndex = 0;
  let cursor = 0;

  while (true) {
    const match = INLINE_TOKEN_PATTERN.exec(text);
    if (!match) {
      break;
    }

    const [raw] = match;
    if (match.index > cursor) {
      tokens.push({ kind: "text", value: text.slice(cursor, match.index) });
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      tokens.push({
        kind: "image_ref",
        description: match[1].trim(),
        index: Number.parseInt(match[2], 10)
      });
    } else if (match[3] !== undefined) {
      tokens.push({ kind: "code", value: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ kind: "bold", value: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ kind: "italic", value: match[5] });
    } else if (match[6] !== undefined) {
      tokens.push({ kind: "inline_math", value: match[6] });
    } else if (match[7] !== undefined && match[8] !== undefined) {
      tokens.push({ kind: "link", value: match[7], href: match[8] });
    } else {
      tokens.push({ kind: "text", value: raw });
    }

    cursor = match.index + raw.length;
  }

  if (cursor < text.length) {
    tokens.push({ kind: "text", value: text.slice(cursor) });
  }

  return tokens.length > 0 ? tokens : [{ kind: "text", value: text }];
}

export function parseRichTextBlocks(value: string): RichTextBlock[] {
  const normalized = normalizeLineEndings(value ?? "").trim();
  if (!normalized) {
    return [];
  }

  const { text, blocks: mathBlocks } = extractMathBlocks(normalized);
  const lines = text.split("\n");
  const result: RichTextBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    const next = index + 1 < lines.length ? lines[index + 1] : "";

    if (!trimmed) {
      index += 1;
      continue;
    }

    const mathMatch = trimmed.match(/^@@RICH_TEXT_MATH_BLOCK_(\d+)@@$/);
    if (mathMatch) {
      const mathIndex = Number.parseInt(mathMatch[1], 10);
      const content = mathBlocks[mathIndex] ?? "";
      result.push({ kind: "math_block", content });
      index += 1;
      continue;
    }

    const heading = parseHeading(line);
    if (heading) {
      result.push({ kind: "heading", level: heading.level, text: heading.text });
      index += 1;
      continue;
    }

    if (splitTableRow(line).length > 0 && isTableDelimiter(next)) {
      const headers = splitTableRow(line);
      const alignCells = splitTableRow(next);
      const alignments = headers.map((_, colIndex) =>
        parseAlignment(alignCells[colIndex] ?? "---")
      );
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && splitTableRow(lines[index]).length > 0) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      result.push({ kind: "table", headers, alignments, rows });
      continue;
    }

    if (startsBlockquote(line)) {
      const quoteLines: string[] = [];
      while (index < lines.length && startsBlockquote(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      result.push({ kind: "blockquote", text: quoteLines.join("\n").trim() });
      continue;
    }

    if (startsUnorderedList(line)) {
      const items: Array<{ text: string; depth: number }> = [];
      while (index < lines.length && startsUnorderedList(lines[index])) {
        const parsed = parseUnorderedItem(lines[index]);
        if (parsed) {
          items.push(parsed);
        }
        index += 1;
      }
      result.push({ kind: "unordered_list", items });
      continue;
    }

    if (startsOrderedList(line)) {
      const items: Array<{ text: string; depth: number }> = [];
      while (index < lines.length && startsOrderedList(lines[index])) {
        const parsed = parseOrderedItem(lines[index]);
        if (parsed) {
          items.push(parsed);
        }
        index += 1;
      }
      result.push({ kind: "ordered_list", items });
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const candidate = lines[index];
      const candidateNext = index + 1 < lines.length ? lines[index + 1] : "";
      if (!candidate.trim() || isBlockStart(candidate, candidateNext)) {
        break;
      }
      paragraphLines.push(candidate);
      index += 1;
    }
    result.push({ kind: "paragraph", text: paragraphLines.join("\n").trim() });
  }

  return result;
}
