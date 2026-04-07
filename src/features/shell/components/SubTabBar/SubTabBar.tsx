import type {
  InputSubTabDefinition,
  InputSubTabKey
} from "../../../../shared/types/navigation";
import "./SubTabBar.css";

interface SubTabBarProps {
  tabs: readonly InputSubTabDefinition[];
  activeTab: InputSubTabKey;
  onTabChange: (nextTab: InputSubTabKey) => void;
}

export function SubTabBar({ tabs, activeTab, onTabChange }: SubTabBarProps) {
  return (
    <div className="tabs sub-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
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
