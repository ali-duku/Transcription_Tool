import type { MainTabDefinition, MainTabKey } from "../../../../shared/types/navigation";
import "./MainTabBar.css";

interface MainTabBarProps {
  tabs: readonly MainTabDefinition[];
  activeTab: MainTabKey;
  onTabChange: (nextTab: MainTabKey) => void;
}

export function MainTabBar({ tabs, activeTab, onTabChange }: MainTabBarProps) {
  return (
    <div className="tabs main-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          id={tab.buttonId}
          className={`tab${activeTab === tab.key ? " active" : ""}`}
          title={tab.title}
          type="button"
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
