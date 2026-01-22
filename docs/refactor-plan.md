# Transcription Tool - Refactor Plan

## Executive Summary

This document outlines a phased approach to refactoring `index.html` to:
1. Remove dead code and unused functions
2. Eliminate duplicate patterns
3. Consolidate legacy wrappers
4. Ensure canonical helpers are used everywhere

**Constraint**: Zero UI/behavior changes. All undo/redo, autosize, and preview functionality must remain identical.

---

## Completed Work Summary

**Lines removed**: ~942 lines (25,146 → 24,204)

### Phase 1 - Duplicate Functions Removed:
- `escapeHtml()` - 3 duplicates removed (kept line 6597)
- `attachBboxValidation()` - 1 shadowed duplicate removed
- `attachBboxValidationToItem()` - 1 inferior duplicate removed

### Phase 1 - Dead Code Removed:
- `renderActionButtons()` - never called
- `wireActionButtons()` - never called
- `getRelationshipData()` - never called  
- `setRelationshipData()` - never called
- `categorizeValidationErrors()` - never called (~70 lines)

### Phase 2 - Button System Consolidation:
- `buildActionButton()` - alias function removed, call sites updated to use `createButton()`

### Phase 3 - Insert/Mutation Pipeline:
- `finalizeArrayItem()` - legacy wrapper removed (~40 lines), call sites updated to use `finalizeElement()`
- Simplified `insertArrayItemBefore()` and `insertArrayItemAfter()` signatures

### Phase 4 - Deep Dead Code Sweep:
- `resolveActiveAutosizeRoot()` - never called (~14 lines)
- Debug `console.log` statements removed from PDF viewer

### Phase 5 - Final Preview Audit:
- `drawMatchingLines()` - legacy SVG line drawing removed (~70 lines)
- Matching preview now uses table-based approach with `buildPreviewBox`

### Canonical Helpers Confirmed:
- `finalizeElement()` - universal element finalization
- `buildPreviewBox()` - universal preview box builder  
- `createButton()` - canonical button DOM builder
- `navigateToInput()` - edit-pen navigation
- `AutoSizeManager.refresh()` - autosize pipeline
- `postUndoRedoRestore()` - undo/redo restoration

---

## Phase 0: Inventory & Audit (COMPLETE)
See `inventory-map.md` for complete system documentation.

---

## Phase 1: Remove Duplicate Function Definitions

### Scope
Remove exact duplicate function definitions that exist in multiple places.

### Changes

#### 1.1 Remove duplicate `escapeHtml()` definitions
**Current State**: 3 identical definitions at lines 6748, 7620, 7779
**Action**: Keep first one (line 6748), remove lines 7620 and 7779
**Risk**: Low - functions are identical
**Evidence**: 
```bash
grep -n "function escapeHtml" index.html
# 6748, 7620, 7779 all have identical bodies
```

#### 1.2 Remove duplicate `attachBboxValidation()` definition
**Current State**: Two definitions at lines 8512 and 11225
**Action**: Keep line 8512 (in validation section), remove line 11225
**Risk**: Low - need to verify they're identical
**Evidence**: Compare both function bodies

#### 1.3 Remove duplicate `attachBboxValidationToItem()` definition
**Current State**: Two definitions at lines 11207 and 11965
**Action**: Keep line 11207, remove line 11965
**Risk**: Low - need to verify they're identical

### Safety Checks
- [ ] All call sites still work after removal
- [ ] No console errors on page load
- [ ] BBox validation still triggers on input

### Test Checklist
- [ ] Add content section with images → bbox validation works
- [ ] Add question with images → bbox validation works
- [ ] Tab through bbox fields → validation triggers
- [ ] Invalid coordinates show error styling

### Rollback
Restore the removed function definitions from git/backup.

---

## Phase 2: Consolidate Button System

### Scope
The button system has multiple overlapping APIs. Consolidate to one canonical path.

### Current State
- `createButton()` - DOM builder (canonical)
- `buildActionButton()` - Alias to createButton
- `getActionButtonHTML()` - String builder
- `buildActionButtonsHTML()` - Config-based string builder
- 3 config objects: `ACTION_BUTTON_CONFIGS`, `STATIC_BUTTON_CONFIGS`, `ACTION_BUTTON_CONFIGS_STATIC`

### Changes

