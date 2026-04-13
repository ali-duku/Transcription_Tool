import type { InputScrollTarget, InputSubTabKey, MainTabKey } from "../../../../shared/types/navigation";
import type { QuickJumpKey } from "../MainShellTopBar";
import { scrollToInputTarget } from "./mainShellValidationNavigation";

function parseIndexedQuickJump(value: QuickJumpKey, prefix: "content-" | "question-"): number | null {
  if (!value.startsWith(prefix)) {
    return null;
  }
  const index = Number.parseInt(value.slice(prefix.length), 10);
  return Number.isInteger(index) && index > 0 ? index : null;
}

function scrollToIndexedCard(selector: string) {
  window.setTimeout(() => {
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

export function applyQuickJump(
  value: QuickJumpKey,
  setActiveMainTab: (tab: MainTabKey) => void,
  setActiveInputSubTab: (tab: InputSubTabKey) => void
) {
  const contentIndex = parseIndexedQuickJump(value, "content-");
  const questionIndex = parseIndexedQuickJump(value, "question-");
  if (value === "final-preview") {
    setActiveMainTab("final-preview");
    return;
  }
  if (contentIndex) {
    setActiveMainTab("input-form");
    setActiveInputSubTab("content");
    scrollToIndexedCard(`[data-content-index="${contentIndex}"]`);
    return;
  }
  if (questionIndex) {
    setActiveMainTab("input-form");
    setActiveInputSubTab("questions");
    scrollToIndexedCard(`[data-question-index="${questionIndex}"]`);
    return;
  }
  setActiveMainTab("input-form");
  setActiveInputSubTab(value as InputSubTabKey);
}

export function navigateToInputWithStatus(
  target: InputScrollTarget,
  statusMessage: string,
  setActiveMainTab: (tab: MainTabKey) => void,
  setActiveInputSubTab: (tab: InputSubTabKey) => void,
  setJsonStatus: (status: string) => void
) {
  setActiveMainTab("input-form");
  setActiveInputSubTab(target.subTab);
  setJsonStatus(statusMessage);
  window.setTimeout(() => scrollToInputTarget(target), 100);
}
