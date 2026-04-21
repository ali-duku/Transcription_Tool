import type { SVGProps } from "react";
import "./AppIcon.css";

export type AppIconName =
  | "add"
  | "paste"
  | "copy"
  | "duplicate"
  | "arrowUp"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight"
  | "undo"
  | "redo"
  | "save"
  | "reload"
  | "scrollTop"
  | "moon"
  | "sun"
  | "resizeVertical"
  | "warning"
  | "draw"
  | "upload"
  | "pdf"
  | "json"
  | "close"
  | "info";

interface AppIconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  name: AppIconName;
  size?: number;
}

function renderIconPaths(name: AppIconName) {
  switch (name) {
    case "add":
      return <path d="M12 5v14M5 12h14" />;
    case "paste":
      return (
        <>
          <path d="M9 4h6a1 1 0 0 1 1 1v2H8V5a1 1 0 0 1 1-1Z" />
          <path d="M9 3h6" />
          <path d="M8 7H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1" />
        </>
      );
    case "copy":
      return (
        <>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </>
      );
    case "duplicate":
      return (
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M4 16V6a2 2 0 0 1 2-2h10" />
        </>
      );
    case "arrowUp":
      return <path d="m12 19 0-14m0 0-5 5m5-5 5 5" />;
    case "arrowDown":
      return <path d="m12 5 0 14m0 0-5-5m5 5 5-5" />;
    case "arrowLeft":
      return <path d="m19 12-14 0m0 0 5-5m-5 5 5 5" />;
    case "arrowRight":
      return <path d="m5 12 14 0m0 0-5-5m5 5-5 5" />;
    case "undo":
      return <path d="M9 14H5V10M5 10c2-4 8-6 12-2 2 2 2 6 0 8-1 1-2 2-4 2" />;
    case "redo":
      return <path d="M15 14h4V10M19 10c-2-4-8-6-12-2-2 2-2 6 0 8 1 1 2 2 4 2" />;
    case "save":
      return (
        <>
          <path d="M4 4h13l3 3v13H4z" />
          <path d="M8 4v6h8V4" />
          <path d="M9 20v-6h6v6" />
        </>
      );
    case "reload":
      return <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v6h-6" />;
    case "scrollTop":
      return (
        <>
          <path d="M12 19V7" />
          <path d="m7 12 5-5 5 5" />
          <path d="M5 4h14" />
        </>
      );
    case "moon":
      return <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />;
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19.1 4.9 17 7M7 17l-2.1 2.1M19.1 19.1 17 17M7 7 4.9 4.9" />
        </>
      );
    case "resizeVertical":
      return (
        <>
          <path d="M12 3v18" />
          <path d="m8 7 4-4 4 4M8 17l4 4 4-4" />
        </>
      );
    case "warning":
      return (
        <>
          <path d="M10.3 3.9a2 2 0 0 1 3.4 0l7.1 12.2A2 2 0 0 1 19.1 19H4.9a2 2 0 0 1-1.7-3Z" />
          <path d="M12 9v4M12 16h.01" />
        </>
      );
    case "draw":
      return (
        <>
          <path d="M3 17.2V21h3.8L18 9.8 14.2 6 3 17.2Z" />
          <path d="m12.8 7.4 3.8 3.8" />
          <path d="M3 21h18" />
        </>
      );
    case "upload":
      return (
        <>
          <path d="M12 16V5" />
          <path d="m8 9 4-4 4 4" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </>
      );
    case "pdf":
      return (
        <>
          <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
          <path d="M15 2v5h5" />
          <path d="M8 14h2a2 2 0 0 0 0-4H8v8M14 18v-8h1.5a2.5 2.5 0 0 1 0 5H14M17 18h2" />
        </>
      );
    case "json":
      return (
        <>
          <path d="M9 5c-2 0-3 1-3 3v2c0 1-.4 2-2 2 1.6 0 2 1 2 2v2c0 2 1 3 3 3" />
          <path d="M15 5c2 0 3 1 3 3v2c0 1 .4 2 2 2-1.6 0-2 1-2 2v2c0 2-1 3-3 3" />
        </>
      );
    case "close":
      return <path d="m18 6-12 12M6 6l12 12" />;
    case "info":
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-5M12 8h.01" />
        </>
      );
    default:
      return null;
  }
}

export function AppIcon({ name, size = 16, className = "", ...rest }: AppIconProps) {
  const classes = className.trim().length > 0 ? `app-icon ${className}` : "app-icon";
  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {renderIconPaths(name)}
    </svg>
  );
}