#### 2.1 Audit button creation call sites
**Action**: List all places that create buttons
**Purpose**: Understand which APIs are actually used

#### 2.2 Remove `buildActionButton()` if only used as alias
**Action**: Replace calls with direct `createButton()` calls
**Risk**: Low - just an alias

#### 2.3 Consolidate config objects if overlap
**Action**: 
- `ACTION_BUTTON_CONFIGS` - For dynamic list item buttons
- `STATIC_BUTTON_CONFIGS` - For static page buttons
- `ACTION_BUTTON_CONFIGS_STATIC` - Merge into STATIC_BUTTON_CONFIGS if redundant

### Safety Checks
- [ ] All buttons render correctly
- [ ] All button click handlers work
- [ ] Button styling unchanged

### Test Checklist
- [ ] All toolbar buttons work (undo, redo, save, etc.)
- [ ] Add/remove section buttons work
- [ ] Reorder buttons work
- [ ] BBox drawer buttons work
- [ ] Tab switching works

### Rollback
Restore removed functions/configs from backup.

---

## Phase 3: Clean Up Insert/Add Functions

### Scope
Multiple specialized insert functions that could potentially share more code.

### Current State

| Pattern | Functions | Notes |
|---------|-----------|-------|
| Sections | `addContentSection*`, `addQuestion*` | Uses `addOrInsertSection()` |
| Standards/Terms | `addLessonStandard*`, `addTerminology*` | Uses `insertArrayItemBefore/After()` |
| BBox | `insertBBoxItem*`, `add*Image*` | Direct implementation |
| Choices | `addChoice*` | Direct implementation |

### Changes

#### 3.1 Verify all insert paths use canonical finalization
**Action**: Trace each insert function to ensure it calls `finalizeElement()` or a wrapper
**Current Status**: Already migrated in previous work

#### 3.2 Remove unused specialized functions
**Action**: Search for any insert/add functions with zero call sites
**Risk**: Medium - need exhaustive search including string references

### Safety Checks
- [ ] All add operations record undo action
- [ ] All add operations finalize element (previews, fonts, autosize)
- [ ] Numbering updates correctly

### Test Checklist
- [ ] Add content section at end → works
- [ ] Insert content section before/after → works
- [ ] Add question at end → works
- [ ] Insert question before/after → works
- [ ] Add lesson standard → works
- [ ] Add terminology → works
- [ ] Add bbox row → works
- [ ] Insert bbox before/after → works
- [ ] Add choice → works
- [ ] Insert choice before/after → works

### Rollback
Restore any removed functions.

---

## Phase 4: Dead Code Removal

### Scope
Remove functions/constants that are never referenced.

### Methodology
1. For each suspect function, search for:
   - Direct calls: `functionName(`
   - String references: `'functionName'` or `"functionName"`
   - onclick attributes: `onclick="functionName`
2. If no references found, remove

### Candidates to Check

| Function | Line | Suspect Reason |
|----------|------|----------------|
| `drawMatchingLines()` | 7627 | Old SVG-based matching preview |
| `wireActionButtons()` | 1602 | May be unused (event delegation approach) |
| Various `update*` functions | - | Check if superseded |

### Changes

#### 4.1 Identify dead functions
**Action**: Run comprehensive search for each function
**Output**: List of functions with zero references

#### 4.2 Remove confirmed dead code
**Action**: Delete functions with evidence of non-use
**Risk**: Medium - must be thorough

#### 4.3 Remove dead constants/configs
**Action**: Search for unused constants
**Candidates**: Check each entry in config objects

### Safety Checks
- [ ] No console errors
- [ ] No "function not defined" errors
- [ ] All features still work

### Test Checklist
- Full regression test (see Manual Regression Checklist below)

### Rollback
Restore removed code from backup.

---

## Phase 5: Final Preview Audit

### Scope
Ensure all preview renderers use `buildPreviewBox()` consistently.

### Current State
- `buildPreviewBox()` is the canonical builder (line 6801)
- Most preview sections use it
- Need to verify matching preview fully conforms

### Changes

#### 5.1 Audit all preview render functions
**Action**: Check each renderer uses `buildPreviewBox()`

| Renderer | Uses buildPreviewBox? |
|----------|----------------------|
| `renderQuestionPreview()` | Verify |
| `renderMultipleChoicePreview()` | Verify |
| `renderFillInBlanksPreview()` | Verify |
| `renderMatchingPreview()` | Verify |
| `renderGuideAnswerPreview()` | Verify |

