"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  mode: "contractor" | "homeowner";
  accentColor?: string;
  /** Returns the Supabase access token, or null when logged out. /api/chat requires it. */
  getAccessToken?: () => Promise<string | null>;
}

const SIGNUP_NOTE = "The full AI assistant is available once you sign in. Start the free 14-day trial at letstaystacked.com/login?mode=signup.";

// Logged-out (landing / demo) answers. No AI call, no API cost.
export function localReply(text: string): string {
  const t = text.toLowerCase();
  if (/follow[- ]?up|cold lead|text/.test(t)) {
    return "Here's a simple follow-up text you can adapt:\n\n\"Hi [Name], it's [You] from [Company]. Just checking in on the [job] estimate I sent. Happy to answer any questions or adjust the scope. Want to grab a time this week?\"\n\n" + SIGNUP_NOTE;
  }
  if (/re-?engage|past client|old client/.test(t)) {
    return "Try: \"Hi [Name], [You] here from [Company]. We did your [past job] last year. I'm booking [season] work now. Anything on your list I can help with?\" Short, personal and specific works best.\n\n" + SIGNUP_NOTE;
  }
  if (/price|pricing|cost|charge|quote|estimate/.test(t)) {
    return "Pricing depends on your market, materials and scope. A common approach: materials + (labor hours × your rate) + overhead + profit margin. StackedWork's estimate builder can suggest line items with AI once you're signed in.\n\n" + SIGNUP_NOTE;
  }
  if (/voice|job|lead|receipt|photo|portfolio|crm|feature|stackedwork/.test(t)) {
    return "StackedWork lets you log jobs by voice, track leads from your personal form link, build estimates, scan receipts and keep before/after photos, all in one place for $49.99/mo after a 14-day free trial. Explore the demo to see each screen.";
  }
  return "I'm the demo assistant, so I can only answer basic questions here. " + SIGNUP_NOTE;
}

export default function ChatWidget({ mode, accentColor = "#C8E64A", getAccessToken }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const greeting =
    mode === "contractor"
      ? "Hey! I'm your AI assistant. Ask me anything about running your business, pricing jobs, or using StackedWork."
      : "Hi! I can help you find the right contractor and prepare for your project. What kind of work do you need done?";

  const suggestions =
    mode === "contractor"
      ? [
          "Write a follow-up text for a cold lead",
          "Give me a script to re-engage a past client",
          "How should I price a bathroom remodel?",
          "Write a professional estimate email",
        ]
      : [];

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
      const token = getAccessToken ? await getAccessToken() : null;
      if (!token) {
        setMessages((prev) => [...prev, { role: "assistant", content: localReply(text) }]);
        return;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: next, mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setMessages((prev) => [...prev, { role: "assistant", content: (data.error || "Please sign in again.") + "\n\n" + localReply(text) }]);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, the assistant couldn't answer right now. Please try again." }]);
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
    // Under 768px the app has a fixed bottom tab bar (~60px + safe area); sit above it so "Alerts"/"Settings" stay tappable.
    <div className="sw-chat" style={{ position: "fixed", right: 16, zIndex: 9999, fontFamily: "'DM Sans', sans-serif" }}>
      {open && (
        <div
          style={{
            width: "min(340px, calc(100vw - 32px))",
            height: "min(480px, calc(100vh - 180px))",
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
                    whiteSpace: "pre-wrap",
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
            {suggestions.length > 0 && messages.length <= 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); }}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${isDark ? "rgba(200,230,74,0.25)" : "#E2E8F0"}`,
                      background: isDark ? "rgba(200,230,74,0.06)" : "#F8FAFC",
                      color: isDark ? "rgba(245,240,235,0.75)" : "#374151",
                      fontSize: 12,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {s}
                  </button>
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
          aria-label={open ? "Close assistant" : "Open assistant"}
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
        .sw-chat{bottom:calc(76px + env(safe-area-inset-bottom, 0px))}
        @media(min-width:768px){.sw-chat{bottom:24px;right:24px}}
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
