export const QUESTION_KEY_ALIASES = {
  question: ["question_text"],
  setup_text: ["set_up_text"]
} as const;

export const DEPRECATED_QUESTION_FIELDS = ["related_question"] as const;

export const LEGACY_TYPE_FIELDS = [
  "choices",
  "value",
  "values",
  "left",
  "right",
  "relationship"
] as const;

export type LegacyTypeField = (typeof LEGACY_TYPE_FIELDS)[number];
