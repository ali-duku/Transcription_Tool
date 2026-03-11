# Master -> new_schema Change Summary

This document summarizes everything that changed:

- **Schema:** `transcription_schema.json` -> `schema.json`
- **Tool UI/logic:** `master:index.html` -> `new_schema:index.html`

The goal is to share one clear, non-technical update with the team.

## 1) Schema changes (`transcription_schema.json` -> `schema.json`)

### A. Top-level model updates

- Added new top-level sections:
  - `book_title_page`
  - `unit_preamble`
- Existing required top-level fields remain the same:
  - `textbook_page`, `textbook_pdf_page`, `page_type`
- `page_type` now includes a new value:
  - `title_page`

### B. New/updated preamble objects

- **Lesson preamble** now includes:
  - `id` (new, required)
  - `title_translation` (new, optional/nullable)
- **New object:** `UnitPreamble` with:
  - `id`, `title`, `title_translation`, `text`
  - required: `id`, `title`
- **New object:** `BookTitlePage` with:
  - `title`, `subtitle`, `version`, `grade`, `semester`, `lang`, `subject`
  - all required inside this object

### C. Question schema redesign (major)

- Old per-type question schemas were replaced by one unified `PracticeQuestion`.
- Removed old per-type defs:
  - `PracticeQuestionFreeForm`, `PracticeQuestionMultipleChoice`, `PracticeQuestionCheckbox`, `PracticeQuestionFillInTheBlanks`, `PracticeQuestionAnnotate`, `PracticeQuestionMatching`, `PracticeQuestionCreateTable`
- Added:
  - `PracticeQuestion`
  - `QuestionType` enum
  - `QuestionDifficultyLevel` enum

### D. Question field contract changes

- Canonical text keys are now:
  - `question` (instead of `question_text`)
  - `setup_text` (instead of `set_up_text`)
- `related_question` was removed from schema usage.
- `guide_answer` is now an array-based field across question types (type-specific meaning).
- `options` is now the canonical options container:
  - MCQ/Checkbox: option texts
  - Matching: left items + `"---"` separator + right items
  - Other types: `null`
- `difficulty` is now part of question schema as nullable.
- `guide_pdf_page` and `guide_answer_images` remain supported as optional fields.

### E. Legacy shape removed from schema surface

- Legacy option object (`MultipleChoiceOption` with `id` + `text`) is gone.
- Choice IDs are no longer part of the canonical question schema contract.

## 2) Tool changes (`master:index.html` -> current `index.html` on `new_schema`)

### A. Version and release notes

- Tool version updated from `7.9.3` to `8.0`.
- 8.0 "What's New" now documents the schema migration changes and workflow updates.

### B. New tabs and form structure

- Added **Book Metadata** subtab.
- Added **Unit Preamble** subtab.
- Subtab flow is now:
  - `Book Metadata` -> `Unit Preamble` -> `Lesson Preamble` -> `Basic Info` -> `Content` -> `Questions`
- These sections are integrated in:
  - Input form
  - Quick Jump
  - Final Preview
  - JSON build/load/save flows

### C. Title page workflow

- Added `Title Page` in Page Type options.
- Book Metadata fields are conditionally enforced for `title_page`.
- Book Metadata appears in output and final preview in canonical order.

### D. New title translation support

- Added **Lesson Title Translation** field.
- Added **Unit Title Translation** field.
- Translation fields are wired to load/save/generate/preview.
- Translation fields default to LTR input behavior.

### E. Question engine refactor and migration plumbing

- Introduced centralized adapter:
  - `QuestionSchemaAdapter`
- Unified question normalization/export/load through this adapter.
- Backward-compatible loading supports old question keys and old question shapes.
- New keys are preferred when old+new are both present.
- Deprecated keys are normalized/ignored centrally (not scattered across code).

### F. Question behavior updates aligned to new schema

- `related_question` removed from active question flow.
- Choice IDs removed from active MCQ/Checkbox flow:
  - no longer used in UI logic/export
  - ignored if present in old loaded payloads
- For these types, manual Guide Answer / Answer Images UI is removed and answers are derived:
  - `multiple_choice`
  - `checkbox`
  - `fill_in_the_blanks`
  - `matching`
- For those derived-answer types:
  - `guide_answer` is built automatically from existing inputs
  - `guide_answer_images` is exported as `null`
- Manual Guide Answer/Answer Images remains for manual-answer types:
  - `free_form`, `annotate`, `create_table`
- `guide_pdf_page` support is present and validated in current flow.
- Question export order is now canonical:
  - `id`, `difficulty`, `question_type`, `guide_pdf_page`, `setup_text`, `question`, `options`, `question_images`, `guide_answer`, `guide_answer_images`
- `difficulty` is emitted as `null` (UI-hidden).

### G. Preview, navigation, and editing stability improvements

- Final Preview and Quick Jump navigation behavior was hardened to avoid bad first-load scroll targeting.
- Auto-size on/off navigation jitter was addressed in tab-switch + scroll timing logic.
- Reset/undo/final-preview stale-card issues were fixed for Book Metadata and Basic Info areas.
- Preview-with-answers rendering issues were fixed (height behavior and placeholder fill consistency).

### H. Matching usability improvement

- Matching relationship dropdown now shows item index + text snippet (or full text when short) to make selection clearer.

### I. Table insertion behavior update

- Insert Table now adds only table markdown (no image-description line before it).
- Placeholder format changed to underscore style:
  - `Header_1`, `Header_2`, ...
  - `Row_1_Cell_1`, `Row_1_Cell_2`, ...
- Inserted tables are center-aligned by default.

### J. Clear-scope utility

- Added new button near Clear Form:
  - **Clear All {Current Subtab} Fields**
- Works only in Input Form subtabs.
- Disabled in Final Preview with a note.

### K. Theme mode policy update

- Light mode was removed completely.
- Tool is now dark-mode only.
- Theme toggle runtime/UI and related storage logic were removed.

## 3) Backward compatibility behavior (important)

- Old JSON files still load.
- Old question key names are normalized on load:
  - `question_text` -> `question`
  - `set_up_text` -> `setup_text`
- For migrated question types, old structural fields are mapped forward to new output shape.
- Deprecated/removed fields are ignored and not re-emitted in canonical output.

## 4) Practical team takeaway

This migration was not cosmetic: it moved the tool to the new unified schema contract while preserving old-file load compatibility.  
Main outcomes:

- New page-level structures (`book_title_page`, `unit_preamble`)
- Unified question model and canonical output order
- Cleaner question authoring for derived-answer types
- Better navigation/preview reliability
- Dark-only UI policy

