# Transcription Tool - Inventory & Map (Phase 0)

## Overview
- **File**: `index.html` (~25,146 lines)
- **Type**: Single-file web application
- **Functions**: 336 total
- **Purpose**: Form-based transcription tool for lesson content with JSON export

---

## 1. Entry Points

### Initialization
| Function | Line | Purpose |
|----------|------|---------|
| `gtag()` | 11 | Google Analytics |
| `hydrateStaticButtons()` | 1511 | Initialize static button groups |
| `hydrateStaticActionButtons()` | 1097 | Replace placeholder buttons with actual buttons |
| `hydrateStaticMarkdownToolbars()` | 10718 | Initialize markdown toolbars |
| `initializeFieldValidation()` | 8378 | Setup field validation |
| `initializeAutoResize()` | 13215 | Setup auto-resize for textareas |
| `initializeFontSettings()` | 13428 | Load saved font settings |
| `initializeDarkMode()` | 13474 | Load dark mode preference |

### Tab/View Switching
| Function | Line | Purpose |
|----------|------|---------|
| `showTab()` | 6199 | Switch between Basic/Preamble/Content/Questions tabs |
| `showMainTab()` | 6231 | Switch between Input Form and Final Preview |
| `generateFinalPreview()` | 6323 | Build the Final Preview HTML |

---

## 2. State Model

### Dataset Usage (data-* attributes)
| Attribute | Element | Purpose |
|-----------|---------|---------|
| `data-question-type` | Question .array-item | Question type (free_form, multiple_choice, checkbox, fill_in_the_blanks, matching) |
| `data-choice-uid` | Choice .choice-item | Unique ID for choice item |
| `data-correct-choice-uid` | Question .array-item | UID of correct MCQ answer |
| `data-correct-choice-uids` | Question .array-item | Comma-separated UIDs for checkbox correct answers |
| `data-left-uid` | Matching .matching-item | UID for left matching item |
| `data-right-uid` | Matching .matching-item | UID for right matching item |
| `data-relationship-uid` | Relationship .relationship-item | UID for relationship |
| `data-side` | Matching item | "left" or "right" |

### UID Management Functions
| Function | Line | Purpose |
|----------|------|---------|
| `generateElementUid()` | 724 | Generate unique ID |
| `ensureChoiceUids()` | 729 | Assign UIDs to all choices |
| `ensureMatchingUids()` | 743 | Assign UIDs to matching items |
| `getCorrectChoiceUid()` | 783 | Get MCQ correct answer UID |
| `setCorrectChoiceUid()` | 789 | Set MCQ correct answer UID |
| `getCorrectChoiceUids()` | 799 | Get checkbox correct answer UIDs |
| `setCorrectChoiceUids()` | 807 | Set checkbox correct answer UIDs |

### Serialization/Restoration
| Function | Line | Purpose |
|----------|------|---------|
| `serializeQuestionState()` | 1799 | Serialize question to state object |
| `serializeBboxGroup()` | 1965 | Serialize bbox group |
| `buildQuestionFromState()` | 1984 | Rebuild question from state |
| `restoreSectionContent()` | 2246 | Restore element from another |

### LocalStorage Keys
| Key | Purpose |
|-----|---------|
| `whatsNewVersionSeen` | Version tracking for What's New modal |
| `autoResizeEnabled` | Auto-resize preference |
| `fontSetting` | Current font size |
| `lineHeightSetting` | Current line height |
| `darkMode` | Dark mode preference |
| Form auto-save keys | (needs verification) |

---

## 3. Core Systems

### 3.1 Undo/Redo System
**Location**: Lines 29-672

| Constant/Variable | Line | Purpose |
|-------------------|------|---------|
| `formUndoHistory` | 30 | Array of undo actions |
| `formRedoHistory` | 31 | Array of redo actions |
| `MAX_HISTORY_SIZE` | 32 | Limit (100) |
| `isFormUndoRedoInProgress` | 33 | Reentrancy guard |
| `ACTION_TYPES` | 36-48 | Action type constants |

| Function | Line | Purpose |
|----------|------|---------|
| `recordFormAction()` | 51 | Record action to history |
| `updateUndoRedoButtons()` | 69 | Update button states |
| `undoAction()` | 87 | Execute undo |
| `redoAction()` | 108 | Execute redo |
| `executeUndo()` | 129 | Handle specific undo cases |
| `executeRedo()` | 365 | Handle specific redo cases |

**Action Types**:
- `ADD_ITEM` - Add section/question/choice/etc.
- `REMOVE_ITEM` - Remove item
- `DUPLICATE_ITEM` - Duplicate item
- `FIELD_CHANGE` - Field value change
- `MOVE_ITEM` - Reorder item
- `CLEAR_FORM` - Clear entire form
- `LOAD_JSON` - Load JSON data
- `PASTE` - Paste into existing element
- `PASTE_SECTION` - Paste new section
- `PASTE_QUESTION` - Paste new question
- `PASTE_BBOX` - Paste bbox values

