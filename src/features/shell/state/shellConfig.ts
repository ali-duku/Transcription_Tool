import type {
  InputSubTabDefinition,
  InputSubTabKey,
  MainTabDefinition,
  MainTabKey,
  SidePanelKey
} from "../../../shared/types/navigation";

export const DEFAULT_MAIN_TAB: MainTabKey = "input-form";
export const DEFAULT_INPUT_SUBTAB: InputSubTabKey = "basic";
export const DEFAULT_SIDE_PANEL: SidePanelKey = "json-preview";

export const MAIN_TABS: readonly MainTabDefinition[] = [
  {
    key: "input-form",
    buttonId: "main-tab-input",
    label: "Input Form",
    title: "Edit the form data"
  },
  {
    key: "final-preview",
    buttonId: "main-tab-preview",
    label: "Final Preview",
    title: "Preview all sections and questions"
  }
] as const;

export const INPUT_SUB_TABS: readonly InputSubTabDefinition[] = [
  {
    key: "book_metadata",
    label: "Book Metadata",
    title: "Book title-page metadata"
  },
  {
    key: "unit_preamble",
    label: "Unit Preamble",
    title: "Unit opening-page metadata (ID, title, title translation, text)"
  },
  {
    key: "preamble",
    label: "Lesson Preamble",
    title: "Lesson metadata (ID, title, standards, terminology)"
  },
  {
    key: "basic",
    label: "Basic Info",
    title: "Basic page information (page numbers, page type)"
  },
  {
    key: "content",
    label: "Content",
    title: "Instructional content sections"
  },
  {
    key: "questions",
    label: "Questions",
    title: "Practice questions"
  }
] as const;
