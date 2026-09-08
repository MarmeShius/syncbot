import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import ChatAssistant from "../components/ChatAssistant";

const initialForm = { subject: "", description: "", category: "Technical Issue", priority: "Medium", contact: "" };

function Customer() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTickets() {
    try { const result = await apiRequest("/tickets?limit=50"); setTickets(result.tickets); }
    catch (loadError) { setError(loadError.message); }
  }
  useEffect(() => {
    const timer = setTimeout(() => { loadTickets(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  async function createTicket(event) {
    event.preventDefault(); setBusy(true);
    try { await apiRequest("/tickets", { method: "POST", body: JSON.stringify(form) }); setForm(initialForm); setView("tickets"); await loadTickets(); }
    catch (submitError) { setError(submitError.message); } finally { setBusy(false); }
  }
  async function sendReply(event) {
    event.preventDefault(); if (!reply.trim() || !selected) return; setBusy(true);
    try { const result = await apiRequest(`/tickets/${selected.id}/messages`, { method: "POST", body: JSON.stringify({ body: reply }) }); setSelected(result.ticket); setReply(""); await loadTickets(); }
    catch (replyError) { setError(replyError.message); } finally { setBusy(false); }
  }

  const metrics = ["Total Tickets", "Open", "In Progress", "Resolved"].map((label, index) => [label, index === 0 ? tickets.length : tickets.filter((ticket) => ticket.status === ["Open", "In Progress", "Resolved"][index - 1]).length]);
  const statusClass = (value) => value === "Resolved" ? "bg-emerald-50 text-emerald-700" : value === "In Progress" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700";

  return <div className="min-h-screen bg-green-200 pb-12">
    <header className="border-b bg-slate-800"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-white">SyncBot / Customer Portal</p><h1 className="mt-1 text-xl font-bold text-white">Welcome back, {user?.name || "Customer"}</h1></div><span className="max-w-full truncate rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-green-800">{user?.email}</span></div></header>
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-green-800">Customer Dashboard</p><h2 className="mt-1 text-3xl font-bold">How can we help you?</h2><p className="mt-2 text-sm text-slate-500">Create and track support requests with a complete conversation history.</p></div><button onClick={() => setView("create")} className="rounded-lg bg-green-800 px-5 py-3 text-sm font-semibold text-white">+ Create New Ticket</button></div>
      {error && <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {!selected && view !== "create" && <><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div><section className="mt-8 rounded-xl border bg-white shadow-sm"><h3 className="border-b px-5 py-4 font-semibold">My tickets</h3>{tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onClick={() => { setSelected(ticket); setView("details"); }} statusClass={statusClass} />)}{!tickets.length && <p className="p-8 text-center text-sm text-slate-500">No tickets yet. Create your first support request.</p>}</section></>}
      {view === "create" && <CreateForm form={form} setForm={setForm} submit={createTicket} cancel={() => setView("dashboard")} busy={busy} />}
      {view === "details" && selected && <Details ticket={selected} back={() => { setSelected(null); setView("dashboard"); }} reply={reply} setReply={setReply} submit={sendReply} busy={busy} statusClass={statusClass} />}
    </main><ChatAssistant />
  </div>;
}

function TicketRow({ ticket, onClick, statusClass }) { return <button onClick={onClick} className="flex w-full flex-col gap-3 border-b p-5 text-left hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold text-indigo-600">{ticket.id}</p><p className="mt-1 font-semibold">{ticket.subject}</p><p className="mt-1 text-sm text-slate-500">{ticket.category}</p></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{ticket.priority}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(ticket.status)}`}>{ticket.status}</span></div></button>; }

function CreateForm({ form, setForm, submit, cancel, busy }) { return <section className="mx-auto max-w-3xl rounded-xl border bg-white p-6 shadow-sm"><h3 className="text-xl font-bold">Create a support ticket</h3><form onSubmit={submit} className="mt-6 space-y-5">{[["subject", "Subject"], ["contact", "Contact information"]].map(([name, label]) => <label key={name} className="block text-sm font-medium">{label}<input required value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="mt-2 w-full rounded-lg border px-4 py-3" /></label>)}<label className="block text-sm font-medium">Description<textarea required rows="6" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 w-full rounded-lg border px-4 py-3" /></label><div className="grid gap-4 sm:grid-cols-2"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full rounded-lg border bg-white px-4 py-3"><option>Technical Issue</option><option>Billing</option><option>Account</option><option>Product</option><option>General Inquiry</option></select></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="mt-2 w-full rounded-lg border bg-white px-4 py-3"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label></div><div className="flex justify-end gap-3"><button type="button" onClick={cancel} className="rounded-lg border px-4 py-3">Cancel</button><button disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">{busy ? "Submitting..." : "Submit Ticket"}</button></div></form></section>; }

function Details({ ticket, back, reply, setReply, submit, busy, statusClass }) { return <section className="mx-auto max-w-3xl rounded-xl border bg-white shadow-sm"><div className="border-b p-6"><button onClick={back} className="mb-4 text-sm font-semibold text-indigo-600">← Back to tickets</button><div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-indigo-600">{ticket.id}</p><h3 className="mt-1 text-xl font-bold">{ticket.subject}</h3></div><span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(ticket.status)}`}>{ticket.status}</span></div></div><div className="space-y-4 p-6">{(ticket.messages || []).map((message) => <div key={message._id || message.id || message.createdAt} className="rounded-xl bg-slate-100 p-4 text-sm">{message.body}</div>)}</div>{ticket.status !== "Closed" && <form onSubmit={submit} className="border-t p-6"><textarea required value={reply} onChange={(event) => setReply(event.target.value)} rows="3" placeholder="Write a reply..." className="w-full rounded-lg border px-4 py-3" /><button disabled={busy} className="mt-3 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">{busy ? "Sending..." : "Send reply"}</button></form>}</section>; }

export default Customer;
