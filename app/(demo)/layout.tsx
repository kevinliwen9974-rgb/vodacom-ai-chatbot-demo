"use client";

import { DemoProvider } from "@/hooks/useDemo";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PresenterBar } from "@/components/presenter/PresenterBar";
import { JourneyPanel } from "@/components/journey/JourneyPanel";
import { ChatAssistant } from "@/components/chat/ChatAssistant";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <div className="flex h-dvh flex-col">
        <PresenterBar />
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_min(22vw,300px)]">
          <div className="relative flex min-h-0 flex-col border-r border-[var(--line)] bg-[var(--paper)]">
            <PortalHeader />
            <main className="demo-scroll flex-1 overflow-y-auto px-5 py-5 pb-28">{children}</main>
            <ChatAssistant />
          </div>
          <div className="hidden min-h-0 lg:block">
            <JourneyPanel />
          </div>
        </div>
      </div>
    </DemoProvider>
  );
}
