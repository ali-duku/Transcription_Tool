import { useCallback, useMemo, useState } from "react";
import { normalizeRect, type Rect } from "./bboxDrawGeometry";
import { hasAnyBoxes, type PageBboxMap } from "./bboxDrawModalHelpers";

type PageSelectedMap = Record<number, number | null>;

export function useBboxSavedSelections(page: number) {
  const [pageBoxes, setPageBoxes] = useState<PageBboxMap>({});
  const [selectedIndices, setSelectedIndices] = useState<PageSelectedMap>({});

  const activePageBoxes = pageBoxes[page] ?? [];
  const activeSelectedIndex = selectedIndices[page] ?? null;
  const selectedRect = activeSelectedIndex == null ? null : activePageBoxes[activeSelectedIndex] ?? null;
  const hasSavedBoxes = useMemo(() => hasAnyBoxes(pageBoxes), [pageBoxes]);

  const resetSelections = useCallback(() => {
    setPageBoxes({});
    setSelectedIndices({});
  }, []);

  const clearCurrentPage = useCallback(() => {
    setPageBoxes((current) => {
      if (!current[page] || current[page].length === 0) {
        return current;
      }
      const copy = { ...current };
      delete copy[page];
      return copy;
    });
    setSelectedIndices((current) => ({ ...current, [page]: null }));
  }, [page]);

  const addCurrentRect = useCallback((rect: Rect) => {
    const normalized = normalizeRect(rect);
    setPageBoxes((current) => {
      const existing = current[page] ?? [];
      const nextIndex = existing.length;
      setSelectedIndices((selection) => ({ ...selection, [page]: nextIndex }));
      return {
        ...current,
        [page]: [...existing, normalized]
      };
    });
  }, [page]);

  const selectSavedBox = useCallback((index: number) => {
    setSelectedIndices((current) => ({ ...current, [page]: index }));
    return pageBoxes[page]?.[index] ?? null;
  }, [page, pageBoxes]);

  return {
    pageBoxes,
    selectedIndices,
    activePageBoxes,
    activeSelectedIndex,
    selectedRect,
    hasSavedBoxes,
    resetSelections,
    clearCurrentPage,
    addCurrentRect,
    selectSavedBox
  };
}
