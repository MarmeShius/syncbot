import { useCallback, useEffect, useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  Search,
  Send,
  FileText,
  Users,
} from "lucide-react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import SlaBadge from "../components/SlaBadge";
import FileUpload from "../components/FileUpload";
import AttachmentList from "../components/AttachmentList";

const statuses = [
  "Open",
  "In Progress",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];

const priorities = ["Critical", "High", "Medium", "Low"];

function Agent() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeView, setActiveView] = useState("queue");
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    slaFilter: "",
  });

  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [note, setNote] = useState("");
  const [noteAttachments, setNoteAttachments] = useState([]);

  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTickets() {
    try {
      const query = new URLSearchParams({ limit: "50" });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });

      const result = await apiRequest(`/tickets?${query}`);
      setTickets(result.tickets);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  const loadCustomers = useCallback(async () => {
    try {
      const result = await apiRequest("/agent/customers");
      setCustomers(result.customers || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.priority, filters.slaFilter]);

  // Real-time Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;

    const handleCustomerRegistered = ({ customer }) => {
      if (!customer) return;
      setCustomers((prev) => [customer, ...prev.filter((item) => item.id !== customer.id)]);
    };

    const handleUpdate = ({ ticket }) => {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
      setSelected((curr) => (curr && curr.id === ticket.id ? ticket : curr));
    };

    const handleCreated = ({ ticket }) => {
      setTickets((prev) => [ticket, ...prev.filter((t) => t.id !== ticket.id)]);
    };

    socket.on("ticket:created", handleCreated);
    socket.on("ticket:updated", handleUpdate);
    socket.on("ticket:message", handleUpdate);
    socket.on("ticket:note", handleUpdate);
    socket.on("ticket:csat", handleUpdate);
    socket.on("customer:registered", handleCustomerRegistered);

    return () => {
      socket.off("ticket:created", handleCreated);
      socket.off("ticket:updated", handleUpdate);
      socket.off("ticket:message", handleUpdate);
      socket.off("ticket:note", handleUpdate);
      socket.off("ticket:csat", handleUpdate);
      socket.off("customer:registered", handleCustomerRegistered);
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

  async function changeTicket(field, value) {
    setBusy(true);
    try {
      const result = await apiRequest(`/tickets/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      setSelected(result.ticket);
      await loadTickets();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAutoAssign() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await apiRequest(`/tickets/${selected.id}/auto-assign`, {
        method: "POST",
      });
      setSelected(res.ticket);
      await loadTickets();
    } catch (assignError) {
      setError(assignError.message);
    } finally {
      setBusy(false);
    }
  }

  async function analyzeTicket() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await apiRequest(`/tickets/${selected.id}/ai-analysis`, {
        method: "POST",
      });
      setAnalysis({ ...result.analysis, mode: result.mode });
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setBusy(false);
    }
  }

  async function postMessage(kind) {
    const isNote = kind === "notes";
    const body = isNote ? note : reply;
    const attachments = isNote ? noteAttachments : replyAttachments;

    if (!body.trim() && !attachments.length) return;

    setBusy(true);
    try {
      const result = await apiRequest(`/tickets/${selected.id}/${kind}`, {
        method: "POST",
        body: JSON.stringify({ body, attachments }),
      });

      setSelected(result.ticket);
      if (isNote) {
        setNote("");
        setNoteAttachments([]);
      } else {
        setReply("");
        setReplyAttachments([]);
      }
      await loadTickets();
    } catch (messageError) {
      setError(messageError.message);
    } finally {
      setBusy(false);
    }
  }

  const metrics = [
    ["Total", tickets.length],
    ["Open", tickets.filter((t) => t.status === "Open").length],
    ["In Progress", tickets.filter((t) => t.status === "In Progress").length],
    ["Resolved", tickets.filter((t) => t.status === "Resolved").length],
    ["High/Critical", tickets.filter((t) => ["High", "Critical"].includes(t.priority)).length],
    ["Breached SLA", tickets.filter((t) => t.slaEvaluation?.isBreached).length],
  ];

  return (
    <div className="agent-workspace min-h-screen bg-slate-50 pb-12 transition-colors dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950 text-white transition-colors">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              SyncBot / Agent Workspace
            </p>
            <h1 className="mt-1 text-xl font-bold text-white">
              Agent Portal &bull; {user?.name || "Agent"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-3.5 py-1 text-xs text-slate-300">
              {user?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {!selected ? (
          <>
            <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveView("queue")}
                className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeView === "queue" ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                Ticket Queue
              </button>
              <button
                type="button"
                onClick={() => setActiveView("customers")}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${activeView === "customers" ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"}`}
              >
                <Users className="h-4 w-4" /> Customers <span className="text-xs">({customers.length})</span>
              </button>
            </div>
            {activeView === "queue" ? (
              <Queue
                metrics={metrics}
                tickets={tickets}
                filters={filters}
                setFilters={setFilters}
                openTicket={(ticket) => {
                  setSelected(ticket);
                  setAnalysis(null);
                }}
              />
            ) : (
              <CustomerDirectory customers={customers} />
            )}
          </>
        ) : (
          <Details
            selected={selected}
            setSelected={setSelected}
            statuses={statuses}
            priorities={priorities}
            changeTicket={changeTicket}
            handleAutoAssign={handleAutoAssign}
            analyzeTicket={analyzeTicket}
            analysis={analysis}
            busy={busy}
            reply={reply}
            setReply={setReply}
            replyAttachments={replyAttachments}
            setReplyAttachments={setReplyAttachments}
            note={note}
            setNote={setNote}
            noteAttachments={noteAttachments}
            setNoteAttachments={setNoteAttachments}
            postMessage={postMessage}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================
   CUSTOMER DIRECTORY
========================================= */

function CustomerDirectory({ customers }) {
  const [search, setSearch] = useState("");
  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.username} ${customer.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">Registered Customers</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New registrations appear here automatically.</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, username, or email"
          className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none sm:max-w-sm dark:border-slate-700 dark:text-white"
        />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{customer.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{customer.username} · {customer.email}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {customer.createdAt ? `Registered ${new Date(customer.createdAt).toLocaleDateString()}` : "Registration date unavailable"}
            </p>
          </div>
        ))}
        {!filteredCustomers.length && (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {customers.length ? "No customers match your search." : "No registered customers yet."}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================
   TICKET QUEUE
========================================= */

function Queue({ metrics, tickets, filters, setFilters, openTicket }) {
  return (
    <>
      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs transition dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search ID, subject, customer..."
            className="w-full rounded-xl border border-slate-200 bg-transparent py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:text-white"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Statuses</option>
          {statuses.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All Priorities</option>
          {priorities.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>

        <select
          value={filters.slaFilter}
          onChange={(e) => setFilters({ ...filters, slaFilter: e.target.value })}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">All SLA Statuses</option>
          <option value="breached">🚨 Breached SLA Only</option>
          <option value="at_risk">⚠️ At Risk SLA (&lt; 1h)</option>
        </select>
      </div>

      {/* Queue List */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Active Support Queue</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Sorted by urgency, SLA targets, and update time.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {ticket.id}
                  </span>
                  <SlaBadge sla={ticket.sla} status={ticket.status} compact />
                  {ticket.csat?.rating && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      ★ {ticket.csat.rating}.0
                    </span>
                  )}
                </div>

                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {ticket.subject}
                </p>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {ticket.customer?.name || "Customer"} &bull; {ticket.category}
                  {ticket.assignedAgent ? (
                    <span className="ml-1 text-slate-600 dark:text-slate-300">
                      &bull; Assigned: {ticket.assignedAgent.name}
                    </span>
                  ) : (
                    <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold">
                      &bull; Unassigned
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {ticket.priority}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    ticket.status === "Resolved"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : ticket.status === "In Progress"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </button>
          ))}

          {!tickets.length && (
            <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No tickets found matching your queue filters.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* =========================================
   TICKET DETAILS
========================================= */

function Details({
  selected,
  setSelected,
  statuses,
  priorities,
  changeTicket,
  handleAutoAssign,
  analyzeTicket,
  analysis,
  busy,
  reply,
  setReply,
  replyAttachments,
  setReplyAttachments,
  note,
  setNote,
  noteAttachments,
  setNoteAttachments,
  postMessage,
}) {
  return (
    <section>
      <button
        onClick={() => setSelected(null)}
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Conversation & Composer */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {selected.id}
                  </span>
                  <SlaBadge sla={selected.sla} status={selected.status} />
                  {selected.csat?.rating && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                      ★ {selected.csat.rating}.0 Customer Rating
                    </span>
                  )}
                </div>

                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {selected.subject}
                </h2>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Customer: <strong>{selected.customer?.name || "Customer"}</strong> ({selected.customer?.email}) &bull; Category: {selected.category}
                </p>
              </div>
              <button
                type="button"
                onClick={analyzeTicket}
                disabled={busy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{busy ? "Analyzing..." : "Analyze with AI"}</span>
              </button>
            </div>

            {/* Conversation list */}
            <div className="mt-6 space-y-4">
              {(selected.messages || []).map((message, idx) => {
                const isNote = message.kind === "note";
                const isCustomer = message.author?.role === "customer";

                return (
                  <div
                    key={message._id || message.id || idx}
                    className={`rounded-2xl p-4.5 text-xs leading-relaxed ${
                      isNote
                        ? "border border-amber-300 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30"
                        : isCustomer
                        ? "border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40"
                        : "border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {message.author?.name || (isCustomer ? "Customer" : "Agent")}
                        </span>
                        {isNote && (
                          <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            INTERNAL NOTE
                          </span>
                        )}
                      </div>
                      <span className="text-[10px]">
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : ""}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-800 whitespace-pre-wrap dark:text-slate-200">
                      {message.body}
                    </p>

                    <AttachmentList attachments={message.attachments} />
                  </div>
                );
              })}
            </div>

            {/* Response & Note Composers */}
            <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2 dark:border-slate-800">
              {/* Customer Reply */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Reply to Customer
                </label>
                <textarea
                  rows="3"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type an official reply to the customer..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />

                <FileUpload
                  attachments={replyAttachments}
                  onChange={setReplyAttachments}
                />

                <button
                  type="button"
                  disabled={busy || (!reply.trim() && !replyAttachments.length)}
                  onClick={() => postMessage("messages")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Reply</span>
                </button>
              </div>

              {/* Internal Staff Note */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Add Internal Staff Note
                </label>
                <textarea
                  rows="3"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a private note (only visible to agents & admin)..."
                  className="w-full rounded-xl border border-amber-200 bg-amber-50/30 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-600 focus:outline-none dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-white dark:placeholder-slate-500"
                />

                <FileUpload
                  attachments={noteAttachments}
                  onChange={setNoteAttachments}
                />

                <button
                  type="button"
                  disabled={busy || (!note.trim() && !noteAttachments.length)}
                  onClick={() => postMessage("notes")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Add Note</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Controls */}
        <aside className="space-y-5">
          {/* Controls Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Ticket Controls</h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status
                </label>
                <select
                  value={selected.status}
                  onChange={(e) => changeTicket("status", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {statuses.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Priority
                </label>
                <select
                  value={selected.priority}
                  onChange={(e) => changeTicket("priority", e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {priorities.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Assigned Agent
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {selected.assignedAgent?.name || "Unassigned"}
                  </span>
                  {!selected.assignedAgent && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleAutoAssign}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Auto-Assign
                    </button>
                  )}
                </div>
              </div>

              {selected.csat?.rating && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                    Customer CSAT Feedback
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-amber-600">
                    {"★".repeat(selected.csat.rating)}
                    <span className="ml-1 text-xs text-slate-600 dark:text-slate-300">
                      ({selected.csat.rating}/5)
                    </span>
                  </p>
                  {selected.csat.feedback && (
                    <p className="mt-1 text-xs italic text-slate-600 dark:text-slate-300">
                      "{selected.csat.feedback}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {analysis && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                <h3 className="font-bold text-sm">AI Ticket Analysis</h3>
              </div>
              <dl className="mt-4 space-y-2.5 text-xs">
                <div>
                  <dt className="font-semibold text-slate-700 dark:text-slate-300">Summary</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{analysis.summary}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700 dark:text-slate-300">Category and priority</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{analysis.category} · {analysis.priority}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700 dark:text-slate-300">Sentiment</dt>
                  <dd className="font-medium text-emerald-700 dark:text-emerald-400">{analysis.sentiment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700 dark:text-slate-300">Suggested response</dt>
                  <dd className="text-slate-600 dark:text-slate-400 italic">{analysis.suggestedResponse}</dd>
                  <button
                    type="button"
                    onClick={() => setReply(analysis.suggestedResponse || "")}
                    className="mt-1 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Use this response
                  </button>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700 dark:text-slate-300">Recommended action</dt>
                  <dd className="text-slate-600 dark:text-slate-400">{analysis.recommendedAction}</dd>
                </div>
              </dl>
            </div>
          )}

        </aside>
      </div>
    </section>
  );
}

export default Agent;
