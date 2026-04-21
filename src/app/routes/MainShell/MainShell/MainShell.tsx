import { useEffect, useMemo, useState } from "react";
import { normalizeQuestionKeysOnLoad } from "../../../../domain/migration/normalizeIncoming";
import { formatJsonWithCompactArrays, generateJsonPayload } from "../../../../domain/serializers/generateJson";
import { parseIncomingJsonOrPythonDict } from "../../../../features/persistence/services/jsonImportService";
import { restoreLatest, saveProgress } from "../../../../features/persistence/services/saveRestoreService";
import { normalizeLoadedDocumentState } from "../../../../features/shell/state/documentReducer";
import { useDocumentStore } from "../../../../features/shell/state/documentStore";
import { DEFAULT_INPUT_SUBTAB, DEFAULT_MAIN_TAB, DEFAULT_SIDE_PANEL, INPUT_SUB_TABS } from "../../../../features/shell/state/shellConfig";
import { validateDocumentForGenerate, validateDocumentForSave } from "../../../../features/validation/validators/documentValidation";
import { mapValidationMessageToSubTab, resolveInputTargetFromValidationMessage } from "../../../../features/validation/utils/validationMessageNavigation";
import { APP_VERSION } from "../../../../shared/constants/appConstants";
import { THEME_STORAGE_KEY } from "../../../../shared/constants/storageKeys";
import { WHATS_NEW_RELEASES } from "../../../../shared/constants/whatsNewReleases";
import type { InputScrollTarget, SidePanelKey } from "../../../../shared/types/navigation";
import { MainShellSidePanel } from "../MainShellSidePanel";
import { MainShellTopBar, type QuickJumpKey, type QuickJumpOption } from "../MainShellTopBar";
import { applyTextareaAutoResize, attachTextareaAutoResizeListener } from "./mainShellAutoResize";
import { clearCurrentSubTabFields } from "./mainShellClearActions";
import { applyTrailingSpacesAttribute, applyTypographyCssVars, persistAutoResizeEnabled, persistFontSize, persistLineHeight, persistTrailingSpacesEnabled, readInitialAutoResizeEnabled, readInitialFontSize, readInitialLineHeight, readInitialThemeMode, readInitialTrailingSpacesEnabled } from "./mainShellUiPreferences";
import { applyQuickJump, navigateToInputWithStatus } from "./mainShellNavigation";
import { MainShellWorkspace } from "./MainShellWorkspace";
import { ShellLayout } from "../../../../features/shell/components/ShellLayout/ShellLayout";
import { WhatsNewModal } from "../../../../features/shell/components/WhatsNewModal";
import { useWhatsNewModalState } from "./mainShellWhatsNew";
import "./MainShell.css";
export function MainShell() {
  const { history, persistence, dispatchPersistence, applyDocumentAction, undo, redo, resetHistory } = useDocumentStore();
  const [activeMainTab, setActiveMainTab] = useState(DEFAULT_MAIN_TAB);
  const [activeInputSubTab, setActiveInputSubTab] = useState(DEFAULT_INPUT_SUBTAB);
  const [activeSidePanel, setActiveSidePanel] = useState<SidePanelKey>(DEFAULT_SIDE_PANEL);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonOutput, setJsonOutput] = useState("");
  const [jsonStatus, setJsonStatus] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [fontSize, setFontSize] = useState(readInitialFontSize);
  const [lineHeight, setLineHeight] = useState(readInitialLineHeight);
  const [autoResizeEnabled, setAutoResizeEnabled] = useState(readInitialAutoResizeEnabled);
  const [trailingSpacesEnabled, setTrailingSpacesEnabled] = useState(readInitialTrailingSpacesEnabled);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(readInitialThemeMode);
  const whatsNew = useWhatsNewModalState(APP_VERSION);
  useEffect(() => {
    applyTypographyCssVars(fontSize, lineHeight);
    persistFontSize(fontSize);
    persistLineHeight(lineHeight);
  }, [fontSize, lineHeight]);
  useEffect(() => {
    applyTrailingSpacesAttribute(trailingSpacesEnabled);
    persistTrailingSpacesEnabled(trailingSpacesEnabled);
  }, [trailingSpacesEnabled]);
  useEffect(() => {
    persistAutoResizeEnabled(autoResizeEnabled);
    applyTextareaAutoResize(autoResizeEnabled);
    return attachTextareaAutoResizeListener(autoResizeEnabled);
  }, [autoResizeEnabled, activeInputSubTab, activeMainTab, history.present]);

  const quickJumpOptions = useMemo<QuickJumpOption[]>(
    () => [
      ...INPUT_SUB_TABS.map((tab) => ({ key: tab.key as QuickJumpKey, label: tab.label })),
      { key: "final-preview", label: "Final Preview" },
      ...history.present.instructional_content.map((_, index) => ({
        key: `content-${index + 1}` as QuickJumpKey,
        label: `Content Section ${index + 1}`
      })),
      ...history.present.practice_questions.map((_, index) => ({
        key: `question-${index + 1}` as QuickJumpKey,
        label: `Question ${index + 1}`
      }))
    ],
    [history.present.instructional_content, history.present.practice_questions]
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
    if (!result.ok) {
      dispatchPersistence({ type: "save_failed" });
      setJsonStatus("Save failed: unable to write to local storage.");
      return;
    }
    dispatchPersistence({ type: "save_success", raw: result.raw });
    setJsonStatus(
      validation.errors.length > 0 || validation.warnings.length > 0
        ? `Saved with ${validation.errors.length} error(s) and ${validation.warnings.length} warning(s).`
        : "Saved successfully."
    );
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
    setJsonStatus(result.warnings.length > 0 ? `Generated with ${result.warnings.length} warning(s).` : "Generated successfully.");
  }
  function handleLoadJson() {
    if (!jsonInput.trim()) {
      setJsonStatus('Please paste your JSON data in the text box before clicking "Load JSON".');
      return;
    }
    if (!window.confirm("Warning: Loading new JSON will delete everything you've entered in the form.\n\nDo you want to continue?")) {
      setJsonStatus("Load canceled.");
      return;
    }
    dispatchPersistence({ type: "set_json_load_in_progress", value: true });
    const parsed = parseIncomingJsonOrPythonDict(jsonInput);
    if (!parsed.ok || !parsed.data) {
      dispatchPersistence({ type: "set_json_load_in_progress", value: false });
      setJsonStatus("Load failed: input is not valid JSON/dict and could not be repaired.");
      return;
    }
    try {
      setActiveMainTab("input-form");
      setActiveInputSubTab("basic");
      const normalized = normalizeQuestionKeysOnLoad(parsed.data);
      resetHistory(normalizeLoadedDocumentState(normalized));
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
    if (!window.confirm("Restore will replace everything currently in the form with your saved data.\n\nDo you want to continue?")) {
      setJsonStatus("Restore canceled.");
      return;
    }
    resetHistory(normalizeLoadedDocumentState(result.payload));
    dispatchPersistence({ type: "mark_changed" });
    setJsonOutput("");
    syncValidationState([], []);
    setJsonStatus(result.payload._save_timestamp ? `Restored latest save. Saved: ${new Date(result.payload._save_timestamp).toLocaleString()}` : "Restored latest save.");
  }
  function handleClearForm() {
    if (!window.confirm("Clear form will delete all fields in the current document.\n\nDo you want to continue?")) {
      setJsonStatus("Clear form canceled.");
      return;
    }
    resetHistory();
    dispatchPersistence({ type: "mark_changed" });
    syncValidationState([], []);
    setJsonOutput("");
    setJsonInput("");
    setJsonStatus("Form cleared.");
  }
  function handleClearCurrentSubtab() {
    if (!window.confirm("Clear Current Subtab will remove all values in this subtab.\n\nDo you want to continue?")) {
      setJsonStatus("Clear current subtab canceled.");
      return;
    }
    clearCurrentSubTabFields(activeInputSubTab, applyDocumentAction);
    dispatchPersistence({ type: "mark_changed" });
    syncValidationState([], []);
    setJsonStatus(`Cleared fields in "${activeInputSubTab}".`);
  }
  function handleQuickJump(value: QuickJumpKey) {
    applyQuickJump(value, setActiveMainTab, setActiveInputSubTab);
  }
  function navigateToInputTarget(target: InputScrollTarget, statusMessage: string) {
    navigateToInputWithStatus(target, statusMessage, setActiveMainTab, setActiveInputSubTab, setJsonStatus);
  }
  function handleJumpToFirstError() {
    const firstError = validationErrors[0];
    if (!firstError) return;
    const target = resolveInputTargetFromValidationMessage(firstError);
    if (target) return navigateToInputTarget(target, `Jumped to "${target.subTab}" for first error: ${firstError}`);
    const targetSubTab = mapValidationMessageToSubTab(firstError);
    setActiveMainTab("input-form");
    setActiveInputSubTab(targetSubTab);
    setJsonStatus(`Jumped to "${targetSubTab}" for first error: ${firstError}`);
  }
  function handleValidationMessageClick(message: string) {
    const target = resolveInputTargetFromValidationMessage(message);
    if (target) return navigateToInputTarget(target, `Jumped to "${target.subTab}" for: ${message}`);
    const targetSubTab = mapValidationMessageToSubTab(message);
    setActiveMainTab("input-form");
    setActiveInputSubTab(targetSubTab);
    setJsonStatus(`Jumped to "${targetSubTab}" for: ${message}`);
  }
  function handleToggleTheme() {
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    document.documentElement.setAttribute("data-theme", next);
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures.
    }
  }
  return (
    <>
      <ShellLayout
        topBar={
          <MainShellTopBar
            appVersion={APP_VERSION}
            themeMode={themeMode}
            autoResizeEnabled={autoResizeEnabled}
            trailingSpacesEnabled={trailingSpacesEnabled}
            fontSize={fontSize}
            lineHeight={lineHeight}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            quickJumpOptions={quickJumpOptions}
            onUndo={undo}
            onRedo={redo}
            onFontSizeChange={setFontSize}
            onLineHeightChange={setLineHeight}
            onQuickJump={handleQuickJump}
            onSave={handleManualSave}
            onReload={() => window.location.reload()}
            onScrollToTop={() =>
              document
                .getElementById(
                  activeMainTab === "input-form" ? "input-form-scroll-panel" : "final-preview-scroll-panel"
                )
                ?.scrollTo({ top: 0, behavior: "smooth" })
            }
            onToggleTheme={handleToggleTheme}
            onToggleAutoResize={() => setAutoResizeEnabled((current) => !current)}
            onToggleTrailingSpaces={() => setTrailingSpacesEnabled((current) => !current)}
            onOpenWhatsNew={whatsNew.open}
            saveIndicatorLabel={saveIndicatorLabel}
          />
        }
        sidePanel={
          <MainShellSidePanel
            activeSidePanel={activeSidePanel}
            onSidePanelChange={setActiveSidePanel}
            onGenerateJson={handleGenerateJson}
            onLoadJson={handleLoadJson}
            onRestoreLatest={handleRestoreLatest}
            onClearForm={handleClearForm}
            onClearCurrentSubtab={handleClearCurrentSubtab}
            onUploadPdfs={() => setActiveSidePanel("pdf-viewer")}
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
        <MainShellWorkspace
          activeMainTab={activeMainTab}
          activeInputSubTab={activeInputSubTab}
          document={history.present}
          onMainTabChange={setActiveMainTab}
          onInputSubTabChange={setActiveInputSubTab}
          onPreviewNavigateToInput={(target) =>
            navigateToInputTarget(target, `Jumped to "${target.subTab}" from Final Preview.`)
          }
        />
      </ShellLayout>
      <WhatsNewModal
        open={whatsNew.isOpen}
        appVersion={APP_VERSION}
        releases={WHATS_NEW_RELEASES}
        onClose={whatsNew.close}
      />
    </>
  );
}
