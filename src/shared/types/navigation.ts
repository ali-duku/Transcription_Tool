export type MainTabKey = "input-form" | "final-preview";

export type InputSubTabKey =
  | "book_metadata"
  | "unit_preamble"
  | "preamble"
  | "basic"
  | "content"
  | "questions";

export type SidePanelKey = "json-preview" | "pdf-viewer";

export interface MainTabDefinition {
  key: MainTabKey;
  buttonId: string;
  label: string;
  title: string;
}

export interface InputSubTabDefinition {
  key: InputSubTabKey;
  label: string;
  title: string;
}

export interface InputScrollTarget {
  subTab: InputSubTabKey;
  fieldSelector?: string;
  questionIndex?: number;
  contentIndex?: number;
}
