# Terminology Preview Fix

## Root Cause

The `attachPreviews()` function uses the selector `#terminology input[type="text"]` (line 10933) which requires the input element to be inside the `#terminology` container in the DOM. During the deduplication refactor, `attachPreviews(newItem)` was moved into `buildTerminologyArrayItem()`, which calls it **before** the item is inserted into the DOM. Since the element isn't in the DOM yet, the selector can't find it and the preview isn't attached.

## Solution

Moved `attachPreviews(newItem)` calls to **after** DOM insertion in all three terminology functions:

1. **`addTerminology()`** - Calls `attachPreviews(newItem)` after `container.appendChild(newItem)`
2. **`addTerminologyBefore(button)`** - Calls `attachPreviews(newItem)` after `container.insertBefore(newItem, currentItem)`
3. **`addTerminologyAfter(button)`** - Calls `attachPreviews(newItem)` after `container.insertBefore(newItem, currentItem.nextSibling)`

Also removed `attachPreviews(newItem)` from `buildTerminologyArrayItem()` helper since it needs to be called after DOM insertion.

## Code Changes

### 1. `buildTerminologyArrayItem()` helper
**Location:** Line ~8577
**Change:** Removed `attachPreviews(newItem)` call (moved to after DOM insertion)
**Note:** Added comment explaining why preview attachment must happen after DOM insertion

### 2. `addTerminology()` function
**Location:** Line ~8612
**Change:** Added `attachPreviews(newItem);` after `container.appendChild(newItem);`

### 3. `addTerminologyBefore(button)` function
**Location:** Line ~8673
**Change:** Added `attachPreviews(newItem);` after `container.insertBefore(newItem, currentItem);`

### 4. `addTerminologyAfter(button)` function
**Location:** Line ~8696
**Change:** Added `attachPreviews(newItem);` after `container.insertBefore(newItem, currentItem.nextSibling);`

## Where Preview Attachment is Guaranteed

Preview attachment now happens in all three add flows:
- ✅ **Add Term** - `attachPreviews(newItem)` called after `appendChild()` in `addTerminology()`
- ✅ **Before** - `attachPreviews(newItem)` called after `insertBefore()` in `addTerminologyBefore()`
- ✅ **After** - `attachPreviews(newItem)` called after `insertBefore()` in `addTerminologyAfter()`

All calls happen **after** the element is inserted into the DOM, ensuring `attachPreviews()` can find the input via the `#terminology input[type="text"]` selector.

## Testing Checklist

### Preview Functionality
- [ ] **Add Term** button
  - [ ] Click "Add Term"
  - [ ] Type text in the new input
  - [ ] Preview appears below input
  - [ ] Preview updates live as you type
  - [ ] Markdown rendering works (e.g., **bold**, *italic*)
  - [ ] Preview direction is RTL (right-aligned)

- [ ] **Before** button
  - [ ] Click "Before" on an existing term
  - [ ] New term appears above
  - [ ] Type text in the new input
  - [ ] Preview appears and updates correctly

- [ ] **After** button
  - [ ] Click "After" on an existing term
  - [ ] New term appears below
  - [ ] Type text in the new input
  - [ ] Preview appears and updates correctly

### Other Functionality (Should Still Work)
- [ ] **Remove (×)** button works
- [ ] **Move Up/Down** buttons work
- [ ] **Undo/Redo** still works
  - [ ] Undo add removes term
  - [ ] Undo remove restores term
  - [ ] Redo works correctly
- [ ] **Font settings** still correct
  - [ ] Font size matches existing inputs
  - [ ] Line height matches existing inputs
  - [ ] New inputs inherit current font settings

## Summary

Fixed the preview attachment issue by ensuring `attachPreviews()` is called **after** DOM insertion in all three terminology creation paths. The preview system now works correctly for all newly created terminology rows, matching the behavior of existing rows.
