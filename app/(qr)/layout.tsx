"use client";

import { DemoProvider } from "@/hooks/useDemo";
import { PresenterBar } from "@/components/presenter/PresenterBar";
import { JourneyPanel } from "@/components/journey/JourneyPanel";
import { ChatAssistant } from "@/components/chat/ChatAssistant";

export default function QrDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <div className="flex h-dvh flex-col bg-[var(--paper)]">
        <PresenterBar />
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_min(22vw,300px)]">
          <div className="demo-scroll relative min-h-0 overflow-y-auto border-r border-[var(--line)]">
            {children}
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
