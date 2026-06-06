import { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { CopilotPanel } from "./CopilotPanel";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Topbar />
      <div className="flex flex-1">
        <main className="flex-1 p-6">
          {children}
        </main>
        <CopilotPanel />
      </div>
    </div>
  );
}
