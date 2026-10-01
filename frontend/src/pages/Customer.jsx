import { useEffect, useState } from "react";
import { Sparkles, ArrowLeft, PlusCircle } from "lucide-react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import ChatAssistant from "../components/ChatAssistant";
import FileUpload from "../components/FileUpload";
import AttachmentList from "../components/AttachmentList";
import SlaBadge from "../components/SlaBadge";
import CsatModal from "../components/CsatModal";
import FaqList from "../components/FaqList";

const initialForm = {
  subject: "",
  description: "",
  category: "Technical Issue",
  priority: "Medium",
  contact: "",
  attachments: [],
};

function Customer() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestingTitle, setSuggestingTitle] = useState(false);

  async function loadTickets() {
    try {
      const result = await apiRequest("/tickets?limit=50");
      setTickets(result.tickets);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // WebSockets: Real-time ticket updates and message streaming
  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdate = ({ ticket }) => {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
      setSelected((curr) => (curr && curr.id === ticket.id ? ticket : curr));
    };

    const handleTicketCreated = ({ ticket }) => {
      setTickets((prev) => [ticket, ...prev.filter((t) => t.id !== ticket.id)]);
    };

    const handleNewMessage = ({ ticket }) => {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
      setSelected((curr) => (curr && curr.id === ticket.id ? ticket : curr));
    };

    socket.on("ticket:updated", handleTicketUpdate);
    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:message", handleNewMessage);
    socket.on("ticket:csat", handleTicketUpdate);

    return () => {
      socket.off("ticket:updated", handleTicketUpdate);
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:message", handleNewMessage);
      socket.off("ticket:csat", handleTicketUpdate);
    };
  }, [socket]);

  // Join ticket room when selected
  useEffect(() => {
    if (!socket || !selected?.id) return;
    socket.emit("join:ticket", selected.id);
    return () => {
      socket.emit("leave:ticket", selected.id);
    };
  }, [socket, selected?.id]);

  async function createTicket(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await apiRequest("/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(initialForm);
      setSelected(res.ticket);
      setView("details");
      await loadTickets();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(event) {
    event.preventDefault();
    if ((!reply.trim() && !replyAttachments.length) || !selected) return;
    setBusy(true);

    try {
      const result = await apiRequest(`/tickets/${selected.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply, attachments: replyAttachments }),
      });
      setSelected(result.ticket);
      setReply("");
      setReplyAttachments([]);
      await loadTickets();
    } catch (replyError) {
      setError(replyError.message);
    } finally {
      setBusy(false);
    }
  }

  async function generateAiTitle() {
    if (!form.description.trim()) {
      setError("Please enter a description first so AI can suggest a suitable title.");
      return;
    }
    setError("");
    setSuggestingTitle(true);
    try {
      const res = await apiRequest("/ai/suggest-title", {
        method: "POST",
        body: JSON.stringify({ description: form.description, category: form.category }),
      });
      if (res.title) {
        setForm((prev) => ({ ...prev, subject: res.title }));
      }
    } catch (err) {
      setError(err.message || "Failed to generate AI title.");
    } finally {
      setSuggestingTitle(false);
    }
  }

  const metrics = [
    ["Total Tickets", tickets.length],
    ["Open", tickets.filter((t) => t.status === "Open").length],
    ["In Progress", tickets.filter((t) => t.status === "In Progress").length],
    ["Resolved", tickets.filter((t) => t.status === "Resolved").length],
  ];

  const statusClass = (value) =>
    value === "Resolved"
      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
      : value === "In Progress"
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";

  return (
    <div className="min-h-screen bg-slate-50 pb-12 transition-colors dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-emerald-900 bg-emerald-950 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              SyncBot / Customer Portal
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              Welcome back, {user?.name || "Customer"}
            </h1>
          </div>
          <span className="max-w-full truncate rounded-full bg-emerald-800/80 px-4 py-1.5 text-xs font-semibold text-emerald-100">
            {user?.email}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Customer Support Center
            </p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
              How can we help you?
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              Create and track support requests with real-time updates and SLA guarantees.
            </p>
          </div>

          <button
            onClick={() => {
              setSelected(null);
              setView("create");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <PlusCircle className="h-4 w-4" />
            Create New Ticket
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Dashboard View */}
        {!selected && view !== "create" && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {metrics.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">My Support Tickets</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {tickets.length} total
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => {
                      setSelected(ticket);
                      setView("details");
                    }}
                    statusClass={statusClass}
                  />
                ))}

                {!tickets.length && (
                  <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    No tickets yet. Click "Create New Ticket" to submit your first request.
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Ticket Creation View */}
        {view === "create" && (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <CreateForm
              form={form}
              setForm={setForm}
              submit={createTicket}
              cancel={() => setView("dashboard")}
              busy={busy}
              generateAiTitle={generateAiTitle}
              suggestingTitle={suggestingTitle}
            />
            <FaqList />
          </div>
        )}

        {/* Ticket Details View */}
        {view === "details" && selected && (
          <Details
            ticket={selected}
            onRated={(updatedTicket) => {
              setSelected(updatedTicket);
              loadTickets();
            }}
            back={() => {
              setSelected(null);
              setView("dashboard");
            }}
            reply={reply}
            setReply={setReply}
            replyAttachments={replyAttachments}
            setReplyAttachments={setReplyAttachments}
            submit={sendReply}
            busy={busy}
            statusClass={statusClass}
          />
        )}
      </main>

      <ChatAssistant />
    </div>
  );
}

function TicketRow({ ticket, onClick, statusClass }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/40"
    >
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {ticket.id}
          </span>
          <SlaBadge sla={ticket.sla} status={ticket.status} compact />
        </div>
        <p className="mt-1 font-semibold text-slate-900 dark:text-white">{ticket.subject}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{ticket.category}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {ticket.priority}
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>
    </button>
  );
}

function CreateForm({
  form,
  setForm,
  submit,
  cancel,
  busy,
  generateAiTitle,
  suggestingTitle,
}) {
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Create a Support Ticket
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Describe your problem in detail. Browse the FAQs alongside this form for answers to common questions.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5">
        {/* Description First (Enables AI Title) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Description of the Issue
          </label>
          <textarea
            required
            rows="5"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Please detail what happened, any error messages, and steps to reproduce..."
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Subject with AI Generator */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Ticket Subject
            </label>
            <button
              type="button"
              disabled={suggestingTitle || !form.description.trim()}
              onClick={generateAiTitle}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-40 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{suggestingTitle ? "Generating..." : "✨ Suggest Title with AI"}</span>
            </button>
          </div>
          <input
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="e.g., Billing discrepancy on monthly invoice"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Contact info */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Contact Information (Email / Phone)
          </label>
          <input
            required
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="your-email@example.com"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option>Technical Issue</option>
              <option>Billing</option>
              <option>Account</option>
              <option>Product</option>
              <option>General Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Priority (SLA)
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="Low">Low (24h response SLA)</option>
              <option value="Medium">Medium (8h response SLA)</option>
              <option value="High">High (4h response SLA)</option>
              <option value="Critical">Critical (2h response SLA)</option>
            </select>
          </div>
        </div>

        {/* File Attachments */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Attachments (Screenshots / Logs)
          </label>
          <FileUpload
            attachments={form.attachments}
            onChange={(atts) => setForm({ ...form, attachments: atts })}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
          <button
            type="button"
            onClick={cancel}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {busy ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Details({
  ticket,
  onRated,
  back,
  reply,
  setReply,
  replyAttachments,
  setReplyAttachments,
  submit,
  busy,
  statusClass,
}) {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={back}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all tickets
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {ticket.id}
              </span>
              <SlaBadge sla={ticket.sla} status={ticket.status} />
            </div>
            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {ticket.subject}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {ticket.category} &bull; Priority: <strong>{ticket.priority}</strong>
              {ticket.assignedAgent && (
                <span> &bull; Assigned Agent: <strong>{ticket.assignedAgent.name || "Agent"}</strong></span>
              )}
            </p>
          </div>

          <span className={`h-fit rounded-full px-3.5 py-1 text-xs font-semibold ${statusClass(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Customer Satisfaction Rating Widget */}
      {["Resolved", "Closed"].includes(ticket.status) && (
        <CsatModal ticket={ticket} onRated={onRated} />
      )}

      {/* Conversation Thread */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h4 className="border-b border-slate-100 pb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Conversation History ({ticket.messages?.length || 0})
        </h4>

        <div className="mt-6 space-y-4">
          {(ticket.messages || []).map((msg, idx) => {
            const isAgent = msg.author?.role === "agent" || msg.author?.role === "admin";

            return (
              <div
                key={msg._id || msg.id || idx}
                className={`rounded-2xl p-4.5 text-xs leading-relaxed ${
                  isAgent
                    ? "border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : "border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {msg.author?.name || (isAgent ? "Support Agent" : "You")}
                  </span>
                  <span className="text-[10px]">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>

                <p className="mt-2 text-slate-800 whitespace-pre-wrap dark:text-slate-200">
                  {msg.body}
                </p>

                {/* Attachments */}
                <AttachmentList attachments={msg.attachments} />
              </div>
            );
          })}
        </div>

        {/* Reply Composer */}
        {ticket.status !== "Closed" && (
          <form onSubmit={submit} className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <textarea
              rows="3"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your response to the support agent..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <FileUpload
                attachments={replyAttachments}
                onChange={setReplyAttachments}
              />

              <button
                type="submit"
                disabled={busy || (!reply.trim() && !replyAttachments.length)}
                className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                {busy ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default Customer;