### 3.2 AutoSize System
**Location**: Lines 5912-6192 (`AutoSizeManager` IIFE)

| Method | Purpose |
|--------|---------|
| `AutoSizeManager.refresh(rootEl)` | **CANONICAL** - Single entry point for autosize |
| `AutoSizeManager.fitHeightToContent(el)` | Size single element |
| Internal: `scheduleSettle()` | Debounced settle loop |
| Internal: `runSettle()` | Multi-pass settle until stable |

**Constants**:
- `FUDGE_PX = 8` - Sizing padding
- `MAX_SETTLE_PASSES = 12` - Max passes
- `DEBOUNCE_MS = 60` - Debounce delay

### 3.3 Preview System (PreviewBox)
**Location**: Lines 12804+ (attachPreviews) and lines ~12000-12800

| Function | Line | Purpose |
|----------|------|---------|
| `attachPreviews()` | 12804 | Attach preview boxes to textareas |
| `renderLivePreview()` | 11977 | Render markdown preview |
| `renderLivePreviewToElement()` | 6825 | Render preview to specific element |

### 3.4 BBox Validation System
| Function | Line | Purpose |
|----------|------|---------|
| `validateAndNormalizeBbox()` | 8463 | Validate bbox inputs |
| `attachBboxValidation()` | 8512, 11225 | **DUPLICATE** - Two versions exist |
| `attachBboxValidationToItem()` | 11207, 11965 | **DUPLICATE** - Two versions exist |
| `normalizeBboxCoordinates()` | 8435 | Normalize bbox coords |
| `finalizeBBoxRow()` | 11237 | Finalize bbox row |

### 3.5 Action Button System
**Location**: Lines 833-1631

| Constant | Line | Purpose |
|----------|------|---------|
| `ACTION_BUTTON_CONFIGS` | 1124 | Button presets (LIST_ITEM, SECTION, BBOX, SIMPLE, RELATIONSHIP) |
| `STATIC_BUTTON_CONFIGS` | 1346 | Static button configurations |
| `ACTION_BUTTON_CONFIGS_STATIC` | 1059 | Static action button configs |

| Function | Line | Purpose |
|----------|------|---------|
| `createButton()` | 890 | **CANONICAL** - Universal button factory |
| `buildActionButton()` | 972 | Alias for createButton |
| `renderActionButtons()` | 981 | Render multiple buttons |
| `getActionButtonHTML()` | 994 | Get button as HTML string |
| `buildActionButtonsHTML()` | 1560 | Build from config to HTML |
| `renderButtonGroup()` | 1492 | Render button group |
| `hydrateStaticButtons()` | 1511 | Initialize static buttons |
| `hydrateStaticActionButtons()` | 1097 | Initialize action buttons |
| `wireActionButtons()` | 1602 | Wire event delegation |

### 3.6 List Mutation & Numbering
| Function | Line | Purpose |
|----------|------|---------|
| `afterListMutation()` | 686 | **CANONICAL** - Hook after any list change |
| `updateNumbersForContainer()` | 676 | Dispatch to container-specific updater |
| `updateQuestionNumbers()` | 9646 | Update question numbering |
| `updateContentSectionNumbers()` | 9669 | Update section numbering |
| `afterQuestionTypeListMutation()` | (implicit) | Hook for question type changes |

---

## 4. Finalization System

### Canonical Helpers
| Function | Line | Purpose |
|----------|------|---------|
| `finalizeElement()` | 11301 | **CANONICAL** - Universal finalization |
| `postUndoRedoRestore()` | 1692 | Finalize after undo/redo restore |

### Legacy/Wrapper Helpers
| Function | Line | Purpose | Status |
|----------|------|---------|--------|
| `finalizeArrayItem()` | 11357 | Legacy wrapper → `finalizeElement` | KEEP (backwards compat) |
| `finalizeMatchingListItem()` | 699 | Matching-specific wrapper | KEEP (specialized) |
| `finalizePastedSection()` | 11253 | Paste-specific wrapper | KEEP (specialized) |
| `finalizeBBoxRow()` | 11237 | BBox-specific finalization | KEEP (specialized) |

### Finalization Options (finalizeElement)
```javascript
{
  previews: true,      // Attach preview boxes
  fonts: true,         // Apply font settings
  bbox: true,          // Attach bbox validation
  refresh: true,       // Force render previews
  autoSize: true,      // Trigger autosize
  containerId: null,   // Container for afterListMutation
  skipBulkCheck: false // Skip bulk operation check
}
```

---

## 5. Question Types & Sub-UIs

