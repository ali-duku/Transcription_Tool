type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

export interface RepairParseResult {
  ok: boolean;
  data?: unknown;
  error?: unknown;
  notes: string[];
}

export function convertPythonDictToJSON(text: string): string {
  let result = "";
  let i = 0;
  let inSingleQuoteString = false;
  let inDoubleQuoteString = false;
  let currentString = "";

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === "\\" && inSingleQuoteString) {
      if (nextChar === "'") {
        currentString += "'";
        i += 2;
        continue;
      }
      if (nextChar === "\\") {
        currentString += "\\";
        i += 2;
        continue;
      }
      if (nextChar === "n") {
        currentString += "\n";
        i += 2;
        continue;
      }
      if (nextChar === "t") {
        currentString += "\t";
        i += 2;
        continue;
      }
      if (nextChar === "r") {
        currentString += "\r";
        i += 2;
        continue;
      }
      currentString += char;
      i += 1;
      continue;
    }

    if (char === "\\" && inDoubleQuoteString) {
      if (nextChar === '"') {
        result += '\\"';
        i += 2;
        continue;
      }
      if (nextChar === "\\") {
        result += "\\\\";
        i += 2;
        continue;
      }
      result += char;
      i += 1;
      continue;
    }

    if (char === "'" && !inDoubleQuoteString) {
      if (!inSingleQuoteString) {
        inSingleQuoteString = true;
        result += '"';
      } else {
        inSingleQuoteString = false;
        let escapedString = "";
        for (let j = 0; j < currentString.length; j += 1) {
          const current = currentString[j];
          const previous = j > 0 ? currentString[j - 1] : "";
          if (current === "\\") {
            escapedString += "\\\\";
          } else if (current === '"' && previous !== "\\") {
            escapedString += '\\"';
          } else if (current === "\n") {
            escapedString += "\\n";
          } else if (current === "\t") {
            escapedString += "\\t";
          } else if (current === "\r") {
            escapedString += "\\r";
          } else {
            escapedString += current;
          }
        }
        result += `${escapedString}"`;
        currentString = "";
      }
      i += 1;
      continue;
    }

    if (char === '"' && !inSingleQuoteString) {
      inDoubleQuoteString = !inDoubleQuoteString;
      result += char;
      i += 1;
      continue;
    }

    if (inSingleQuoteString) {
      currentString += char;
    } else {
      result += char;
    }
    i += 1;
  }

  result = result.replace(/\bTrue\b/g, "true");
  result = result.replace(/\bFalse\b/g, "false");
  result = result.replace(/\bNone\b/g, "null");
  return result;
}

export function attemptRepairAndParseJSON(rawText: string): RepairParseResult {
  const notes: string[] = [];
  let text = (rawText || "").trim().replace(/^\uFEFF/, "");

  text = text.replace(/\r\n?/g, "\n");

  const t1 = text;
  text = text.replace(/,\s*([\]}])/g, "$1");
  if (text !== t1) {
    notes.push("removed trailing commas");
  }

  const t2 = text;
  text = text
    .replace(/\}\s*,\s*"(instructional_content)"/g, ', "$1"')
    .replace(/\}\s*,\s*"(practice_questions)"/g, ', "$1"')
    .replace(/\}\s*,\s*"(unit_preamble)"/g, ', "$1"')
    .replace(/\}\s*,\s*"(lesson_preamble)"/g, ', "$1"');
  if (text !== t2) {
    notes.push("merged split top-level object");
  }

  const opens = (text.match(/\{/g) || []).length;
  const closes = (text.match(/\}/g) || []).length;
  if (opens > closes) {
    text += "}".repeat(opens - closes);
    notes.push("added missing }");
  } else if (closes > opens) {
    let diff = closes - opens;
    while (diff > 0) {
      text = text.replace(/\}\s*$/, "");
      diff -= 1;
    }
    notes.push("removed extra } at end");
  }

  try {
    const data = JSON.parse(text);
    if (isPlainObject(data) && typeof data.text === "string") {
      if (!isPlainObject(data.lesson_preamble)) {
        data.lesson_preamble = {
          id: "",
          title: "",
          title_translation: null,
          lesson_standards: [],
          terminology: [],
          text: data.text
        };
      } else if (!data.lesson_preamble.text) {
        data.lesson_preamble.text = data.text;
      }
      delete data.text;
      notes.push('moved stray top-level "text" into lesson_preamble.text');
    }

    if (isPlainObject(data) && Array.isArray(data.guidebook_pdf_pages)) {
      if (data.guidebook_pdf_pages.length === 1) {
        data.guidebook_pdf_pages = [data.guidebook_pdf_pages[0], data.guidebook_pdf_pages[0]];
        notes.push("normalized guidebook_pdf_pages to [start, end]");
      } else if (data.guidebook_pdf_pages.length > 2) {
        data.guidebook_pdf_pages = [
          data.guidebook_pdf_pages[0],
          data.guidebook_pdf_pages[data.guidebook_pdf_pages.length - 1]
        ];
        notes.push("trimmed guidebook_pdf_pages to 2 items");
      }
    }

    return { ok: true, data, notes };
  } catch (error) {
    return { ok: false, error, notes };
  }
}

export interface ParseIncomingResult {
  ok: boolean;
  data?: unknown;
  source: "json" | "python_dict" | "repair";
  notes: string[];
}

export function parseIncomingJsonOrPythonDict(rawText: string): ParseIncomingResult {
  try {
    const data = JSON.parse(rawText);
    return { ok: true, data, source: "json", notes: [] };
  } catch {
    // Continue to Python dict conversion.
  }

  const convertedText = convertPythonDictToJSON(rawText);
  try {
    const data = JSON.parse(convertedText);
    return { ok: true, data, source: "python_dict", notes: [] };
  } catch {
    // Continue to repair.
  }

  const repaired = attemptRepairAndParseJSON(convertedText);
  if (!repaired.ok) {
    return { ok: false, source: "repair", notes: repaired.notes };
  }
  return {
    ok: true,
    data: repaired.data,
    source: "repair",
    notes: repaired.notes
  };
}
