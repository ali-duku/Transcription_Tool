## Add Conditional Guidebook/Guide-Page Validation (Generation-Only)

### Summary
Implement three new blocking validations in `generateJSON()` inside [index.html](/c:/Users/alidu/Downloads/out/Transcription_Tool/index.html), without changing UI, JSON schema, or any non-generation behavior:

1. `Guidebook PDF Pages (Start - End)` must be both filled or both empty.
2. If guidebook range is filled (both start/end present), every question must have non-empty `Guide PDF Page`.
3. If guidebook range is empty (both start/end empty), no question may have `Guide PDF Page` filled.

This will block JSON generation only (as requested).

### Public Interface / Behavior Changes
No API/type/schema/UI changes.
Only validation behavior during `Generate JSON` button flow changes.

### Implementation Details

1. In `generateJSON()`, after reading:
- `guidebookStart = document.getElementById('guidebook_start_page').value`
- `guidebookEnd = document.getElementById('guidebook_end_page').value`

Add normalized flags:
- `hasGuidebookStart = guidebookStart.trim() !== ''`
- `hasGuidebookEnd = guidebookEnd.trim() !== ''`
- `hasGuidebookRange = hasGuidebookStart && hasGuidebookEnd`
- `hasPartialGuidebookRange = hasGuidebookStart !== hasGuidebookEnd`

2. Add top-level guidebook pair validation to `validationErrors`:
- If `hasPartialGuidebookRange`, push a blocking error:
  - `"Guidebook PDF Pages (Start - End) must be both filled or both empty."`

3. In question loop (`questionElements.forEach((questionEl, index) => { ... })`), before type-specific branches:
- Read raw guide page directly from question field (not parsed value only):
  - `const guidePdfInput = findFieldByLabel(questionEl, 'Guide PDF Page', 'input');`
  - `const rawGuidePdf = guidePdfInput ? guidePdfInput.value.trim() : '';`
  - `const hasGuidePdf = rawGuidePdf !== '';`

4. Add new conditional per-question blocking rules (for all question types):
- If `hasGuidebookRange && !hasGuidePdf`, push:
  - `ErrorMessages.requiredGuidePage(index)` (reuse existing message)
- If `!hasGuidebookRange && hasGuidePdf`, push a new explicit error message:
  - `Question N - Problem: Guide PDF Page must be empty when Guidebook PDF Pages (Start - End) are empty.`  
  (wording kept in existing error style)

5. Keep existing numeric/range checks for `questionData.guide_pdf_page` unchanged.
- They will still validate integer/range when a value exists.
- No removal/refactor of existing type-specific logic to avoid behavior drift.

6. Do **not** modify:
- `saveProgress()` validation behavior
- field required markers/classes
- JSON output structure
- load/save/autosave logic
- preview/PDF logic

### Test Cases / Scenarios

1. Guidebook start empty, end empty; all questions guide page empty:
- Expected: generation succeeds (assuming no other errors).

2. Guidebook start filled, end empty:
- Expected: generation blocked with pair error.

3. Guidebook start empty, end filled:
- Expected: generation blocked with pair error.

4. Guidebook start+end filled; at least one question guide page empty:
- Expected: generation blocked with required-guide-page error for that question.

5. Guidebook start+end filled; all questions guide page filled and in range:
- Expected: generation succeeds.

6. Guidebook start+end empty; any question has guide page filled:
- Expected: generation blocked with "must be empty when guidebook range empty" error.

7. Mixed question types (`free_form`, `multiple_choice`, `checkbox`, `fill_in_the_blanks`, `matching`, `annotate`, `create_table`) with same guidebook conditions:
- Expected: rules apply identically to all.

8. Existing validations still behave the same:
- integer/range checks, markdown/latex/image validations, warnings flow unchanged.

### Assumptions and Defaults
- Scope is strictly generation-time blocking in `generateJSON()` only.
- Existing save/autosave non-blocking behavior remains unchanged.
- Error text can be added inline for the new "must be empty when guidebook is empty" rule; existing `ErrorMessages.requiredGuidePage` reused for required case.

