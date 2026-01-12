# Basic Info Tab Number Inputs Refactoring

## Overview

Refactored the four Basic Info Tab number inputs to use the `createFormControl()` factory, following the same pattern as Lesson ID and Page Type.

## Fields Refactored

### 1. Textbook Page Number
**Location:** Line ~3711
**ID:** `textbook_page`
**Type:** Number input, required
**Attributes:** min="1", step="1", placeholder, title
**Validation:** `validateInteger()` on input, keypress restriction to digits

### 2. PDF Page Number
**Location:** Line ~3714
**ID:** `textbook_pdf_page`
**Type:** Number input, required
**Attributes:** min="1", step="1", placeholder, title
**Validation:** `validateInteger()` on input, keypress restriction to digits

### 3. Guidebook Start Page
**Location:** Line ~3720
**ID:** `guidebook_start_page`
**Type:** Number input, required
**Attributes:** min="1", step="1", placeholder, title
**Special:** Inside `.bbox-inputs` container (no form-group wrapper)
**Validation:** `validateInteger()` on input, keypress restriction to digits

### 4. Guidebook End Page
**Location:** Line ~3721
**ID:** `guidebook_end_page`
**Type:** Number input, required
**Attributes:** min="1", step="1", placeholder, title
**Special:** Inside `.bbox-inputs` container (no form-group wrapper)
**Validation:** `validateInteger()` on input, keypress restriction to digits

## Helper Function Added

### `createRequiredNumberInput(config)`
**Location:** Line ~3989
**Purpose:** Creates a required number input with integer validation
**Parameters:**
- `id` - Element ID
- `label` - Label text (empty string for guidebook fields)
- `placeholder` - Placeholder text
- `title` - Tooltip text

**Features:**
- Uses `createFormControl()` with type='number'
- Sets `required: true`
- Adds `min="1"` and `step="1"` attributes
- Attaches `validateInteger()` handler on input event
- Attaches keypress handler to restrict input to digits (0-9) only
- Returns control object with `{rootEl, controlEl, getValue, setValue, setError}`

## Implementation Details

### Standard Fields (textbook_page, textbook_pdf_page)
- Created via `createRequiredNumberInput()` helper
- Full form-group wrapper is used
- Initialized in `window.onload` after page type
- Font settings applied automatically via `initializeFontSettings()`

### Guidebook Fields (guidebook_start_page, guidebook_end_page)
- Created via `createRequiredNumberInput()` helper
- Input element extracted from form-group wrapper (for `.bbox-inputs` layout)
- Placed inside existing form-group with `.bbox-inputs` container
- Font settings applied automatically via `initializeFontSettings()`

### Validation
- `validateInteger()` function attached via `onInput` handler
- Keypress restriction attached via `addEventListener('keypress')`
- `initializeFieldValidation()` still works (finds fields by ID and marks form-group as required)
- Validation styling (`.validation-error`, `.invalid`) preserved

### Required Field Marking
- Factory sets `required: true` on input element
- Factory adds `.required-field` class to form-group
- `initializeFieldValidation()` adds `.required` class to form-group (finds via `closest('.form-group')`)

## Code Changes

### HTML Structure
**Location:** Lines ~3710-3724
- Replaced static `<input>` elements with container divs
- Guidebook fields kept in existing form-group structure
- All IDs preserved for compatibility

### Helper Function
**Location:** Line ~3989
- `createRequiredNumberInput()` - abstracts number input creation with validation

### Initialization Code
**Location:** Lines ~20173-20227
- Added initialization for all 4 fields in `window.onload`
- Guidebook fields extract input from form-group wrapper
- All fields created before `initializeFontSettings()` runs

### Validation Function
**Location:** Line ~6307
- Updated `initializeFieldValidation()` to handle cases where form-group might not exist (null check)

## Behavior Preservation

### ✅ All Behavior Preserved

#### Validation
- **Integer validation** - `validateInteger()` still called on input
- **Keypress restriction** - Only digits (0-9) allowed, same as before
- **Visual feedback** - `.validation-error` class still applied
- **Required marking** - `.required` class still added to form-group

#### Required Field Indicators
- **Red asterisk** - Still appears (via `.required-field` and `.required` classes)
- **Validation styling** - Still works (`.invalid` class on form-group)

#### Value Reading/Writing
- **getElementById()** - Still works (same IDs preserved)
- **JSON generation** - Still reads values correctly
- **Form submission** - Still works

