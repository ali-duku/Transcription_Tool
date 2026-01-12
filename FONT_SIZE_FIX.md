# Font Size Fix for Factory-Created Controls

## Problem

Factory-created form controls (`lesson_id`, `page_type`, `lesson_standards`) had different font-size than legacy inputs because the font settings functions used selectors that didn't include `select` elements and all `input` types.

## Root Cause

### CSS Rule (Source of Truth)
**Location:** Line 1153
```css
.form-group input, .form-group textarea, .form-group select {
    font-size: 14px;
    line-height: 1.5;
    ...
}
```

### JavaScript Font Settings Functions
The following functions apply inline styles based on user preferences (from localStorage):
- `applyFontSettings(container)` - Line 11310
- `changeFontSize(size)` - Line 11336
- `changeLineHeight(height)` - Line 11364

**Original selectors (BROKEN):**
```javascript
'.form-group textarea, .form-group input[type="text"], textarea, input[type="text"]'
```

**Issues:**
1. Missing `select` elements - so `page_type` dropdown wasn't getting font settings
2. Only matching `input[type="text"]` - missing `input[type="number"]` and other types
3. Not matching the CSS rule which applies to ALL `.form-group input` elements

## Solution

Updated all three functions to use selectors that **exactly match the CSS rule**:

**Fixed selectors:**
```javascript
'.form-group input, .form-group textarea, .form-group select'
```

This ensures:
- ✅ All input types are included (text, number, etc.)
- ✅ Select elements are included
- ✅ Matches the CSS rule exactly
- ✅ Factory-created controls inherit correctly (they're inside `.form-group`)

## Changes Made

### 1. `applyFontSettings()` function
**Location:** Line 11310
- Updated selector to match CSS rule
- Now includes all `.form-group input` types and `.form-group select`

### 2. `changeFontSize()` function
**Location:** Line 11336
- Updated selector to match CSS rule
- Now includes all `.form-group input` types and `.form-group select`

### 3. `changeLineHeight()` function
**Location:** Line 11364
- Updated selector to match CSS rule
- Now includes all `.form-group input` types and `.form-group select`

## Why This Works

1. **Factory-created controls** are wrapped in `.form-group` divs (line 3998-3999 in factory)
2. **CSS rule** applies `font-size: 14px` and `line-height: 1.5` to all `.form-group input/textarea/select`
3. **JavaScript functions** now apply inline styles to the same selectors, overriding CSS when user changes font settings
4. **Both legacy and factory controls** use the same selectors, so they get identical styling

## Testing Checklist

### Visual Comparison
- [ ] **Lesson ID field** (factory-created) vs **Lesson Title field** (legacy)
  - [ ] Font size matches exactly
  - [ ] Line height matches exactly
  - [ ] Both respond to font size changes in header

- [ ] **Page Type dropdown** (factory-created) vs **other select dropdowns** (if any)
  - [ ] Font size matches exactly
  - [ ] Both respond to font size changes in header

- [ ] **Lesson Standards inputs** (factory-created) vs **Terminology inputs** (legacy)
  - [ ] Font size matches exactly
  - [ ] Line height matches exactly
  - [ ] Both respond to font size changes in header

### Font Size Changes
- [ ] Change font size in header dropdown
- [ ] Verify factory-created controls update: `lesson_id`, `page_type`, `lesson_standards`
- [ ] Verify legacy controls still update correctly
- [ ] Verify all controls match each other

### Line Height Changes
- [ ] Change line height in header dropdown
- [ ] Verify factory-created controls update
- [ ] Verify legacy controls still update correctly
- [ ] Verify all controls match each other

### Default State
- [ ] On page load, all controls should have `font-size: 14px` and `line-height: 1.5`
- [ ] Factory-created and legacy controls should be identical

## Minimal Diff Summary

**Files Changed:** `index.html`

**Lines Changed:**
- Line ~11320: `applyFontSettings()` selector
- Line ~11342: `changeFontSize()` selector  
- Line ~11370: `changeLineHeight()` selector

**Change Type:** Selector update only - no behavior changes, no new code, just fixing selectors to match CSS rule.

**Impact:** Factory-created controls now receive font settings, matching legacy controls exactly.
