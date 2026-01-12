# Terminology Preview Font Settings Fix

## Root Cause

The preview font doesn't match because `applyFontSettings(newItem)` was called in `buildTerminologyArrayItem()` **before** the preview element was created. The preview is created by `attachPreviews(newItem)` which happens after DOM insertion, so when font settings were applied, the preview didn't exist yet and missed the font styling.

## Solution

Moved `applyFontSettings(newItem)` calls to **after** `attachPreviews(newItem)` in all three terminology functions. This ensures:

1. Preview element is created first (by `attachPreviews()`)
2. Font settings are then applied (by `applyFontSettings()`)
3. The `.live-preview` selector in `applyFontSettings()` finds the preview and applies font size/line-height

## Code Changes

### 1. `buildTerminologyArrayItem()` helper
**Location:** Line ~8577
**Change:** Removed `applyFontSettings(newItem)` call (moved to after preview creation)
**Note:** Updated comment to clarify both `attachPreviews()` and `applyFontSettings()` must be called after DOM insertion

### 2. `addTerminology()` function
**Location:** Line ~8611
**Change:** Added `applyFontSettings(newItem);` after `attachPreviews(newItem);`

### 3. `addTerminologyBefore(button)` function
**Location:** Line ~8673
**Change:** Added `applyFontSettings(newItem);` after `attachPreviews(newItem);`

### 4. `addTerminologyAfter(button)` function
**Location:** Line ~8698
**Change:** Added `applyFontSettings(newItem);` after `attachPreviews(newItem);`

## How Font Settings Are Applied

The `applyFontSettings()` function (line ~11240) already includes `.live-preview` in its selector:

```javascript
// Apply to all preview boxes in scope
scope.querySelectorAll('.live-preview').forEach(el => {
    el.style.fontSize = fontSize;
    el.style.lineHeight = lineHeight;
});
```

So when `applyFontSettings(newItem)` is called after the preview is created, it finds the `.live-preview` element within `newItem` and applies the font settings.

Similarly, `changeFontSize()` and `changeLineHeight()` also include `.live-preview` in their selectors (lines 11300 and 11329), so they will update terminology previews when font settings change globally.

## Where Font Settings Are Guaranteed

Font settings are now applied to previews in all three add flows:
- ✅ **Add Term** - `applyFontSettings(newItem)` called after `attachPreviews(newItem)` in `addTerminology()`
- ✅ **Before** - `applyFontSettings(newItem)` called after `attachPreviews(newItem)` in `addTerminologyBefore()`
- ✅ **After** - `applyFontSettings(newItem)` called after `attachPreviews(newItem)` in `addTerminologyAfter()`

All calls happen **after** the preview element is created, ensuring the `.live-preview` selector finds it and applies font settings.

## Testing Checklist

### Font Size Matching
- [ ] **Change font size in header dropdown** (e.g., to 16px)
  - [ ] Terminology input font size updates
  - [ ] Terminology preview font size updates
  - [ ] Both match each other
  - [ ] Both match other inputs/previews in the tool

- [ ] **Add new terminology term**
  - [ ] Input font size matches current setting
  - [ ] Preview font size matches current setting
  - [ ] Both match immediately (no refresh needed)

### Line Height Matching
- [ ] **Change line height in header dropdown** (e.g., to 1.8)
  - [ ] Terminology input line height updates
  - [ ] Terminology preview line height updates
  - [ ] Both match each other
  - [ ] Both match other inputs/previews in the tool

- [ ] **Add new terminology term**
  - [ ] Input line height matches current setting
  - [ ] Preview line height matches current setting
  - [ ] Both match immediately (no refresh needed)

### Default State
- [ ] **On page load**
  - [ ] Existing terminology inputs have default font (14px, 1.5)
  - [ ] Existing terminology previews have default font (14px, 1.5)
  - [ ] Newly added terms match default font

### All Add Methods
- [ ] **Add Term** - preview font matches input
- [ ] **Before** - preview font matches input
- [ ] **After** - preview font matches input

### Other Functionality (Should Still Work)
- [ ] **Preview updates** still work when typing
- [ ] **Markdown rendering** still works
- [ ] **RTL direction** still correct
- [ ] **Undo/Redo** still works
- [ ] **Remove/Reorder** still works

## Summary

Fixed the preview font mismatch by ensuring `applyFontSettings(newItem)` is called **after** `attachPreviews(newItem)` in all three terminology creation paths. The preview system now correctly inherits font size and line-height settings, matching the input and other previews in the tool.
