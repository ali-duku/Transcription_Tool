import { useMemo, useState } from "react";
import { normalizeQuestionKeysOnLoad } from "../../../../domain/migration/normalizeIncoming";
import { formatJsonWithCompactArrays, generateJsonPayload } from "../../../../domain/serializers/generateJson";
import { parseIncomingJsonOrPythonDict } from "../../../../features/persistence/services/jsonImportService";
import { clearSavedData, restoreLatest, saveProgress } from "../../../../features/persistence/services/saveRestoreService";
import { MainTabBar } from "../../../../features/shell/components/MainTabBar";
import { SubTabBar } from "../../../../features/shell/components/SubTabBar";
import { ShellLayout } from "../../../../features/shell/components/ShellLayout/ShellLayout";
import { normalizeLoadedDocumentState } from "../../../../features/shell/state/documentReducer";
import { useDocumentStore } from "../../../../features/shell/state/documentStore";
import { DEFAULT_INPUT_SUBTAB, DEFAULT_MAIN_TAB, DEFAULT_SIDE_PANEL, INPUT_SUB_TABS, MAIN_TABS } from "../../../../features/shell/state/shellConfig";
import { validateDocumentForGenerate, validateDocumentForSave } from "../../../../features/validation/validators/documentValidation";
import { mapValidationMessageToSubTab, resolveInputTargetFromValidationMessage } from "../../../../features/validation/utils/validationMessageNavigation";
import { FinalPreviewPanel } from "../../../../features/preview/components/FinalPreviewPanel";
import { APP_VERSION } from "../../../../shared/constants/appConstants";
import type { InputScrollTarget, InputSubTabKey, SidePanelKey } from "../../../../shared/types/navigation";
import { InputSubTabContent } from "../InputSubTabContent";
import { MainShellSidePanel } from "../MainShellSidePanel";
import { MainShellTopBar, type QuickJumpKey } from "../MainShellTopBar";
import { scrollToInputTarget } from "./mainShellValidationNavigation";
import "./MainShell.css";

