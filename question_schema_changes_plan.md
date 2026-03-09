# Question Schema Migration Plan

Source comparison:
- Old schema: `transcription_schema.json`
- New target schema: `schema.json`
- Implementation target: `index.html` only

Goal:
- Keep UI and user flows unchanged where possible.
- Change only background JSON generation/loading behavior.
- Migrate all question types to the new `PracticeQuestion` contract.
- Keep loading backward-compatible with old saved JSON.

Implementation deferred note:
- This document revision is planning-only.
- Runtime changes in `index.html` are intentionally deferred until this plan text is approved.

---

## 1) Global Changes Required Before Touching Any Question Type (Status: Implemented)

Item 1 is already applied in `index.html` and should remain as-is for the next phase:

1. Canonical adapter scaffold exists and is wired:
- `QuestionSchemaAdapter.fromUI(...)`
- `QuestionSchemaAdapter.normalizeIncoming(...)`
- `QuestionSchemaAdapter.toLegacyExport(...)`

2. Global migration guard exists:
- `QUESTION_SCHEMA_MIGRATION_PHASE = "global_scaffold"`

3. Centralized key normalization is implemented:
- `question_text -> question`
- `set_up_text -> setup_text`
- `guide_answer` string/array normalization in adapter helpers

4. Required entry points already route through adapter:
- `generateJSON()`
- `saveProgress()`
- `collectFormDataWithoutValidation()`
- copy/paste serialize/deserialize
- load/normalize/populate paths

5. No additional Item 1 code changes are needed right now.
- Continue using scaffold bridge behavior until type-by-type migration is switched on.

---

## 2) Schema-Level Question Delta (Old -> New)

Old model:
- Per-type objects (`PracticeQuestionFreeForm`, `PracticeQuestionMultipleChoice`, etc.)
- `guide_answer` was `string`
- Type-specific fields: `choices/value/values/left/right/relationship`
- Legacy optional fields existed in old schema (`guide_pdf_page`, `guide_answer_images`, `related_question`)

New model:
- Single `PracticeQuestion` for all types
- `guide_answer` is now `string[]` for all types
- `options` is the common type-dependent carrier
- Canonical text keys: `question`, `setup_text`
- Keep per-question optional fields: `guide_pdf_page`, `guide_answer_images`
- Remove per-question `related_question`

---

## 3) Exact Per-Question-Type Migration Plan

### Common Rule For All Question Types

Generate:
- Preserve `guide_pdf_page` as `integer | null`.
- `guide_answer` is always built from the canonical per-type source.
- `guide_answer_images` policy by type:
- Keep `guide_answer_images` (`PagedBbox[] | null`) only for manual-answer types: `free_form`, `annotate`, `create_table`.
- For `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`, always export `guide_answer_images: null` (unsupported in tool flow).

Load (backward compatible):
- Accept missing `guide_pdf_page` and treat as empty/null.
- Accept missing `guide_answer_images` and treat as null/empty by adapter policy.
- For `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`:
- Ignore legacy manual `guide_answer` string during load (strict mode).
- Derive canonical answer data from structural fields or from new flat fields.

Remove from output:
- Keep removing legacy per-type structures (`choices`, `value`, `values`, `left`, `right`, `relationship`) after migration flip.
- Keep `guide_pdf_page` for all types.
- Keep `guide_answer_images` optional at schema level, but intentionally force it to `null` for `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`.

---

### A) `free_form`

Generate:
- `options = null`
- `guide_answer = []` if empty, else `[guideAnswerText]`

Load (backward compatible):
- New payload: use `guide_answer` array directly
- Old payload: convert old string `guide_answer` into array form (`[]` or `[text]`)

Remove from output:
- Any old type-specific fields not in new schema

---

### B) `multiple_choice`

