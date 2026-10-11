import { useState } from "react";
import { Sparkles, Send, X, MessageSquare, BookOpen, Loader2 } from "lucide-react";
import { apiRequest } from "../api";

function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I am SyncBot Assistant. Ask me anything about tickets, billing, SLAs, or technical troubleshooting.",
      sources: [],
    },
  ]);
  const [busy, setBusy] = useState(false);

  const quickPrompts = [
    "How to reset password?",
    "Refund policy & invoices",
    "What are ticket SLA deadlines?",
  ];

  async function handleSend(textToSend) {
    const text = (textToSend || message).trim();
    if (!text || busy) return;

    setMessages((current) => [...current, { role: "user", text, sources: [] }]);
    setMessage("");
    setBusy(true);

    try {
      const result = await apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.reply, sources: result.sources || [] },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: error.message || "Failed to get response.", sources: [] },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
      {open && (
        <section className="mb-3 flex h-[min(30rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-emerald-800 bg-emerald-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="assistant-avatar relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200/70 bg-emerald-100 shadow-md" role="img" aria-label="Animated customer support assistant">
                <svg viewBox="0 0 48 48" className="assistant-avatar-art h-full w-full" aria-hidden="true">
                  <circle cx="24" cy="24" r="24" fill="#D8F3E4" />
                  <path d="M8 48c1.2-9.1 6.5-14 16-14s14.8 4.9 16 14H8Z" fill="#16845B" />
                  <path d="M12 20c0-9.1 5.1-15 12-15s12 5.9 12 15v5H12v-5Z" fill="#314C45" />
                  <path d="M15 20c0-6.7 3.8-11 9-11s9 4.3 9 11v5c0 6.4-3.8 10-9 10s-9-3.6-9-10v-5Z" fill="#F1C5A5" />
                  <path d="M14 21c1.1-8.2 5.2-12.3 11-12.3 3.3 0 6.2 1.8 8.4 4.8-3.2-.6-6.6-2.4-8.3-4.1-2.5 4.9-6.2 7.7-11.1 8.4V21Z" fill="#314C45" />
                  <path d="M18.5 23h.1m10.8 0h.1" stroke="#4D403B" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M21 28c1.8 1.7 4.2 1.7 6 0" stroke="#A85D53" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12 21c0-5.4 3-9 7-9m17 9c0-5.4-3-9-7-9" stroke="#F4D7B2" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M12 19v7m24-7v7" stroke="#0F6B4A" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M36 26c0 3.5-2.2 5-5.5 5" stroke="#0F6B4A" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="assistant-avatar-sparkle absolute -right-0.5 bottom-0 flex h-4 w-4 items-center justify-center rounded-full border border-emerald-900 bg-emerald-500"><Sparkles className="h-2.5 w-2.5 text-white" /></span>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight">SyncBot Copilot</h3>
                <p className="mt-0.5 text-[10px] font-medium text-emerald-200/80">Your support sidekick</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close support assistant"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-emerald-200 hover:bg-emerald-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {/* Messages list */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950/60">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`flex flex-col ${
                  item.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    item.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{item.text}</p>

                  {/* Knowledge Base Citations */}
                  {item.sources?.length > 0 && (
                    <div className="mt-2.5 border-t border-slate-100 pt-2 dark:border-slate-800">
                      <p className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                        <BookOpen className="h-3 w-3" />
                        Knowledge Sources:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {s.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Assistant is thinking...</span>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex flex-wrap gap-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  disabled={busy}
                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask support question..."
                className="flex-1 rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:text-white dark:placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={busy || !message.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close support assistant" : "Open support assistant"}
        className="flex h-13 w-13 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xl transition-transform hover:scale-105 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
}

export default ChatAssistant;
