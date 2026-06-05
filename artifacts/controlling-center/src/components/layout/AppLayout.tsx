import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CopilotPanel } from "./CopilotPanel";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Topbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {children}
        </main>
        <CopilotPanel />
      </div>
    </div>
  );
}
