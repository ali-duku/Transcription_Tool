# Font Size Fix for Dynamically Added Lesson Standards

## Root Cause

Dynamically created Lesson Standards inputs (via `addLessonStandard()`, `addLessonStandardBefore()`, `addLessonStandardAfter()`) were not receiving font settings because:

1. **Font settings are applied on page load** via `initializeFontSettings()` which calls `changeFontSize()` and `changeLineHeight()`
2. **Newly created DOM nodes** are not automatically included in these global font application calls
3. **The functions didn't call `applyFontSettings()`** after inserting the new input into the DOM

Additionally, `applyFontSettings(container)` only matched inputs inside `.form-group` elements, but lesson standard inputs are directly inside `.array-item` (not in a form-group), so even if called, it wouldn't find them.

## Solution

### 1. Enhanced `applyFontSettings()` Function
**Location:** Line 11325

**Change:** Added logic to handle inputs directly in the container (not in form-group) when a container is passed:

```javascript
// If a container is passed, also apply to inputs/selects directly in that container
// (for cases like array-item inputs that aren't in form-group)
if (container && container !== document) {
    container.querySelectorAll('input, textarea, select').forEach(el => {
        // Exclude search bar and JSON input from font settings
        if (el.id === 'searchFilter' || el.id === 'json_input') {
            return; // Skip these elements
        }
        // Only apply if not already handled by form-group selector above
        if (!el.closest('.form-group')) {
            el.style.fontSize = fontSize;
            el.style.lineHeight = lineHeight;
        }
    });
}
```

This ensures that when `applyFontSettings(newItem)` is called with an array-item container, it will find and apply font settings to inputs directly in that container.

### 2. Added Font Settings Calls
**Functions Updated:**
- `addLessonStandard()` - Line ~8545
- `addLessonStandardBefore()` - Line ~8640  
- `addLessonStandardAfter()` - Line ~8693

**Change:** Added `applyFontSettings(newItem);` after inserting the new input into the DOM, right after setting the `dir` attribute.

## Why This Works

1. **Uses existing font system** - No duplicate logic, uses `applyFontSettings()` function
2. **Minimal change** - Only enhanced the existing function to handle edge case, then added one line to each function
3. **Follows existing pattern** - Same pattern as `addTerminology()` which already calls `applyFontSettings(newItem)`
4. **No global behavior change** - When called without a container (or with `document`), behavior is unchanged
5. **Efficient** - Only processes inputs in the passed container, not the entire document

## Verification Checklist

### Visual Comparison
- [ ] **Add a new standard** using "Add Standard" button
  - [ ] New input font size matches existing standards
  - [ ] New input line height matches existing standards
  - [ ] Font size is consistent across all standards

- [ ] **Add standard before** using "Before" button
  - [ ] New input font size matches adjacent standards
  - [ ] Font size is consistent

- [ ] **Add standard after** using "After" button
  - [ ] New input font size matches adjacent standards
  - [ ] Font size is consistent

### Font Size Changes
- [ ] Change font size in header dropdown (e.g., to 16px)
- [ ] Add a new standard
- [ ] Verify new standard uses 16px (current setting)
- [ ] Verify existing standards also use 16px
- [ ] All should match

### Line Height Changes
- [ ] Change line height in header dropdown (e.g., to 1.8)
- [ ] Add a new standard
- [ ] Verify new standard uses line-height 1.8 (current setting)
- [ ] Verify existing standards also use 1.8
- [ ] All should match

### Default State
- [ ] On page load, all standards (existing and any added) should have `font-size: 14px` and `line-height: 1.5`
- [ ] Add a new standard - should match default settings

## Code Changes Summary

**Files Changed:** `index.html`

**Functions Modified:**
1. `applyFontSettings(container)` - Enhanced to handle inputs not in form-group
2. `addLessonStandard()` - Added `applyFontSettings(newItem)` call
3. `addLessonStandardBefore()` - Added `applyFontSettings(newItem)` call
4. `addLessonStandardAfter()` - Added `applyFontSettings(newItem)` call

**Lines Changed:**
- Line ~11325: Enhanced `applyFontSettings()` function
- Line ~8545: Added font settings call in `addLessonStandard()`
- Line ~8640: Added font settings call in `addLessonStandardBefore()`
- Line ~8693: Added font settings call in `addLessonStandardAfter()`

**Change Type:** Minimal enhancement to existing function + three function calls

**Impact:** Newly created lesson standard inputs now immediately receive current font settings, matching existing inputs exactly.