export function MainShell() {
  const {
    history,
    persistence,
    dispatchPersistence,
    applyDocumentAction,
    undo,
    redo,
    resetHistory
  } = useDocumentStore();
  const [activeMainTab, setActiveMainTab] = useState(DEFAULT_MAIN_TAB);
  const [activeInputSubTab, setActiveInputSubTab] = useState(DEFAULT_INPUT_SUBTAB);
  const [activeSidePanel, setActiveSidePanel] = useState<SidePanelKey>(DEFAULT_SIDE_PANEL);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonStatus, setJsonStatus] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const quickJumpOptions = useMemo(
    () => [
      ...INPUT_SUB_TABS.map((tab) => ({ key: tab.key as QuickJumpKey, label: tab.label })),
      { key: "final-preview" as const, label: "Final Preview" }
    ],
    []
  );

  const saveIndicatorLabel = useMemo(() => {
    if (persistence.saveIndicatorStatus === "unsaved") return "Unsaved changes";
    if (persistence.saveIndicatorStatus === "saving") return "Saving...";
    if (persistence.saveIndicatorStatus === "saved") return "All saved";
    return "No changes";
  }, [persistence.saveIndicatorStatus]);

  function syncValidationState(errors: string[], warnings: string[]) {
    setValidationErrors(errors);
    setValidationWarnings(warnings);
    dispatchPersistence({ type: "set_validation_errors", errors });
    dispatchPersistence({ type: "set_validation_warnings", warnings });
    if (warnings.length > 0) {
      dispatchPersistence({ type: "set_validation_warning_time", timestamp: Date.now() });
    }
  }

  function handleManualSave() {
    const validation = validateDocumentForSave(history.present);
    syncValidationState(validation.errors, validation.warnings);

    dispatchPersistence({ type: "start_save" });
    const result = saveProgress(history.present, validation, { isAutoSave: false });
    if (result.ok) {
      dispatchPersistence({ type: "save_success", raw: result.raw });
      if (validation.errors.length > 0 || validation.warnings.length > 0) {
        setJsonStatus(
          `Saved with ${validation.errors.length} error(s) and ${validation.warnings.length} warning(s).`
        );
      } else {
        setJsonStatus("Saved successfully.");
      }
      return;
    }
    dispatchPersistence({ type: "save_failed" });
    setJsonStatus("Save failed: unable to write to local storage.");
  }

  function handleGenerateJson() {
    const validation = validateDocumentForGenerate(history.present);
    syncValidationState(validation.errors, validation.warnings);
    const result = generateJsonPayload(history.present, validation);

    if (!result.ok) {
      const firstError = result.errors[0] ?? "Validation failed.";
      setJsonStatus(`Generate blocked: ${result.errors.length} validation error(s). First: ${firstError}`);
      return;
    }

    setJsonOutput(formatJsonWithCompactArrays(result.payload));
    setJsonStatus(
      result.warnings.length > 0
        ? `Generated with ${result.warnings.length} warning(s).`
        : "Generated successfully."
    );
  }

  function handleLoadJson() {
    if (!jsonInput.trim()) {
      setJsonStatus('Please paste your JSON data in the text box before clicking "Load JSON".');
      return;
    }
    const shouldProceed = window.confirm(
      "Warning: Loading new JSON will delete everything you've entered in the form.\n\nDo you want to continue?"
    );
    if (!shouldProceed) {
      setJsonStatus("Load canceled.");
      return;
    }

    dispatchPersistence({ type: "set_json_load_in_progress", value: true });
    const parsed = parseIncomingJsonOrPythonDict(jsonInput);
    if (!parsed.ok || !parsed.data) {
      dispatchPersistence({ type: "set_json_load_in_progress", value: false });
      setJsonStatus(
        "Load failed: input is not valid JSON/dict and could not be repaired. Check for missing commas/quotes, unmatched braces, or invalid Python literals."
      );
      return;
    }

    try {
      setActiveMainTab("input-form");
      setActiveInputSubTab("basic");
      clearSavedData();
      dispatchPersistence({ type: "clear_saved_data" });
      const normalized = normalizeQuestionKeysOnLoad(parsed.data);
      const loadedState = normalizeLoadedDocumentState(normalized);
      resetHistory(loadedState);
      dispatchPersistence({ type: "mark_changed" });
      setJsonOutput("");
      syncValidationState([], []);
      setJsonStatus(`Loaded successfully (${parsed.source}).`);
    } catch {
      setJsonStatus("Load failed: unable to populate form from parsed data.");
    } finally {
      dispatchPersistence({ type: "set_json_load_in_progress", value: false });
    }
  }

  function handleRestoreLatest() {
    const result = restoreLatest();
    if (!result.ok || !result.payload) {
      setJsonStatus('No saved data found. Save your work first using the "Save Progress" button.');
      return;
    }

    const shouldProceed = window.confirm(
      "Restore will replace everything currently in the form with your saved data.\n\nDo you want to continue?"
    );
    if (!shouldProceed) {
      setJsonStatus("Restore canceled.");
      return;
    }

    const loadedState = normalizeLoadedDocumentState(result.payload);
    resetHistory(loadedState);
    dispatchPersistence({ type: "mark_changed" });
    setJsonOutput("");
    syncValidationState([], []);
    const timestamp = result.payload._save_timestamp;
    setJsonStatus(
      timestamp
        ? `Restored latest save. Saved: ${new Date(timestamp).toLocaleString()}`
        : "Restored latest save."
    );
  }

  function handleQuickJump(value: QuickJumpKey) {
    if (value === "final-preview") {
      setActiveMainTab("final-preview");
      return;
    }
    setActiveMainTab("input-form");
    setActiveInputSubTab(value as InputSubTabKey);
  }

  function navigateToInputTarget(target: InputScrollTarget, statusMessage: string) {
    setActiveMainTab("input-form");
    setActiveInputSubTab(target.subTab);
    setJsonStatus(statusMessage);
    window.setTimeout(() => {
      scrollToInputTarget(target);
    }, 100);
  }

  function handleJumpToFirstError() {
    if (validationErrors.length === 0) {
      return;
    }
    const firstError = validationErrors[0];
    const target = resolveInputTargetFromValidationMessage(firstError);
    if (target) {
      navigateToInputTarget(target, `Jumped to "${target.subTab}" for first error: ${firstError}`);
      return;
    }
    const targetSubTab = mapValidationMessageToSubTab(firstError);
    setActiveMainTab("input-form");
    setActiveInputSubTab(targetSubTab);
    setJsonStatus(`Jumped to "${targetSubTab}" for first error: ${firstError}`);
  }

  function handleValidationMessageClick(message: string) {
    const target = resolveInputTargetFromValidationMessage(message);
    if (target) {
      navigateToInputTarget(target, `Jumped to "${target.subTab}" for: ${message}`);
      return;
    }
    const targetSubTab = mapValidationMessageToSubTab(message);
    setActiveMainTab("input-form");
    setActiveInputSubTab(targetSubTab);
    setJsonStatus(`Jumped to "${targetSubTab}" for: ${message}`);
  }

  function handlePreviewNavigateToInput(target: InputScrollTarget) {
    navigateToInputTarget(target, `Jumped to "${target.subTab}" from Final Preview.`);
  }

  return (
    <ShellLayout
      topBar={
        <MainShellTopBar
          appVersion={APP_VERSION}
          contentCount={history.present.instructional_content.length}
          questionCount={history.present.practice_questions.length}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          quickJumpOptions={quickJumpOptions}
          onUndo={undo}
          onRedo={redo}
          onQuickJump={handleQuickJump}
          onSave={handleManualSave}
          saveIndicatorLabel={saveIndicatorLabel}
        />
      }
      sidePanel={
        <MainShellSidePanel
          activeSidePanel={activeSidePanel}
          onSidePanelChange={setActiveSidePanel}
          onGenerateJson={handleGenerateJson}
          onAddContent={() => applyDocumentAction({ type: "add_content_section" })}
          onAddQuestion={() => applyDocumentAction({ type: "add_question" })}
          onLoadJson={handleLoadJson}
          onRestoreLatest={handleRestoreLatest}
          onClearSavedData={() => {
            clearSavedData();
            dispatchPersistence({ type: "clear_saved_data" });
            setJsonStatus("Saved local snapshot cleared.");
          }}
          onJumpToFirstError={handleJumpToFirstError}
          onValidationMessageClick={handleValidationMessageClick}
          jsonInput={jsonInput}
          jsonOutput={jsonOutput}
          jsonStatus={jsonStatus}
          validationErrors={validationErrors}
          validationWarnings={validationWarnings}
          onJsonInputChange={setJsonInput}
        />
      }
    >
      <MainTabBar tabs={MAIN_TABS} activeTab={activeMainTab} onTabChange={setActiveMainTab} />

      {activeMainTab === "input-form" ? (
        <div className="input-form-area">
          <SubTabBar
            tabs={INPUT_SUB_TABS}
            activeTab={activeInputSubTab}
            onTabChange={setActiveInputSubTab}
          />
          <div className="tab-content-panel">
            <InputSubTabContent subTab={activeInputSubTab} />
          </div>
        </div>
      ) : (
        <div className="tab-content-panel">
          <FinalPreviewPanel document={history.present} onNavigateToInput={handlePreviewNavigateToInput} />
        </div>
      )}
    </ShellLayout>
  );
}
