import { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { CopilotPanel } from "./CopilotPanel";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex flex-1">
          <main className="flex-1 p-6 min-w-0">
            {children}
          </main>
          <CopilotPanel />
        </div>
      </div>
    </div>
  );
}