### Question Types
| Type | Value | Sub-UI |
|------|-------|--------|
| Free Form | `free_form` | Guide answer textarea |
| Multiple Choice | `multiple_choice` | Choices list with radio |
| Checkbox | `checkbox` | Choices list with checkboxes |
| Fill in Blanks | `fill_in_the_blanks` | Blank answer items |
| Matching | `matching` | Left/right items + relationships |

### Question Type Functions
| Function | Line | Purpose |
|----------|------|---------|
| `getQuestionType()` | 1761 | Get type from dataset |
| `setQuestionType()` | 1778 | Set type in dataset + select |
| `toggleQuestionType()` | 8546 | Handle type change (show/hide UIs) |

### Choices UI Functions
| Function | Line | Purpose |
|----------|------|---------|
| `addChoice()` | 8794 | Add choice item |
| `addChoiceBefore()` | 8904 | Insert choice before |
| `addChoiceAfter()` | 8918 | Insert choice after |
| `removeChoice()` | 8959 | Remove choice |
| `moveChoiceUp()` | 9421 | Move choice up |
| `moveChoiceDown()` | 9438 | Move choice down |
| `updateCorrectAnswerRadios()` | 9003 | Update MCQ radio UI |
| `updateCheckboxSummary()` | 9265 | Update checkbox summary |
| `syncChoiceUI()` | 9009 | Sync all choice UI |
| `rebuildCorrectAnswerUI()` | 9046 | Rebuild correct answer UI |
| `attachChoiceListeners()` | 9290 | Attach choice event listeners |

### Matching UI Functions
| Function | Line | Purpose |
|----------|------|---------|
| (matching functions) | ~17000+ | Add/remove/move matching items |
| `updateRelationshipUI()` | ~17000+ | Update relationship dropdowns |
| `renumberMatchingItems()` | ~17000+ | Renumber items |
| `syncMatchingUI()` | ~17000+ | Sync matching UI |
| `rebuildMatchingRelationshipUI()` | ~17000+ | Rebuild relationships |

### Fill-in-Blanks Functions
| Function | Line | Purpose |
|----------|------|---------|
| `updateBlankAnswersUI()` | ~17800 | Update blanks UI from text |
| `updateFilledBlanksPreview()` | ~17800+ | Update blanks preview |

---

## 6. Final Preview System

### Entry Point
| Function | Line | Purpose |
|----------|------|---------|
| `generateFinalPreview()` | 6323 | Generate complete final preview |

### Preview Box Builder
| Function | Line | Purpose |
|----------|------|---------|
| `buildPreviewBox()` | 6801 | **CANONICAL** - Universal preview box builder |

### Renderers
| Function | Line | Purpose |
|----------|------|---------|
| `renderQuestionPreview()` | 7067 | Render question preview |
| `renderMultipleChoicePreview()` | 7170 | Render MCQ/checkbox choices |
| `renderFillInBlanksPreview()` | 7267 | Render blanks preview |
| `renderMatchingItemPreviewBox()` | 7377 | Render single matching item |
| `renderMatchingPreview()` | 7410 | Render matching preview |
| `renderGuideAnswerPreview()` | 7563 | Render guide answer |
| `renderLivePreviewToElement()` | 6825 | Render markdown to element |

### Navigation
| Function | Line | Purpose |
|----------|------|---------|
| `navigateToInput()` | 6263 | **CANONICAL** - Navigate to input from preview |

---

## 7. Mutation Pathways

### Content Sections
| Operation | Function(s) |
|-----------|-------------|
| Add at end | `addContentSection()` |
| Insert before | `addContentSectionBefore()` |
| Insert after | `addContentSectionAfter()` |
| Duplicate | `duplicateSection()` |
| Paste into | `pasteIntoSection()` |
| Paste at end | `pasteSectionAtEnd()` |
| Remove | `removeArrayItem()` |
| Move up/down | `moveItemUp()`, `moveItemDown()` |
| Load JSON | `populateFormFromJSON()` → `populateContentSections()` |

### Questions
| Operation | Function(s) |
|-----------|-------------|
| Add at end | `addQuestion()` |
| Insert before | `addQuestionBefore()` |
| Insert after | `addQuestionAfter()` |
| Duplicate | `duplicateSection()` |
| Paste into | `pasteIntoSection()` |
| Paste at end | `pasteSectionAtEnd()` |
| Remove | `removeArrayItem()` |
| Move up/down | `moveItemUp()`, `moveItemDown()` |
| Load JSON | `populateFormFromJSON()` → `populateQuestions()` |

### Choices (nested)
| Operation | Function(s) |
|-----------|-------------|
| Add at end | `addChoice()` |
| Insert before | `addChoiceBefore()` |
| Insert after | `addChoiceAfter()` |
| Remove | `removeChoice()` |
| Move up/down | `moveChoiceUp()`, `moveChoiceDown()` |

