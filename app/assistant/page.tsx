"use client";

import { ChatPanel } from "@/components/assistant/ChatPanel";
import { PageHeader } from "@/components/shell/PageHeader";
import { ChatIcon } from "@/components/ui/Icons";

export default function AssistantPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Ask anything"
        title="AI travel assistant"
        subtitle="Budget breakdowns, itineraries, packing lists, nearby spots and weather calls — one chat for all of it."
        icon={<ChatIcon size={24} />}
      />

      <ChatPanel />
    </div>
  );
}
