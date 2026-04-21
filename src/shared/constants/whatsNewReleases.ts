import type { AppIconName } from "../ui/AppIcon";

export type WhatsNewTone = "success" | "danger" | "info" | "warning";

export interface WhatsNewSection {
  key: string;
  title: string;
  icon: AppIconName;
  tone: WhatsNewTone;
  items: string[];
}

export interface WhatsNewRelease {
  version: string;
  sections: WhatsNewSection[];
}

export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
  {
    version: "8.3",
    sections: [
      {
        key: "enhancements",
        title: "Enhancements",
        icon: "arrowUp",
        tone: "success",
        items: ["Better font support on Mac for more consistent readability."]
      },
      {
        key: "bug_fixes",
        title: "Bug Fixes",
        icon: "warning",
        tone: "danger",
        items: [
          "Nested block quotes now render correctly in preview.",
          "Trailing/leading space warning text is now readable in Dark Mode."
        ]
      }
    ]
  },
  {
    version: "8.2",
    sections: [
      {
        key: "enhancements",
        title: "Enhancements",
        icon: "arrowUp",
        tone: "success",
        items: [
          "Theme toggle and full dual-theme support were added, with persisted theme preference."
        ]
      }
    ]
  },
  {
    version: "8.1",
    sections: [
      {
        key: "bug_fixes",
        title: "Bug Fixes",
        icon: "warning",
        tone: "danger",
        items: [
          "Image references correctly support multi-digit indices (e.g. `![description](10)`).",
          "Structural image controls no longer shift left-panel scroll position.",
          "Numbered markdown lists now render inline formatting correctly."
        ]
      }
    ]
  },
  {
    version: "8.0",
    sections: [
      {
        key: "changes",
        title: "Changes",
        icon: "info",
        tone: "info",
        items: [
          "Question schema cleanup removed obsolete fields and simplified guide-answer handling for type-specific flows.",
          "Book Metadata and Unit Preamble tabs were added to input, quick jump, output, and final preview.",
          "Lesson Preamble includes Lesson Title Translation for bilingual workflows."
        ]
      },
      {
        key: "bug_fixes",
        title: "Bug Fixes",
        icon: "warning",
        tone: "danger",
        items: [
          "Clear Form now refreshes Final Preview immediately.",
          "Quick Jump and Final Preview edit navigation now lands reliably after tab transitions."
        ]
      }
    ]
  }
];

export function latestWhatsNewVersion(): string {
  return WHATS_NEW_RELEASES[0]?.version ?? "";
}