### Lesson Standards/Terminology
| Operation | Function(s) |
|-----------|-------------|
| Add at end | `addLessonStandard()`, `addTerminology()` |
| Insert before | `addLessonStandardBefore()`, `addTerminologyBefore()` |
| Insert after | `addLessonStandardAfter()`, `addTerminologyAfter()` |
| Remove | `removeArrayItem()` |
| Move up/down | `moveItemUp()`, `moveItemDown()` |

### BBox Rows
| Operation | Function(s) |
|-----------|-------------|
| Add | `appendBBoxItem()`, `addContentImage()`, `addQuestionImage()`, `addAnswerImage()` |
| Insert before | `insertBBoxItemBefore()` |
| Insert after | `insertBBoxItemAfter()` |
| Remove | `removeArrayItem()` |
| Duplicate | `duplicateBbox()` |
| Move up/down | `moveItemUp()`, `moveItemDown()` |

---

## 8. HTML Template Generators

### Main Templates
| Function | Line | Purpose |
|----------|------|---------|
| `getContentSectionHTML()` | 11444 | Content section template |
| `getQuestionHTML()` | 11690 | Question template |
| `getQuestionHeaderFieldsHTML()` | 11501 | Question header fields |
| `getQuestionMarkdownTextareaBlockHTML()` | 11535 | Markdown textarea block |
| `getChoiceRowHTML()` | 11558 | Choice row template |
| `getBlankAnswerItemHTML()` | 11603 | Blank answer item |
| `getMatchingItemHTML()` | 11620 | Matching item template |
| `getGuideAnswerHTML()` | 11659 | Guide answer template |
| `getMarkdownButtonBarHTML()` | 10651 | Markdown toolbar |
| `getTitleMarkdownButtonBarHTML()` | 10695 | Title markdown toolbar |

### DOM Builders
| Function | Line | Purpose |
|----------|------|---------|
| `buildQuestionItem()` | 11077 | Build question DOM element |
| `buildContentSectionItem()` | 11121 | Build content section DOM |
| `buildLessonStandardArrayItem()` | 10745 | Build lesson standard item |
| `buildTerminologyArrayItem()` | 10802 | Build terminology item |
| `buildBBoxRow()` | 11196 | Build bbox row DOM |
| `getBBoxInputsHTML()` | 11149 | BBox inputs HTML |
| `getBBoxRowActionsHTML()` | 11165 | BBox actions HTML |

---

## 9. Identified Duplications

### Critical Duplications
| Item | Locations | Issue |
|------|-----------|-------|
| `attachBboxValidation()` | Lines 8512, 11225 | Two identical functions |
| `attachBboxValidationToItem()` | Lines 11207, 11965 | Two identical functions |
| `escapeHtml()` | Lines 6748, 7620, 7779 | Three identical functions |

### Button System Complexity
- `createButton()` - DOM builder
- `buildActionButton()` - Alias
- `getActionButtonHTML()` - String builder
- `buildActionButtonsHTML()` - Config-based string builder
- Multiple config objects: `ACTION_BUTTON_CONFIGS`, `STATIC_BUTTON_CONFIGS`, `ACTION_BUTTON_CONFIGS_STATIC`

### Insert Pattern Variations
| Pattern | Functions | Unified By |
|---------|-----------|------------|
| Section/Question insert | `addContentSectionBefore/After`, `addQuestionBefore/After` | `addOrInsertSection()` |
| Standards/Terminology insert | `addLessonStandardBefore/After`, `addTerminologyBefore/After` | `insertArrayItemBefore/After()` |
| BBox insert | `insertBBoxItemBefore/After` | Direct implementation |

---

## 10. Cross-Reference Map

### Finalization Call Sites
| Caller | Uses |
|--------|------|
| `addOrInsertSection()` | `finalizeElement()` |
| `addLessonStandard()` | `finalizeElement()` |
| `addTerminology()` | `finalizeElement()` |
| `insertArrayItemBefore/After()` | `finalizeArrayItem()` → `finalizeElement()` |
| `postUndoRedoRestore()` | `finalizeElement()` |
| `duplicateSection()` | `finalizeElement()` |
| `addChoice()` | `finalizeElement()` |
| `buildQuestionFromState()` | `finalizeElement()` |
| `updateBlankAnswersUI()` | `finalizeElement()` |

### Preview Refresh Call Sites
| Caller | Uses |
|--------|------|
| `finalizeElement()` | `PreviewBox.refreshAll()` + `AutoSizeManager.refresh()` |
| `toggleQuestionType()` | `attachPreviews()` + `PreviewBox.refreshAll()` |
| `showTab()` | `AutoSizeManager.refresh()` |
| `showMainTab()` | `AutoSizeManager.refresh()` |

---

## Next: See `refactor-plan.md` for the phased refactoring approach.