Generate:
- Build `options` from visible choice texts in order: `["A text", "B text", ...]`
- Convert selected correct answer index/UID to correct option text
- `guide_answer = [correctOptionText]` (or `[]` if none selected; keep current empty behavior)
- No manual `Guide Answer` UI.
- No `Answer Images` UI.
- No Choice ID UI.
- `guide_answer_images = null`.

Load (backward compatible):
- New payload:
  - `options` populates choice texts
  - `guide_answer[0]` restores the correct choice by exact text match (first match if duplicates)
- Old payload:
  - `choices[].text` populates choices
  - `value`/`correct_answer_index` sets the correct choice
  - `choices[].id` is ignored completely
  - old string `guide_answer` is ignored (strict mode)
- If both old and new fields exist, prefer new (`options` + `guide_answer[]`).

Remove from output:
- `choices`, `value`
- never emit choice IDs

---

### C) `checkbox`

Generate:
- `options` from visible choice texts in order
- `guide_answer` = list of selected choice texts in display order
- If none selected, `guide_answer = []`
- No manual `Guide Answer` UI.
- No `Answer Images` UI.
- No Choice ID UI.
- `guide_answer_images = null`.

Load (backward compatible):
- New payload:
  - `options` populates choices
  - mark checked choices by text membership in `guide_answer`
- Old payload:
  - `choices[].text` + `values[]` (or `choices[].checked`) restore checked state
  - `choices[].id` is ignored completely
  - old string `guide_answer` is ignored (strict mode)
- If both old and new fields exist, prefer new (`options` + `guide_answer[]`).

Remove from output:
- `choices`, `values`
- never emit choice IDs

---

### D) `fill_in_the_blanks`

Generate:
- `options = null`
- `guide_answer` must be the blanks answers list in order (`___1___`, `___2___`, ...)
- Keep current blank-count/order validations
- No manual `Guide Answer` UI.
- No `Answer Images` UI.
- `guide_answer_images = null`.

Load (backward compatible):
- New payload:
  - `guide_answer[]` fills blank answers in order
- Old payload:
  - `values[]` fills blank answers
  - old string `guide_answer` is ignored (strict mode)
- If both old and new fields exist, prefer new (`options` + `guide_answer[]`).

Remove from output:
- `values`

---

### E) `annotate`

Generate:
- `options = null`
- `guide_answer = [text]` when text exists
- If purely visual/no text, emit `guide_answer = [""]` (matches new schema description)

Load (backward compatible):
- New payload: first array item to annotate guide-answer input
- Old payload: old string `guide_answer` to same input

Remove from output:
- Any old non-schema fields

---

### F) `matching`

Generate:
- Build `options` as:
  - left items, then `"---"`, then right items
  - Example: `["L1", "L2", "---", "R1", "R2", "R3"]`
- Convert relationships into `guide_answer` pair strings:
  - `["L1:R2", "L2:R1"]`
  - Use resolved item texts from indices/UID links
  - Skip invalid links via existing validation pathway
- No manual `Guide Answer` UI.
- No `Answer Images` UI.
- `guide_answer_images = null`.

Load (backward compatible):
- New payload:
  - split `options` by separator `"---"` into left/right lists
  - parse `guide_answer` pairs `left:right` to restore relationships by text match
- Old payload:
  - use `left[]`, `right[]`, `relationship[][]` directly
  - old string `guide_answer` is ignored (strict mode)
- If both old and new fields exist, prefer new (`options` + `guide_answer[]`).

Remove from output:
- `left`, `right`, `relationship`

---

### G) `create_table`

Generate:
- `options = null`
- `guide_answer = [tableMarkdown]` (or `[]` if empty)

Load (backward compatible):
- New payload: first `guide_answer` item fills guide-answer/table input
- Old payload: old string `guide_answer` fills same input

Remove from output:
- Any old non-schema fields

---

## 4) Backward-Compatible Loading Rules (Required)

Use one normalization function at load entry (before populate):

