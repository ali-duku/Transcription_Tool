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

---

## 1) Global Changes Required Before Touching Any Question Type

1. Introduce one canonical question output shape (single source of truth) used by:
- `generateJSON()`
- `saveProgress()`
- `collectFormDataWithoutValidation()`
- copy/paste serialization helpers

Canonical output shape (new schema):
- `id: string`
- `question_type: enum`
- `question: string`
- `setup_text: string | null`
- `question_images: PagedBbox[] | null`
- `guide_answer: string[]` (always array, required)
- `options: string[] | null`
- `difficulty: "easy" | "medium" | "hard" | null` (no UI yet, so default behavior below)

2. Add a single shared transformer layer:
- `toNewSchemaQuestionFromUI(questionEl)` for generation
- `toUIQuestionFromAnySchema(rawQuestion)` for loading

3. Keep the UI model untouched internally (choices rows, matching UI, blanks UI), but do not emit old fields in final JSON:
- remove from output: `choices`, `value`, `values`, `left`, `right`, `relationship`
- keep these as temporary UI-only structures during editing if needed

4. Keep existing key migration (`question_text -> question`, `set_up_text -> setup_text`) and extend compatibility for new/old question payload styles.

5. `difficulty` handling:
- No UI field now.
- Do not require user input.
- Emit `difficulty: null` only if a strict explicit-null style is required; otherwise omit field (schema allows omission).

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
- No per-question `guide_pdf_page`, `guide_answer_images`, `related_question`

---

## 3) Exact Per-Question-Type Migration Plan

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
- `guide_answer = [correctOptionText]` (or `[]` if none selected; keep validation error behavior)

Load (backward compatible):
- New payload:
  - `options` populates choice texts
  - `guide_answer[0]` identifies correct choice by exact text match (first match if duplicates)
- Old payload:
  - `choices[].text` populates choices
  - `value`/`correct_answer_index` sets the correct choice
  - old string `guide_answer` can be used as fallback correct-text match if index missing

Remove from output:
- `choices`, `value`

---

### C) `checkbox`

Generate:
- `options` from visible choice texts in order
- `guide_answer` = list of selected choice texts in display order
- If none selected, `guide_answer = []`

Load (backward compatible):
- New payload:
  - `options` populates choices
  - mark checked choices by text membership in `guide_answer`
- Old payload:
  - `choices[].text` + `values[]` (or `choices[].checked`) restore checked state
  - old string `guide_answer` may be treated as optional notes fallback only

Remove from output:
- `choices`, `values`

---

### D) `fill_in_the_blanks`

Generate:
- `options = null`
- `guide_answer` must be the blanks answers list in order (`___1___`, `___2___`, ...)
- Keep current blank-count/order validations

Load (backward compatible):
- New payload:
  - `guide_answer[]` fills blank answers in order
- Old payload:
  - `values[]` fills blank answers
  - old string `guide_answer` can populate notes UI only (if kept), but must not replace blanks answer array output

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

Load (backward compatible):
- New payload:
  - split `options` by separator `"---"` into left/right lists
  - parse `guide_answer` pairs `left:right` to restore relationships by text match
- Old payload:
  - use `left[]`, `right[]`, `relationship[][]` directly
  - old string `guide_answer` can remain optional notes fallback only

Remove from output:
- `left`, `right`, `relationship`

---

### G) `create_table`

Generate:
- `options = null`
- `guide_answer = [tableMarkdown]` (or `[""]` if empty, based on current validation policy)

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
- If `guide_answer` is string (old): convert to type-appropriate array form

3. Type payload normalization:
- If old fields exist (`choices/value/values/left/right/relationship`) and new `options/guide_answer[]` are missing, derive new canonical form in memory
- If both old and new exist, prefer new

4. Do not re-emit legacy fields on save/generate.

5. Keep old payload acceptance silent (no blocking) unless data is structurally invalid.

---

## 5) Validation Migration (After Canonical Layer, Before Type-by-Type Refactor)

1. Move type validations to operate on canonical new fields:
- `guide_answer[]`
- `options`
- `question`, `setup_text`

2. Keep current UI warnings/errors behavior as much as possible, but point checks to new canonical data.

3. Matching validations:
- Validate separator presence and left/right partition in canonical `options`
- Validate `guide_answer` pair formatting (`left:right`) and resolvability

4. Multiple choice / checkbox validations:
- Validate options not empty
- Validate guide_answer content against options

5. Fill-in-the-blanks:
- Validate blank tokens against `guide_answer` length/order

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
- Optional: `setup_text`, `question_images`, `options`, `difficulty`
- Must not include: `choices`, `value`, `values`, `left`, `right`, `relationship`, `guide_pdf_page`, `guide_answer_images`, `related_question`

