# Schema Diff Report for index.html

Generated: 2026-03-08

Compared files:

- `transcription_schema.json`
- `schema.json`

## High-level differences

- Total structural differences found: **36**
- `$defs` only in `transcription_schema.json`: MultipleChoiceOption, PracticeQuestionAnnotate, PracticeQuestionCheckbox, PracticeQuestionCreateTable, PracticeQuestionFillInTheBlanks, PracticeQuestionFreeForm, PracticeQuestionMatching, PracticeQuestionMultipleChoice
- `$defs` only in `schema.json`: BookTitlePage, PracticeQuestion, QuestionDifficultyLevel, QuestionType, UnitPreamble
- Root properties only in `transcription_schema.json`: (none)
- Root properties only in `schema.json`: book_title_page, unit_preamble

## Semantic differences that affect index.html

1. Root object extras in `schema.json`

- `schema.json` has `book_title_page` and `unit_preamble`; `transcription_schema.json` does not.
- `index.html` currently has no UI/data handling for these fields.

1. `page_type` enum

- `schema.json` includes `"title_page"` in `PageType` enum.
- `transcription_schema.json` does not include `"title_page"`.
- `index.html` page type select currently does **not** include `title_page` (see line ~26224).

1. `lesson_preamble` shape

- `schema.json`: requires `id`, `title`, `lesson_standards`, `terminology`.
- `transcription_schema.json`: requires `title`, `lesson_standards`, `terminology` (no `id`).
- `index.html` currently reads/writes `lesson_id` and serializes `lesson_preamble.id`.

1. Practice question model is fundamentally different

- `schema.json`: one flat `PracticeQuestion` object with fields:
`id`, `question_type`, `question`, `question_images`, `setup_text`, `guide_answer` (array of strings), `options` (array of strings or null), `difficulty`.
- `transcription_schema.json`: discriminated-style union across 7 question models with fields like:
`question_text`, `set_up_text`, `guide_answer` (string), `guide_pdf_page`, `guide_answer_images`, `related_question`, plus type-specific `choices/value/values/left/right/relationship`.
- `index.html` currently follows the `transcription_schema.json` style for most question fields.

1. Practice question defs

- `schema.json` uses `$defs.PracticeQuestion` + enums (`QuestionType`, `QuestionDifficultyLevel`).
- `transcription_schema.json` uses separate defs per type (`PracticeQuestionFreeForm`, `PracticeQuestionMultipleChoice`, etc.) + `MultipleChoiceOption`.

## Field mapping (schema.json -> transcription_schema.json)


| schema.json field        | transcription_schema.json field               | Note                                             |
| ------------------------ | --------------------------------------------- | ------------------------------------------------ |
| `question`               | `question_text`                               | Rename needed if targeting transcription schema. |
| `setup_text`             | `set_up_text`                                 | Different key spelling (`setup` vs `set_up`).    |
| `guide_answer: string[]` | `guide_answer: string`                        | Type/semantics changed.                          |
| `options: string[]`      | `choices` / `left+right` / `values` / `value` | Depends on `question_type`.                      |
| `difficulty`             | (not present)                                 | Present only in `schema.json`.                   |
| (not present)            | `guide_pdf_page`                              | Present only in transcription schema.            |
| (not present)            | `guide_answer_images`                         | Present only in transcription schema.            |
| (not present)            | `related_question`                            | Present only in transcription schema.            |


## index.html change checklist

Current implementation locations:

- `generateJSON`: line ~22725
- `collectFormDataWithoutValidation`: line ~23231
- `collectQuestionData`: line ~18985
- `deserializeQuestion`: line ~19204
- `populateQuestions`: line ~23708
- `populateFormFromJSON`: line ~24009
- `attemptRepairAndParseJSON`: line ~24290
- `page_type` select options: line ~26224

If you want index.html to target `schema.json`, update:

- Add root handling for `book_title_page` and `unit_preamble` in generation + loading paths.
- Add `title_page` option to the page type select.
- Keep `lesson_preamble.id` required.
- Rework question serialization/deserialization:
  - rename `question_text` -> `question`, `set_up_text` -> `setup_text`
  - convert `guide_answer` string <-> array semantics by `question_type`
  - convert `choices/value/values/left/right/relationship` <-> `options` + `guide_answer`
  - remove transcription-only fields (`guide_pdf_page`, `guide_answer_images`, `related_question`) or keep as non-schema extension fields.
- Add `difficulty` UI and serialization field.

If you want index.html to target `transcription_schema.json`, update:

- Remove dependency on `lesson_preamble.id` (UI + serialize + load + repair fallback).
- Keep page types without `title_page`.
- Do not add `book_title_page` / `unit_preamble` unless you intentionally extend beyond schema.

## Full structural diff list (auto-generated)

- `$.$id`: only in `transcription_schema.json`
- `$.$schema`: only in `transcription_schema.json`
- `$.$defs.MultipleChoiceOption`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionAnnotate`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionCheckbox`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionCreateTable`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionFillInTheBlanks`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionFreeForm`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionMatching`: only in `transcription_schema.json`
- `$.$defs.PracticeQuestionMultipleChoice`: only in `transcription_schema.json`
- `$.$defs.BookTitlePage`: only in `schema.json`
- `$.$defs.PracticeQuestion`: only in `schema.json`
- `$.$defs.QuestionDifficultyLevel`: only in `schema.json`
- `$.$defs.QuestionType`: only in `schema.json`
- `$.$defs.UnitPreamble`: only in `schema.json`
- `$.$defs.Bbox.title`: only in `transcription_schema.json`
- `$.$defs.LessonPreamble.properties.id`: only in `schema.json`
- `$.$defs.LessonPreamble.required`: list length differs (`transcription_schema.json`=3, `schema.json`=4)
- `$.$defs.LessonPreamble.required[0]`: value differs (`title` vs `id`)
- `$.$defs.LessonPreamble.required[1]`: value differs (`lesson_standards` vs `title`)
- `$.$defs.LessonPreamble.required[2]`: value differs (`terminology` vs `lesson_standards`)
- `$.$defs.PageRange.title`: only in `transcription_schema.json`
- `$.$defs.PageType.enum`: list length differs (`transcription_schema.json`=6, `schema.json`=7)
- `$.$defs.PageType.enum[1]`: value differs (`table_of_content` vs `title_page`)
- `$.$defs.PageType.enum[2]`: value differs (`unit_table_of_content` vs `table_of_content`)
- `$.$defs.PageType.enum[3]`: value differs (`vocabulary` vs `unit_table_of_content`)
- `$.$defs.PageType.enum[4]`: value differs (`project` vs `vocabulary`)
- `$.$defs.PageType.enum[5]`: value differs (`other` vs `project`)
- `$.$defs.Point.title`: only in `transcription_schema.json`
- `$.properties.book_title_page`: only in `schema.json`
- `$.properties.unit_preamble`: only in `schema.json`
- `$.properties.guidebook_pdf_pages.title`: only in `transcription_schema.json`
- `$.properties.lesson_preamble.title`: only in `transcription_schema.json`
- `$.properties.lesson_preamble.description`: only in `schema.json`
- `$.properties.practice_questions.anyOf[0].items.anyOf`: only in `transcription_schema.json`
- `$.properties.practice_questions.anyOf[0].items.$ref`: only in `schema.json`

## Recommendation

- Decide one canonical schema first; then keep a conversion layer for backward compatibility in `loadJSON`/`populateFormFromJSON` if needed.

