### Section 4–8 Replacement Plan: Canonical Compatibility, Validation, and Output Finalization

### Summary
Replace Sections 4–8 with a clean end-state plan that assumes no reliance on legacy/internal current behavior.  
Goal: keep UI/flows unchanged, keep old JSON load-compatible, and make all exported questions strictly conform to `schema.json` using one canonical adapter path.

### Implementation Changes
1. **Backward-Compatible Loading (Single Canonical Path)**
- Define one authoritative adapter load contract:
- `normalizeIncoming(rawQuestion) -> canonicalQuestion`
- `toPopulateShape(canonicalQuestion) -> uiBridgeQuestion`
- Canonical question shape:
- `id`, `question_type`, `question`, `guide_answer` (always array)
- `setup_text`, `question_images`, `guide_pdf_page`, `guide_answer_images`, `options`, `difficulty`
- Loading rules:
- Alias keys once at load: `question_text -> question`, `set_up_text -> setup_text`
- Mixed payload precedence: new flat fields win over legacy fields
- `guide_pdf_page` normalize to `integer | null`
- `difficulty` normalize to `null` always (UI-hidden policy)
- Type policies:
- `free_form`, `annotate`, `create_table`: accept legacy string `guide_answer`, normalize to `[]` or `[text]`
- `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`: ignore legacy manual `guide_answer` string; derive canonical answer from structural/new fields
- `guide_answer_images` policy:
- keep `array | null` only for `free_form`, `annotate`, `create_table`
- force `null` for `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`
- Legacy IDs policy:
- ignore `choices[].id` completely during load
- never surface IDs in UI state
- Empty-answer rule:
- never use `[""]`; canonical empty answer is always `[]`

2. **Validation Migration (Canonical Data Only)**
- Move generate/save validation inputs to canonical adapter output, not legacy fields.
- Preserve current UX/error style, but all checks run on canonical fields.
- Type-specific canonical validation:
- `multiple_choice`: `options` present; `guide_answer` either empty or exactly one option text
- `checkbox`: `options` present; `guide_answer` members must exist in options
- `fill_in_the_blanks`: blank tokens in question must align with ordered `guide_answer`
- `matching`: `options` must contain one `"---"` separator; pair strings in `guide_answer` must be valid/resolvable
- `free_form`, `annotate`, `create_table`: manual guide-answer/image checks remain supported
- Keep existing guide range vs per-question `guide_pdf_page` validation logic.
- Remove any validation branches tied to legacy choice IDs or removed manual-guide fields for auto-derived types.

3. **Canonical Rollout Order (No UI Breakage)**
- Phase A: wire all load/populate/copy-paste ingress through adapter normalization.
- Phase B: wire all validation sources to canonical questions.
- Phase C: switch all exports (`generateJSON`, `saveProgress`, autosave collection, copy/paste serialization) to schema export only.
- Phase D: remove legacy output emission paths and dead compatibility branches from runtime export code.
- Keep one migration switch for rollback safety until tests pass; then lock to canonical output mode.

4. **Final Output Contract**
- Every exported question must include:
- `id`, `question_type`, `question`, `guide_answer`
- Optional fields emitted by policy:
- `setup_text`, `question_images`, `guide_pdf_page`, `guide_answer_images`, `options`, `difficulty`
- Forced policies:
- `difficulty: null` for all questions
- `guide_answer_images: null` for `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`
- `guide_answer` is always array; empty is `[]`
- Never emit legacy/removed fields:
- `choices`, `value`, `values`, `left`, `right`, `relationship`, `related_question`
- Never emit/transcribe choice IDs.

5. **Patch Notes (8.0 Changes, Non-Technical)**
- Add/update concise user-facing entries that state:
- old files still load and are auto-updated in the background
- exported questions now follow one consistent format
- choice IDs are ignored and not exported
- for MCQ/Checkbox/Blanks/Matching, answers are auto-built from existing entries (no extra answer text needed)
- table insertion no longer needs extra description text

### Public/Internal Interface Changes
- Internal adapter APIs (canonicalized):
- `normalizeIncoming(rawQuestion)`
- `toPopulateShape(canonicalQuestion)`
- `toSchemaExport(canonicalQuestion)`
- Exported question JSON public contract:
- flat `PracticeQuestion` shape only (no legacy per-type fields)
- `guide_answer` array-only semantics
- `difficulty` always `null`

### Test Plan
1. **Compatibility Matrix**
- Load old-only, new-only, and mixed payloads for all 7 question types.
- Verify populate behavior is stable and non-blocking for valid legacy data.

2. **Roundtrip Integrity**
- Load -> edit -> save/generate -> reload.
- Confirm no legacy fields reappear and no UI regressions.

3. **Type Contract Assertions**
- `multiple_choice`: one-or-zero correct text in `guide_answer`, options text list only
- `checkbox`: selected texts in `guide_answer`
- `fill_in_the_blanks`: ordered blanks array in `guide_answer`
- `matching`: options with `"---"` separator + `left:right` guide pairs
- manual-answer types keep supported image behavior only where allowed

4. **Policy Assertions**
- `guide_answer_images` null-forced for auto-derived types
- `difficulty` always null
- no `[""]` in output; empty answers are `[]`
- no choice IDs in runtime output

5. **Regression Scenarios**
- Undo/redo, copy/paste, restore latest, autosave, quick jump, final preview edit navigation unchanged.

### Assumptions and Defaults
- This is a replacement plan for Sections 4–8 only.
- UI structure and authoring flow remain unchanged.
- Old payloads are accepted and normalized silently unless irrecoverably malformed.
- Text matching for ambiguous duplicate options/pairs follows deterministic first-match behavior unless stricter duplicate validation already blocks ambiguity.
- Implementation target remains `index.html` (with optional synchronized doc update after approval).
