import { MainTabBar } from "../../../../features/shell/components/MainTabBar";
import { SubTabBar } from "../../../../features/shell/components/SubTabBar";
import { FinalPreviewPanel } from "../../../../features/preview/components/FinalPreviewPanel";
import { INPUT_SUB_TABS, MAIN_TABS } from "../../../../features/shell/state/shellConfig";
import type { TranscriptionDocumentState } from "../../../../features/shell/state/documentReducer";
import type { InputScrollTarget, InputSubTabKey, MainTabKey } from "../../../../shared/types/navigation";
import { InputSubTabContent } from "../InputSubTabContent";

interface MainShellWorkspaceProps {
  activeMainTab: MainTabKey;
  activeInputSubTab: InputSubTabKey;
  document: TranscriptionDocumentState;
  onMainTabChange: (tab: MainTabKey) => void;
  onInputSubTabChange: (subTab: InputSubTabKey) => void;
  onPreviewNavigateToInput: (target: InputScrollTarget) => void;
}

export function MainShellWorkspace({
  activeMainTab,
  activeInputSubTab,
  document,
  onMainTabChange,
  onInputSubTabChange,
  onPreviewNavigateToInput
}: MainShellWorkspaceProps) {
  return (
    <>
      <MainTabBar tabs={MAIN_TABS} activeTab={activeMainTab} onTabChange={onMainTabChange} />

      {activeMainTab === "input-form" ? (
        <div className="input-form-area">
          <SubTabBar tabs={INPUT_SUB_TABS} activeTab={activeInputSubTab} onTabChange={onInputSubTabChange} />
          <div className="tab-content-panel" id="input-form-scroll-panel">
            <InputSubTabContent subTab={activeInputSubTab} />
          </div>
        </div>
      ) : (
        <div className="tab-content-panel" id="final-preview-scroll-panel">
          <FinalPreviewPanel document={document} onNavigateToInput={onPreviewNavigateToInput} />
        </div>
      )}
    </>
  );
}
