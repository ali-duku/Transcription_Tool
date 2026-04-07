import { ContentSectionsPanel } from "../../../../features/contentSections/components/ContentSectionsPanel";
import { QuestionsPanel } from "../../../../features/questions/components/QuestionsPanel";
import { BasicInfoSection } from "../../../../features/shell/components/BasicInfoSection";
import { BookMetadataSection } from "../../../../features/shell/components/BookMetadataSection";
import { LessonPreambleSection } from "../../../../features/shell/components/LessonPreambleSection";
import { UnitPreambleSection } from "../../../../features/shell/components/UnitPreambleSection";
import { INPUT_SUB_TABS } from "../../../../features/shell/state/shellConfig";
import type { InputSubTabKey } from "../../../../shared/types/navigation";
import "./InputSubTabContent.css";

interface InputSubTabContentProps {
  subTab: InputSubTabKey;
}

export function InputSubTabContent({ subTab }: InputSubTabContentProps) {
  if (subTab === "book_metadata") return <BookMetadataSection />;
  if (subTab === "unit_preamble") return <UnitPreambleSection />;
  if (subTab === "preamble") return <LessonPreambleSection />;
  if (subTab === "basic") return <BasicInfoSection />;
  if (subTab === "content") return <ContentSectionsPanel />;
  if (subTab === "questions") return <QuestionsPanel />;

  const tabTitle = INPUT_SUB_TABS.find((tab) => tab.key === subTab)?.label ?? "Unknown";
  return (
    <>
      <h2>{tabTitle}</h2>
      <p>
        This section is scaffolded for parity migration. Field-level controls and behavior will be
        ported in Phase 5.
      </p>
    </>
  );
}