1. Key normalization:
- `question_text -> question` if `question` missing
- `set_up_text -> setup_text` if `setup_text` missing

2. Answer normalization:
- For `free_form`, `annotate`, `create_table`:
- If `guide_answer` is old string, convert to type-appropriate array form.
- For `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`:
- Ignore old manual `guide_answer` string (strict mode).
- Rebuild canonical `guide_answer[]` from structural fields first (`choices/value/values/left/right/relationship`) or from new flat shape (`options + guide_answer[]`).

3. Optional field normalization:
- Normalize `guide_pdf_page` to `integer | null`.
- Normalize `guide_answer_images` to array/null according to adapter policy.
- Force `guide_answer_images = null` for `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`.

4. Type payload normalization:
- If old fields exist (`choices/value/values/left/right/relationship`) and new `options/guide_answer[]` are missing, derive new canonical form in memory
- If both old and new exist, prefer new
- For `multiple_choice` and `checkbox`, ignore legacy `choices[].id` if present.

5. Do not re-emit legacy fields on save/generate.
- Exception: `guide_pdf_page` is kept for all types, and `guide_answer_images` is kept only where supported by this tool flow.

6. Keep old payload acceptance silent (no blocking) unless data is structurally invalid.

---

## 5) Validation Migration (After Canonical Layer, Before Type-by-Type Refactor)

1. Move type validations to operate on canonical new fields:
- `guide_answer[]`
- `options`
- `question`, `setup_text`
- `guide_pdf_page`
- `guide_answer_images`

2. Keep current UI warnings/errors behavior as much as possible, but point checks to new canonical data.

3. Matching validations:
- Validate separator presence and left/right partition in canonical `options`
- Validate `guide_answer` pair formatting (`left:right`) and resolvability

4. Multiple choice / checkbox validations:
- Validate options not empty
- Validate derived `guide_answer` content against options
- Remove choice-ID consistency checks from migration target behavior (choice IDs no longer exist).

5. Fill-in-the-blanks:
- Validate blank tokens against derived `guide_answer` length/order

6. Preserve existing guide-page validations for all types.
- Preserve guide-answer-image validations only for `free_form`, `annotate`, `create_table`.
- Remove manual guide-answer and answer-image validation paths for `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`.
- guidebook range vs per-question `guide_pdf_page`

---

## 6) Canonical Rollout Order (No UI Breakage)

1. Add shared normalizer + canonical mapper functions.
2. Switch JSON generation/save-draft pathways to canonical output only.
3. Switch load/populate to consume both old/new payloads through normalizer.
4. Update validation functions to use canonical fields.
5. Remove remaining direct dependencies on old output fields.
6. Run compatibility checks with:
- old JSON only
- new JSON only
- mixed old+new keys

---

## 7) Output Contract After Migration

Every exported question must follow new schema only:
- Must include: `id`, `question_type`, `question`, `guide_answer`
- Optional: `setup_text`, `question_images`, `guide_pdf_page`, `guide_answer_images`, `options`, `difficulty`
- For `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`:
- `guide_answer` is derived automatically from type-specific UI structures.
- `guide_answer_images` is intentionally always `null` in this tool flow.
- For `multiple_choice` and `checkbox`, choice IDs are never exported.
- Must not include: `choices`, `value`, `values`, `left`, `right`, `relationship`, `related_question`

---

## 8) Patch Notes Update Requirement (Version 8.0, Changes)

Add non-technical entries to `Changes` in the `8.0` patch notes:
- "For Multiple Choice, Checkbox, Fill in the Blanks, and Matching, we removed the extra Guide Answer and Answer Images inputs. Answers are now built automatically from your existing selections/entries, so these question types are simpler and more consistent, and you do not need to add extra answer text manually."
- "Choice letter/ID fields for answer options were removed. Older choice IDs are now ignored during loading and are not transcribed or exported anymore."
- "When inserting tables, no extra table description is required anymore."
