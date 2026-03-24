"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  mode: "contractor" | "homeowner";
  accentColor?: string;
}

export default function ChatWidget({ mode, accentColor = "#C8E64A" }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const greeting =
    mode === "contractor"
      ? "Hey! I'm your AI assistant. Ask me anything about running your business, pricing jobs, or using StackedWork."
      : "Hi! I can help you find the right contractor and prepare for your project. What kind of work do you need done?";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, mode }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isDark = mode === "contractor";
  const bg = isDark ? "#132440" : "#fff";
  const bubbleBg = isDark ? "rgba(255,255,255,0.07)" : "#F1F5F9";
  const textColor = isDark ? "#F5F0EB" : "#0F172A";
  const subText = isDark ? "rgba(245,240,235,0.5)" : "#64748B";
  const inputBg = isDark ? "rgba(255,255,255,0.08)" : "#F8FAFC";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0";
  const headerBg = isDark ? "#0F1E35" : accentColor;
  const headerText = isDark ? accentColor : "#132440";

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, fontFamily: "'DM Sans', sans-serif" }}>
      {open && (
        <div
          style={{
            width: 340,
            height: 480,
            background: bg,
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginBottom: 12,
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: headerBg,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isDark ? accentColor : "#132440",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: headerText }}>
                  {mode === "contractor" ? "StackedWork AI" : "Project Assistant"}
                </div>
                <div style={{ fontSize: 11, color: isDark ? "rgba(200,230,74,0.6)" : "rgba(19,36,64,0.55)", marginTop: 1 }}>
                  Powered by Claude AI
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: headerText,
                fontSize: 18,
                lineHeight: 1,
                opacity: 0.7,
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "9px 13px",
                    borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: m.role === "user" ? accentColor : bubbleBg,
                    color: m.role === "user" ? "#132440" : textColor,
                    fontSize: 13,
                    lineHeight: 1.55,
                    fontWeight: m.role === "user" ? 600 : 400,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 5, padding: "8px 4px", alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: accentColor,
                      opacity: 0.6,
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={mode === "contractor" ? "Ask about jobs, pricing..." : "Describe your project..."}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 8,
                border: `1px solid ${inputBorder}`,
                background: inputBg,
                color: textColor,
                fontSize: 13,
                outline: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                padding: "9px 14px",
                background: input.trim() && !loading ? accentColor : (isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"),
                border: "none",
                borderRadius: 8,
                cursor: input.trim() && !loading ? "pointer" : "default",
                color: input.trim() && !loading ? "#132440" : subText,
                fontWeight: 700,
                fontSize: 13,
                transition: "all 0.2s",
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: open ? "#64748B" : `linear-gradient(135deg, ${accentColor}, #A8C435)`,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            transition: "all 0.2s",
          }}
        >
          {open ? "✕" : "🤖"}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
