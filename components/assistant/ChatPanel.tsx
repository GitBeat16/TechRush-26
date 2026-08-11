"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChatBubble } from "@/components/assistant/ChatBubble";
import { ChatComposer } from "@/components/assistant/ChatComposer";
import { SuggestedChips } from "@/components/assistant/SuggestedChips";
import { ClayCard } from "@/components/ui/ClayCard";
import { fadeUp, revealViewport } from "@/lib/animations";
import { useFeedback } from "@/lib/feedback";
import type { AssistantWidget, ChatHistoryEntry, ChatResponseBody } from "@/types/assistant";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  widget?: AssistantWidget | null;
  pending?: boolean;
}

const GREETING: Message = {
  id: "greeting",
  role: "assistant",
  text: "Hey! I'm your Wanderly AI travel assistant. Tell me a budget, a destination, or what you need — a full itinerary, a packing list, nearby spots, or a weather check — and I'll take it from there.",
};

let nextId = 1;
function makeId() {
  nextId += 1;
  return `msg-${nextId}`;
}

export interface ChatPanelProps {
  /**
   * `page` is the full-width card on /assistant. `dock` drops the clay card
   * and the outer reveal animation, because the floating launcher already
   * provides both — nesting them makes the panel animate twice.
   */
  variant?: "page" | "dock";
}

export function ChatPanel({ variant = "page" }: ChatPanelProps) {
  const { play } = useFeedback();
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [sending, setSending] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function toggleLocation() {
    if (location) {
      play("toggleOff");
      setLocation(null);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Location isn't available in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        play("toggleOn");
        setLocationError("");
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setLocationError("Couldn't get your location — check browser permissions.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function send(text: string) {
    if (sending) return;

    const history: ChatHistoryEntry[] = messages
      .filter((m) => m.id !== "greeting")
      .map((m) => ({ role: m.role, text: m.text }));

    const userMessage: Message = { id: makeId(), role: "user", text };
    const pendingMessage: Message = { id: makeId(), role: "assistant", text: "", pending: true };

    play("nav");
    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history, location }),
      });

      const raw = await response.text();
      let data: ChatResponseBody | { error: string };
      try {
        data = JSON.parse(raw) as ChatResponseBody | { error: string };
      } catch {
        console.error(`[chat] non-JSON response, status ${response.status}:`, raw.slice(0, 500));
        throw new Error(`Non-JSON response (status ${response.status})`);
      }

      if (!response.ok || "error" in data) {
        const message = "error" in data ? data.error : `Request failed: ${response.status}`;
        console.error("[chat] request failed:", message);
        throw new Error(message);
      }

      play("success");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMessage.id ? { ...m, text: data.reply, widget: data.widget, pending: false } : m,
        ),
      );
    } catch (requestError) {
      console.error("[chat] send() failed:", requestError);
      play("toggleOff");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingMessage.id
            ? { ...m, text: "Something went wrong on my end — please try that again.", pending: false }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  const isDock = variant === "dock";

  const body = (
    <>
      <div className={isDock ? "mb-3" : "mb-4"}>
        <SuggestedChips onPick={send} disabled={sending} />
        {locationError && (
          <p className="mt-2 font-body text-xs font-semibold text-clay-tangerine">{locationError}</p>
        )}
      </div>

      <div
        ref={scrollRef}
        className={`flex flex-1 flex-col gap-3.5 overflow-y-auto rounded-clay bg-clay-bg/60 shadow-clay-inset-sm ${
          isDock ? "min-h-0 p-3" : "max-h-[55vh] min-h-[320px] p-3.5 sm:p-4"
        }`}
      >
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role}
            text={message.text}
            widget={message.widget}
            pending={message.pending}
          />
        ))}
      </div>

      <div className={isDock ? "mt-3" : "mt-4"}>
        <ChatComposer
          onSend={send}
          disabled={sending}
          locationEnabled={Boolean(location)}
          onToggleLocation={toggleLocation}
        />
      </div>
    </>
  );

  if (isDock) {
    // The launcher owns the surface and the entrance, so this is just layout.
    return <div className="flex min-h-0 flex-1 flex-col">{body}</div>;
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={revealViewport}>
      <ClayCard tone="surface" radius="xl" depth="lg" className="flex flex-col overflow-hidden p-4 sm:p-6">
        {body}
      </ClayCard>
    </motion.div>
  );
}
