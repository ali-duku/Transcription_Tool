### Remove `guide_pdf_page`, `related_question`, `guide_answer_images` From `index.html`

### Summary
Completely remove the three fields from UI, state, JSON I/O, preview, validation, navigation, and image/bbox plumbing in `index.html`, while keeping all other question flows intact and canonical.  
Per your selection, guide-answer images will be **disabled** (not remapped to `question_images`).

### Implementation Changes
1. **Question UI + rendering**
- Remove `Guide PDF Page` and `Related Question` header inputs from question HTML generation.
- Remove `Answer Images` bbox group and all `addAnswerImage*` handlers/usages.
- Update question type toggle logic to stop querying/showing/hiding removed containers.
- Remove final preview sections/cards for `Guide PDF Page` and `Related Question`.
- Remove related input-direction setup references and any UI selectors tied to these fields.

2. **Question data model + state flows**
- Remove the three fields from:
  - undo/redo question state serialization/restoration,
  - question collect/deserialize/load/populate paths,
  - JSON generate + save-progress output.
- Ensure question payload still exports all remaining keys exactly as before.
- Keep backward load behavior implicit: old JSON containing removed keys is accepted but those keys are ignored and never re-emitted.

3. **Validation + errors**
- Delete guide-page validation checks (required/empty/range/integer) from both generate and autosave validation paths.
- Remove obsolete error message entries and references for guide-page and answer-images validations.
- Remove answer-image consistency/reference/order checks.
- Add a single canonical validation rule for guide-answer fields: image markdown is not supported (to enforce disabled guide-answer images).

4. **BBox/image infrastructure cleanup**
- Simplify bbox collection and fill logic to `images` / `question_images` only.
- Remove answer-image before/after function routing in bbox row duplication/drawing/fill helpers.
- Remove answer-image map keys and answer-image lookup branches in bbox preview key mapping/reconciliation.
- Keep question image indexing/order logic canonical for setup/question/choices/matching only.

5. **Navigation/context cleanup**
- Remove Guide PDF Page–specific navigation extraction, field listeners, and related source/page branching.
- Keep guide auto-navigation based on existing guidebook range + guide-answer context only.
- Remove removed-field label checks from guide/textbook field classification helpers.

6. **No-trace cleanup**
- Remove all literal/comment/changelog/help text mentions of:
  - `guide_pdf_page` / `Guide PDF Page`
  - `related_question` / `Related Question`
  - `guide_answer_images` / `Answer Images` / `answer_images`
- Keep all unrelated guidebook/textbook logic and UI unchanged.

### Test Plan
1. **Schema/output**
- Generate JSON from mixed question types.
- Confirm no question includes `guide_pdf_page`, `related_question`, or `guide_answer_images`.

2. **UI behavior**
- Add/edit questions across all types; ensure no missing controls/layout regressions.
- Verify question images bbox add/before/after/draw/copy/paste/duplicate still work.

3. **Load/restore/undo**
- Load JSON that still contains removed keys; form loads without errors.
- Save/regenerate immediately; removed keys are not present.
- Undo/redo and restore latest work without console errors.

4. **Validation**
- Confirm no guide-page errors appear.
- Confirm guide-answer image markdown is blocked by the new canonical validation rule.

5. **Navigation/final preview**
- Auto-navigation still works for existing guidebook range behavior.
- Final preview renders without removed field cards and without broken edit targets.

6. **Trace check**
- Run final grep in `index.html` for removed tokens; must return zero matches.

### Assumptions
- Guide-answer images are intentionally disabled (chosen option).
- Only `index.html` is modified.
- Guidebook range fields remain supported (only per-question guide page is removed).
