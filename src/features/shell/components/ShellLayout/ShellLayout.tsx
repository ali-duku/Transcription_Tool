import type { PropsWithChildren, ReactNode } from "react";
import "./ShellLayout.css";

interface ShellLayoutProps extends PropsWithChildren {
  topBar: ReactNode;
  sidePanel: ReactNode;
}

export function ShellLayout({ topBar, sidePanel, children }: ShellLayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">{topBar}</header>
      <main className="workflow-container">
        <section className="form-section">{children}</section>
        <aside className="form-section toggle-section">{sidePanel}</aside>
      </main>
    </div>
  );
}
