import { useState } from "react";
import { apiRequest } from "../api";

function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi. I can help with ticket status, account access, and billing guidance." }]);
  const [busy, setBusy] = useState(false);

  async function sendMessage(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setMessage("");
    setBusy(true);
    try {
      const result = await apiRequest("/ai/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message }]);
    } finally { setBusy(false); }
  }

  return <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
    {open && <section className="mb-3 flex h-[min(28rem,calc(100vh-8rem))] w-[min(22rem,calc(100vw-2rem))] min-w-0 flex-col overflow-hidden rounded-2xl border border-black bg-white shadow-2xl"><header className="min-w-0 bg-slate-950 px-5 py-4 text-white"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">SyncBot Assistant</p><h2 className="mt-1 break-word font-bold">Support guidance</h2></header><div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((item, index) => <div key={`${item.role}-${index}`} className={`min-w-0 max-w-[90%] break-word rounded-xl px-3 py-2 text-sm leading-5 ${item.role === "user" ? "ml-auto bg-emerald-700 text-white" : "bg-white text-slate-700 shadow-sm"}`}>{item.text}</div>)}{busy && <div className="text-xs text-slate-500">Assistant is thinking...</div>}</div><form onSubmit={sendMessage} className="border-t bg-white p-3"><div className="flex min-w-0 gap-2"><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask a support question" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" /><button disabled={busy} className="shrink-0 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Send</button></div></form></section>}
    <button type="button" onClick={() => setOpen(!open)} aria-label={open ? "Close support assistant" : "Open support assistant"} className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-700 text-2xl text-white shadow-lg transition hover:bg-emerald-800">{open ? "×" : "?"}</button>
  </div>;
}

export default ChatAssistant;