#### 5.2 Fix any non-conforming renderers
**Action**: Migrate to use `buildPreviewBox()`

### Safety Checks
- [ ] All preview sections render
- [ ] Edit pens navigate correctly
- [ ] Styling consistent across all preview boxes

### Test Checklist
- [ ] Final Preview → Basic Info tab renders
- [ ] Final Preview → Lesson Preamble tab renders
- [ ] Final Preview → Content sections render
- [ ] Final Preview → Questions render (all types)
- [ ] Each edit pen navigates to correct input

### Rollback
Restore original render functions.

---

## Phase 6: Final Cleanup

### Scope
Code organization, naming consistency, comment cleanup.

### Changes

#### 6.1 Remove leftover TODO/FIXME comments
**Action**: Search for TODO/FIXME and evaluate
```bash
grep -n "TODO\|FIXME\|HACK\|XXX" index.html
```

#### 6.2 Remove commented-out code blocks
**Action**: Search for large commented sections
**Criteria**: If commented for >1 version, remove

#### 6.3 Consistent naming
**Action**: Audit function naming patterns
- Builders: `build*()` or `get*HTML()`
- Handlers: `handle*()` or action verb
- Updaters: `update*()` or `sync*()`

#### 6.4 Group related functions
**Action**: Ensure logical grouping in file
- Undo/redo system
- Button system
- Question type system
- Preview system
- etc.

### Safety Checks
- [ ] No functional changes
- [ ] Code still readable

### Test Checklist
- Full regression test

---

## Manual Regression Checklist

Run after each phase:

### Add/Insert Operations
- [ ] Add content section at end
- [ ] Insert content section before existing
- [ ] Insert content section after existing
- [ ] Add question at end
- [ ] Insert question before existing
- [ ] Insert question after existing
- [ ] Add lesson standard
- [ ] Insert lesson standard before/after
- [ ] Add terminology
- [ ] Insert terminology before/after
- [ ] Add bbox row (each context)
- [ ] Insert bbox before/after
- [ ] Add choice (MCQ)
- [ ] Add choice (Checkbox)
- [ ] Insert choice before/after
- [ ] Add matching left item
- [ ] Add matching right item
- [ ] Add relationship

### Undo/Redo Operations
For each add operation above:
- [ ] Undo → item removed
- [ ] Redo → item restored with same data

For remove operations:
- [ ] Remove item
- [ ] Undo → item restored
- [ ] Redo → item removed again

For duplicate:
- [ ] Duplicate section
- [ ] Undo → duplicate removed
- [ ] Redo → duplicate restored

For paste:
- [ ] Copy section
- [ ] Paste into another section
- [ ] Undo → original content restored
- [ ] Redo → pasted content restored

For load JSON:
- [ ] Load JSON
- [ ] Undo → previous state restored
- [ ] Redo → JSON data restored

### Autosize
- [ ] New textarea autosizes on type
- [ ] Restored textarea has correct size
- [ ] Preview updates size correctly
- [ ] Tab switch triggers resize

### Final Preview
- [ ] Basic Info shows all fields
- [ ] Lesson Preamble shows standards + terminology
- [ ] Content sections show text + images
- [ ] Each question type renders correctly
- [ ] MCQ shows correct choice marked
- [ ] Checkbox shows correct choices marked
- [ ] Matching shows items + relationships (many-to-many)
- [ ] Blanks shows filled values
- [ ] All edit pens navigate correctly

### LocalStorage Restore
- [ ] Make changes
- [ ] Reload page
- [ ] Verify data restored
- [ ] Autosize correct after restore

---

## Implementation Order

1. **Phase 1** (Low risk): Remove duplicate definitions
2. **Phase 4.1** (Investigation): Identify dead code
3. **Phase 4.2** (Medium risk): Remove dead code
4. **Phase 2** (Low risk): Button system cleanup
5. **Phase 3** (Verification): Insert function audit
6. **Phase 5** (Low risk): Preview audit
7. **Phase 6** (No risk): Final cleanup

---

## Success Criteria

- [ ] All tests in Manual Regression Checklist pass
- [ ] No console errors
- [ ] File size reduced (dead code removed)
- [ ] No duplicate function definitions remain
- [ ] Single canonical helper for each concern
- [ ] UI identical to before refactor
