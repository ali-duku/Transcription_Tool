import { Fragment } from "react";
import {
  parseRichTextBlocks,
  tokenizeInlineText,
  type InlineToken,
  type TableCellAlignment
} from "./richTextParser";
import { renderLatexToHtml } from "./latexRenderer";
import { useTrailingSpacesIndicator } from "../../../hooks/useTrailingSpacesIndicator";
import "katex/dist/katex.min.css";
import "./RichTextPreview.css";

interface BboxLike {
  page?: unknown;
  position?: unknown;
}

interface RichTextPreviewProps {
  text: string | null | undefined;
  images?: unknown[] | null;
  emptyPlaceholder?: string;
}

function alignmentClassName(alignment: TableCellAlignment): string {
  if (alignment === "center") return "rich-text-align-center";
  if (alignment === "right") return "rich-text-align-right";
  return "rich-text-align-left";
}

function formatImageRefDetails(index: number, images: unknown[] | null | undefined): string {
  if (!Array.isArray(images) || images.length === 0) {
    return "(no image rows)";
  }

  const row = images[index];
  if (!row || typeof row !== "object") {
    return "(missing row)";
  }

  const bbox = row as BboxLike;
  const page = String(bbox.page ?? "?");
  if (!Array.isArray(bbox.position) || bbox.position.length !== 2) {
    return `page ${page}, invalid bbox`;
  }
  return `page ${page}`;
}

function renderInlineToken(
  token: InlineToken,
  tokenIndex: number,
  images: unknown[] | null | undefined,
  keyPrefix: string
) {
  const key = `${keyPrefix}-${tokenIndex}`;

  if (token.kind === "text") {
    return <Fragment key={key}>{token.value}</Fragment>;
  }
  if (token.kind === "bold") {
    return <strong key={key}>{token.value}</strong>;
  }
  if (token.kind === "italic") {
    return <em key={key}>{token.value}</em>;
  }
  if (token.kind === "code") {
    return <code key={key}>{token.value}</code>;
  }
  if (token.kind === "inline_math") {
    const html = renderLatexToHtml(token.value, false);
    if (html) {
      return (
        <span
          key={key}
          className="rich-text-inline-math"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
    return (
      <span key={key} className="rich-text-inline-math">
        {token.value}
      </span>
    );
  }
  if (token.kind === "link") {
    return (
      <a key={key} href={token.href} rel="noreferrer" target="_blank">
        {token.value}
      </a>
    );
  }
  if (token.kind !== "image_ref") {
    return <Fragment key={key}>{token.value}</Fragment>;
  }

  const details = formatImageRefDetails(token.index, images);
  const label = token.description || "image";
  return (
    <span key={key} className="rich-text-image-ref" title={`Image ${token.index}: ${details}`}>
      [Image {token.index}: {label}]
    </span>
  );
}

function renderInlineText(text: string, images: unknown[] | null | undefined, keyPrefix: string) {
  return tokenizeInlineText(text).map((token, index) =>
    renderInlineToken(token, index, images, keyPrefix)
  );
}

function renderTextWithLineBreaks(
  text: string,
  images: unknown[] | null | undefined,
  keyPrefix: string,
  showTrailingSpaces: boolean
) {
  const markTrailingSpaces = (line: string) =>
    showTrailingSpaces
      ? line.replace(/[ \t]+$/g, (trailing) => trailing.replace(/ /g, "·").replace(/\t/g, "→"))
      : line;

  return text.split("\n").map((line, lineIndex, lines) => (
    <Fragment key={`${keyPrefix}-line-${lineIndex}`}>
      {renderInlineText(markTrailingSpaces(line), images, `${keyPrefix}-line-${lineIndex}`)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

export function RichTextPreview({ text, images = null, emptyPlaceholder = "(empty)" }: RichTextPreviewProps) {
  const showTrailingSpaces = useTrailingSpacesIndicator();
  const source = text ?? "";
  const blocks = parseRichTextBlocks(source);

  if (blocks.length === 0) {
    return <p className="rich-text-empty">{emptyPlaceholder}</p>;
  }

  return (
    <div className="rich-text-preview">
      {blocks.map((block, blockIndex) => {
        const key = `block-${blockIndex}`;
        if (block.kind === "heading") {
          const HeadingTag = `h${block.level}` as const;
          return (
            <HeadingTag key={key} className={`rich-text-heading rich-text-heading-${block.level}`}>
              {renderInlineText(block.text, images, `${key}-heading`)}
            </HeadingTag>
          );
        }
        if (block.kind === "paragraph") {
          return (
            <p key={key}>
              {renderTextWithLineBreaks(block.text, images, `${key}-paragraph`, showTrailingSpaces)}
            </p>
          );
        }
        if (block.kind === "unordered_list") {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-item-${itemIndex}`}
                  style={{ marginInlineStart: `${item.depth * 16}px` }}
                >
                  {renderInlineText(item.text, images, `${key}-item-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ordered_list") {
          return (
            <ol key={key}>
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-item-${itemIndex}`}
                  style={{ marginInlineStart: `${item.depth * 16}px` }}
                >
                  {renderInlineText(item.text, images, `${key}-item-${itemIndex}`)}
                </li>
              ))}
            </ol>
          );
        }
        if (block.kind === "blockquote") {
          return (
            <blockquote key={key}>
              {renderTextWithLineBreaks(block.text, images, `${key}-quote`, showTrailingSpaces)}
            </blockquote>
          );
        }
        if (block.kind === "math_block") {
          const html = renderLatexToHtml(block.content, true);
          if (html) {
            return (
              <div
                key={key}
                className="rich-text-math-block"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          }
          return (
            <pre key={key} className="rich-text-math-block">
              {block.content}
            </pre>
          );
        }

        return (
          <table key={key} className="rich-text-table">
            <thead>
              <tr>
                {block.headers.map((header, colIndex) => (
                  <th key={`${key}-head-${colIndex}`} className={alignmentClassName(block.alignments[colIndex] ?? "left")}>
                    {renderInlineText(header, images, `${key}-head-${colIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {block.headers.map((_, colIndex) => (
                    <td key={`${key}-cell-${rowIndex}-${colIndex}`} className={alignmentClassName(block.alignments[colIndex] ?? "left")}>
                      {renderInlineText(row[colIndex] ?? "", images, `${key}-cell-${rowIndex}-${colIndex}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </div>
  );
}
