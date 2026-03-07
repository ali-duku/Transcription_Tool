"""Validate lesson_preamble consistency against Page_Type in a CSV file.

This script reads a CSV file with `Page_Type` and `json_content` columns,
validates the `lesson_preamble` field inside `json_content`, and writes a new
CSV containing two additional columns:

- `Error`: `TRUE` when validation fails, otherwise `FALSE`
- `Reason`: explanation for validation failures, empty when no error

Usage:
    python validate_lesson_preamble_csv.py
    python validate_lesson_preamble_csv.py --input input.csv --output output.csv
    python validate_lesson_preamble_csv.py --encoding utf-8-sig
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping, Protocol, Sequence


DEFAULT_INPUT_CSV = "History & Geography check - Social.csv"
DEFAULT_OUTPUT_CSV = "History & Geography check - Social_with_errors.csv"
DEFAULT_ENCODING = "utf-8-sig"

COLUMN_PAGE_TYPE = "Page_Type"
COLUMN_JSON_CONTENT = "json_content"
COLUMN_ERROR = "Error"
COLUMN_REASON = "Reason"
LESSON_PREAMBLE_FIELD = "lesson_preamble"
LESSON_PREAMBLE_PAGE_TYPE = "lesson_preamble"


@dataclass(frozen=True)
class RowContext:
    """Context metadata used by validation rules for a single CSV row."""

    row_number: int
    page_type_raw: str
    page_type_normalized: str


@dataclass(frozen=True)
class ValidationResult:
    """Represents the validation outcome for a CSV row."""

    is_error: bool
    reason: str


class ValidationRule(Protocol):
    """Interface for adding composable row validation rules."""

    def validate(
        self, context: RowContext, payload: Mapping[str, Any]
    ) -> ValidationResult | None:
        """Return a ValidationResult when this rule fails, else None."""


class LessonPreambleFieldExistsRule:
    """Ensures json_content includes the lesson_preamble key."""

    def validate(
        self, context: RowContext, payload: Mapping[str, Any]
    ) -> ValidationResult | None:
        if LESSON_PREAMBLE_FIELD not in payload:
            return ValidationResult(
                is_error=True,
                reason="Missing lesson_preamble field in json_content",
            )
        return None


class LessonPreambleConsistencyRule:
    """Checks bidirectional consistency between Page_Type and lesson_preamble."""

    def validate(
        self, context: RowContext, payload: Mapping[str, Any]
    ) -> ValidationResult | None:
        lesson_preamble_value = payload.get(LESSON_PREAMBLE_FIELD)
        expects_non_null = context.page_type_normalized == LESSON_PREAMBLE_PAGE_TYPE

        if expects_non_null and lesson_preamble_value is None:
            return ValidationResult(
                is_error=True,
                reason=format_mismatch_reason(context.page_type_raw, expects_non_null=True),
            )

        if not expects_non_null and lesson_preamble_value is not None:
            return ValidationResult(
                is_error=True,
                reason=format_mismatch_reason(context.page_type_raw, expects_non_null=False),
            )

        return None


def normalize_page_type(value: str) -> str:
    """Normalize Page_Type for case-insensitive and whitespace-safe matching."""

    return value.strip().casefold()


def format_mismatch_reason(page_type_raw: str, expects_non_null: bool) -> str:
    """Build a consistent, human-readable reason for Page_Type mismatch errors."""

    display_page_type = page_type_raw if page_type_raw else "<empty>"
    if expects_non_null:
        return f"Page_Type '{display_page_type}' requires lesson_preamble to be non-null."
    return f"Page_Type '{display_page_type}' requires lesson_preamble to be null."


def parse_json_content(raw_json_content: str) -> tuple[dict[str, Any] | None, ValidationResult | None]:
    """Parse json_content as a JSON object and return parse errors as ValidationResult."""

    try:
        parsed = json.loads(raw_json_content)
    except json.JSONDecodeError:
        return None, ValidationResult(
            is_error=True,
            reason="Invalid JSON in json_content",
        )

    if not isinstance(parsed, dict):
        return None, ValidationResult(
            is_error=True,
            reason="json_content must be a JSON object",
        )

    return parsed, None


def build_row_context(row_number: int, row: Mapping[str, str]) -> RowContext:
    """Create a RowContext from raw CSV row data."""

    page_type_raw = row.get(COLUMN_PAGE_TYPE, "") or ""
    return RowContext(
        row_number=row_number,
        page_type_raw=page_type_raw,
        page_type_normalized=normalize_page_type(page_type_raw),
    )


def run_rule_pipeline(
    context: RowContext,
    payload: Mapping[str, Any],
    rules: Sequence[ValidationRule],
) -> ValidationResult:
    """Run rules in order and return first error; otherwise return a passing result."""

    for rule in rules:
        rule_result = rule.validate(context, payload)
        if rule_result is not None and rule_result.is_error:
            return rule_result
    return ValidationResult(is_error=False, reason="")


def validate_row(
    row_number: int,
    row: Mapping[str, str],
    rules: Sequence[ValidationRule],
) -> ValidationResult:
    """Validate one CSV row against JSON shape and lesson_preamble/Page_Type rules."""

    context = build_row_context(row_number=row_number, row=row)
    raw_json_content = row.get(COLUMN_JSON_CONTENT, "") or ""
    parsed_payload, parse_error = parse_json_content(raw_json_content)
    if parse_error is not None:
        return parse_error

    # parsed_payload is guaranteed to be a dict when parse_error is None.
    return run_rule_pipeline(context, parsed_payload, rules)


def build_output_fieldnames(input_fieldnames: Sequence[str]) -> list[str]:
    """Return output columns preserving original order and appending missing output columns."""

    output_fieldnames = list(input_fieldnames)
    if COLUMN_ERROR not in output_fieldnames:
        output_fieldnames.append(COLUMN_ERROR)
    if COLUMN_REASON not in output_fieldnames:
        output_fieldnames.append(COLUMN_REASON)
    return output_fieldnames


def validate_required_columns(fieldnames: Sequence[str]) -> None:
    """Raise ValueError when required input columns are missing."""

    required_columns = (COLUMN_PAGE_TYPE, COLUMN_JSON_CONTENT)
    missing_columns = [column for column in required_columns if column not in fieldnames]
    if missing_columns:
        missing_text = ", ".join(missing_columns)
        raise ValueError(f"Missing required column(s): {missing_text}")


def process_csv(
    input_path: Path,
    output_path: Path,
    encoding: str = DEFAULT_ENCODING,
) -> tuple[int, int]:
    """Read input CSV, add validation results, and write output CSV.

    Returns:
        tuple[int, int]: (processed_row_count, error_row_count)
    """

    rules: tuple[ValidationRule, ...] = (
        LessonPreambleFieldExistsRule(),
        LessonPreambleConsistencyRule(),
    )

    processed_rows = 0
    error_rows = 0

    with input_path.open("r", encoding=encoding, newline="") as input_file:
        reader = csv.DictReader(input_file)
        input_fieldnames = reader.fieldnames
        if input_fieldnames is None:
            raise ValueError("Input CSV is missing a header row.")

        validate_required_columns(input_fieldnames)
        output_fieldnames = build_output_fieldnames(input_fieldnames)

        with output_path.open("w", encoding=encoding, newline="") as output_file:
            writer = csv.DictWriter(output_file, fieldnames=output_fieldnames)
            writer.writeheader()

            for row_index, row in enumerate(reader, start=2):
                result = validate_row(row_number=row_index, row=row, rules=rules)

                output_row = dict(row)
                output_row[COLUMN_ERROR] = "TRUE" if result.is_error else "FALSE"
                output_row[COLUMN_REASON] = result.reason if result.is_error else ""
                writer.writerow(output_row)

                processed_rows += 1
                if result.is_error:
                    error_rows += 1

    return processed_rows, error_rows


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments for input/output CSV processing."""

    parser = argparse.ArgumentParser(
        description="Validate lesson_preamble in json_content against Page_Type values."
    )
    parser.add_argument(
        "--input",
        default=DEFAULT_INPUT_CSV,
        help=f"Path to input CSV file (default: {DEFAULT_INPUT_CSV})",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT_CSV,
        help=f"Path to output CSV file (default: {DEFAULT_OUTPUT_CSV})",
    )
    parser.add_argument(
        "--encoding",
        default=DEFAULT_ENCODING,
        help=f"CSV file encoding (default: {DEFAULT_ENCODING})",
    )
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    """CLI entry point."""

    args = parse_args(argv)
    input_path = Path(args.input)
    output_path = Path(args.output)

    processed_rows, error_rows = process_csv(
        input_path=input_path,
        output_path=output_path,
        encoding=args.encoding,
    )
    print(
        f"Processed {processed_rows} rows. Found {error_rows} error(s). "
        f"Output written to '{output_path}'."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