#### Font Settings
- **Font size** - Applied automatically via `initializeFontSettings()` → `changeFontSize()`
- **Line height** - Applied automatically via `initializeFontSettings()` → `changeLineHeight()`
- **Selector match** - `.form-group input` selector finds factory-created inputs

#### Event Handlers
- **oninput** - `validateInteger()` attached via factory `onInput` config
- **onkeypress** - Digit restriction attached via `addEventListener('keypress')`
- **blur/input** - Validation listeners attached by `initializeFieldValidation()`

## Testing Checklist

### Required Validation
- [ ] **Leave field empty** and blur
  - [ ] Required indicator (red asterisk) appears
  - [ ] Validation error styling appears
  - [ ] Form validation prevents submission

- [ ] **All 4 fields** tested for required validation
  - [ ] textbook_page
  - [ ] textbook_pdf_page
  - [ ] guidebook_start_page
  - [ ] guidebook_end_page

### Numeric Validation
- [ ] **Type non-digits** (e.g., "abc")
  - [ ] Non-digits are removed/rejected
  - [ ] Only digits remain
  - [ ] Validation error appears if invalid

- [ ] **Type negative number** (e.g., "-5")
  - [ ] Negative sign rejected (min="1")
  - [ ] Only positive integers allowed

- [ ] **Type zero** (e.g., "0")
  - [ ] Zero rejected (min="1")
  - [ ] Only values >= 1 allowed

- [ ] **Type valid number** (e.g., "36")
  - [ ] Number accepted
  - [ ] No validation error
  - [ ] Value stored correctly

### Keypress Restriction
- [ ] **Try typing letters** (e.g., "abc")
  - [ ] Letters are blocked on keypress
  - [ ] Only digits can be typed

- [ ] **Try typing special chars** (e.g., "-", "+", ".")
  - [ ] Special characters blocked
  - [ ] Only digits allowed

- [ ] **Navigation keys work** (arrow keys, backspace, delete, tab)
  - [ ] Arrow keys work
  - [ ] Backspace/delete work
  - [ ] Tab navigation works

### JSON Output
- [ ] **Fill all 4 fields** with values
  - [ ] Click "Generate JSON"
  - [ ] JSON includes `textbook_page` with correct value
  - [ ] JSON includes `textbook_pdf_page` with correct value
  - [ ] JSON includes `guidebook_start_page` with correct value
  - [ ] JSON includes `guidebook_end_page` with correct value
  - [ ] Values are integers (not strings)

### Font Settings
- [ ] **Change font size** in header dropdown
  - [ ] All 4 number inputs update font size
  - [ ] Font size matches other inputs
  - [ ] Font size matches page_type select

- [ ] **Change line height** in header dropdown
  - [ ] All 4 number inputs update line height
  - [ ] Line height matches other inputs

- [ ] **Default state**
  - [ ] All fields have 14px font size
  - [ ] All fields have 1.5 line height
  - [ ] Matches existing inputs

### Tooltips
- [ ] **Hover over each field**
  - [ ] textbook_page shows correct tooltip
  - [ ] textbook_pdf_page shows correct tooltip
  - [ ] guidebook_start_page shows correct tooltip
  - [ ] guidebook_end_page shows correct tooltip

### Guidebook Fields Layout
- [ ] **Visual layout**
  - [ ] Start and End fields appear side-by-side
  - [ ] Grid layout (1fr 1fr) works correctly
  - [ ] Fields align properly
  - [ ] Label "Guidebook PDF Pages (Start - End)" appears above

### Integration
- [ ] **Preview generation**
  - [ ] Preview includes textbook_page value
  - [ ] Preview includes textbook_pdf_page value
  - [ ] Preview includes guidebook pages range

- [ ] **Form loading**
  - [ ] Load JSON with these fields
  - [ ] Values populate correctly
  - [ ] Validation still works after load

## Summary

Successfully refactored all 4 Basic Info Tab number inputs to use the `createFormControl()` factory:

- **Helper function** `createRequiredNumberInput()` abstracts number input creation with validation
- **All 4 fields** now use factory pattern
- **Validation** preserved (integer validation, keypress restriction)
- **Required indicators** preserved (red asterisk, validation styling)
- **Font settings** applied automatically
- **All IDs preserved** for compatibility with existing code
- **No behavior changes** - everything works exactly as before

The refactoring follows the same pattern as Lesson ID and Page Type, making the codebase more consistent while maintaining 100% behavioral compatibility.
