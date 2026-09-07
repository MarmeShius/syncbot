import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/useAuth";

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

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
  });

  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");

  const [analysis, setAnalysis] = useState(null);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTickets() {
    try {
      const query = new URLSearchParams({
        limit: "50",
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query.set(key, value);
        }
      });

      const result = await apiRequest(`/tickets?${query}`);

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.priority]);

  async function changeTicket(field, value) {
    setBusy(true);

    try {
      const result = await apiRequest(`/tickets/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          [field]: value,
        }),
      });

      setSelected(result.ticket);

      await loadTickets();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusy(false);
    }
  }

  async function postMessage(path, body) {
    if (!body.trim()) return;

    setBusy(true);

    try {
      const result = await apiRequest(`/tickets/${selected.id}/${path}`, {
        method: "POST",
        body: JSON.stringify({
          body,
        }),
      });

      setSelected(result.ticket);

      setReply("");
      setNote("");

      await loadTickets();
    } catch (messageError) {
      setError(messageError.message);
    } finally {
      setBusy(false);
    }
  }

  async function analyzeTicket() {
    setBusy(true);

    try {
      const result = await apiRequest(
        `/tickets/${selected.id}/ai-analysis`,
        {
          method: "POST",
        }
      );

      setAnalysis({
        ...result.analysis,
        mode: result.mode,
      });
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setBusy(false);
    }
  }

  const metrics = [
    ["Total", tickets.length],

    [
      "Customers reporting",
      new Set(
        tickets.map(
          (ticket) => ticket.customer?.id || ticket.customer
        )
      ).size,
    ],

    [
      "Open",
      tickets.filter((ticket) => ticket.status === "Open").length,
    ],

    [
      "In progress",
      tickets.filter(
        (ticket) => ticket.status === "In Progress"
      ).length,
    ],

    [
      "Resolved",
      tickets.filter(
        (ticket) => ticket.status === "Resolved"
      ).length,
    ],

    [
      "High priority",
      tickets.filter((ticket) =>
        ["High", "Critical"].includes(ticket.priority)
      ).length,
    ],
  ];

  return (
    <div className="agent-workspace min-h-screen bg-slate-100 pb-12">

      {/* HEADER */}
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
              SyncBot / Agent Workspace
            </p>

            <h1 className="mt-1 text-xl font-bold">
              Good to see you, {user?.name || "Agent"}
            </h1>
          </div>

          <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
            {user?.email}
          </span>

        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* TICKET AREA */}
        {!selected ? (
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
          <Details
            selected={selected}
            setSelected={setSelected}
            statuses={statuses}
            priorities={priorities}
            changeTicket={changeTicket}
            analyzeTicket={analyzeTicket}
            analysis={analysis}
            busy={busy}
            reply={reply}
            setReply={setReply}
            note={note}
            setNote={setNote}
            postMessage={postMessage}
          />
        )}

      </main>
    </div>
  );
}


/* =========================================
   TICKET QUEUE
========================================= */

function Queue({
  metrics,
  tickets,
  filters,
  setFilters,
  openTicket,
}) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">

        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {value}
            </p>
          </div>
        ))}

      </div>


      <div className="mb-5 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3">

        <input
          value={filters.search}
          onChange={(event) =>
            setFilters({
              ...filters,
              search: event.target.value,
            })
          }
          placeholder="Search subject, ID, customer"
          className="rounded-lg border px-4 py-3"
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters({
              ...filters,
              status: event.target.value,
            })
          }
          className="rounded-lg border bg-white px-4 py-3"
        >
          <option value="">All statuses</option>

          {statuses.map((option) => (
            <option key={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(event) =>
            setFilters({
              ...filters,
              priority: event.target.value,
            })
          }
          className="rounded-lg border bg-white px-4 py-3"
        >
          <option value="">All priorities</option>

          {priorities.map((option) => (
            <option key={option}>
              {option}
            </option>
          ))}
        </select>

      </div>


      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">

        <div className="border-b px-5 py-4">

          <h2 className="font-bold">
            Ticket queue
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Every row is a customer complaint received by support.
          </p>

        </div>


        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => openTicket(ticket)}
            className="flex w-full flex-col gap-3 border-b p-5 text-left hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
          >

            <div>

              <p className="text-xs font-bold text-indigo-600">
                {ticket.id}
              </p>

              <p className="mt-1 font-semibold">
                {ticket.subject}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {ticket.customer?.name || "Customer"} ·{" "}
                {ticket.category}
              </p>

            </div>

            <div className="flex gap-2">
              <Badge value={ticket.priority} />
              <Badge value={ticket.status} />
            </div>

          </button>
        ))}


        {!tickets.length && (
          <p className="p-10 text-center text-sm text-slate-500">
            No tickets match these filters.
          </p>
        )}

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
  analyzeTicket,
  analysis,
  busy,
  reply,
  setReply,
  note,
  setNote,
  postMessage,
}) {
  return (
    <section>

      <button
        onClick={() => setSelected(null)}
        className="mb-6 text-sm font-semibold text-indigo-600"
      >
        ← Back to queue
      </button>


      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex min-w-0 flex-col gap-5 border-b border-slate-200 p-6 md:flex-row md:items-start md:justify-between md:p-8">

            <div className="min-w-0">

              <p className="text-xs font-bold text-indigo-600">
                {selected.id}
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {selected.subject}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {selected.customer?.name || "Customer"} ·{" "}
                {selected.category}
              </p>

            </div>


            <button
              onClick={analyzeTicket}
              disabled={busy}
              className="h-fit shrink-0 rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700"
            >
              {busy
                ? "Working..."
                : "🤖 Analyze with AI"}
            </button>

          </div>


          <div className="space-y-5 p-6 md:p-8">

            {(selected.messages || []).map((message) => (
              <div
                key={
                  message._id ||
                  message.id ||
                  message.createdAt
                }
                className={`rounded-xl p-4 text-sm leading-6 ${
                  message.kind === "note"
                    ? "border border-amber-200 bg-amber-50"
                    : "bg-slate-100"
                }`}
              >

                <p className="mb-1 text-xs font-bold uppercase text-slate-500">
                  {message.kind === "note"
                    ? "Internal note"
                    : "Conversation"}
                </p>

                {message.body}

              </div>
            ))}

          </div>


          <div className="grid gap-5 border-t border-slate-200 p-6 md:grid-cols-2 md:p-8">

            <form
              onSubmit={(event) => {
                event.preventDefault();
                postMessage("messages", reply);
              }}
            >

              <textarea
                required
                value={reply}
                onChange={(event) =>
                  setReply(event.target.value)
                }
                rows="3"
                placeholder="Reply to customer"
                className="w-full rounded-lg border px-4 py-3"
              />

              <button className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Send reply
              </button>

            </form>


            <form
              onSubmit={(event) => {
                event.preventDefault();
                postMessage("notes", note);
              }}
            >

              <textarea
                required
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                rows="3"
                placeholder="Add internal note"
                className="w-full rounded-lg border px-4 py-3"
              />

              <button className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white">
                Add note
              </button>

            </form>

          </div>

        </div>


        <aside className="min-w-0 space-y-5">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="font-bold">
              Ticket controls
            </h3>


            <label className="mt-5 block text-sm font-medium">
              Status

              <select
                value={selected.status}
                onChange={(event) =>
                  changeTicket(
                    "status",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-white px-3 py-2"
              >

                {statuses.map((option) => (
                  <option key={option}>
                    {option}
                  </option>
                ))}

              </select>

            </label>


            <label className="mt-5 block text-sm font-medium">
              Priority

              <select
                value={selected.priority}
                onChange={(event) =>
                  changeTicket(
                    "priority",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border bg-white px-3 py-2"
              >

                {priorities.map((option) => (
                  <option key={option}>
                    {option}
                  </option>
                ))}

              </select>

            </label>

          </div>


          {analysis && (
            <div className="min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">

              <h3 className="font-bold text-indigo-950">
                🤖 AI Ticket Analysis
              </h3>

              <dl className="mt-4 space-y-3 text-sm">

                <div>
                  <dt className="font-semibold">
                    Summary
                  </dt>

                  <dd>
                    <span className="block wrap-break-word">{analysis.summary}</span>
                  </dd>
                </div>


                <div>
                  <dt className="font-semibold">
                    Category / priority
                  </dt>

                  <dd>
                    {analysis.category} ·{" "}
                    {analysis.priority}
                  </dd>
                </div>


                <div>
                  <dt className="font-semibold">
                    Sentiment
                  </dt>

                  <dd>
                    {analysis.sentiment}
                  </dd>
                </div>


                <div>
                  <dt className="font-semibold">
                    Suggested response
                  </dt>

                  <dd>
                    <span className="block wrap-break-word">{analysis.suggestedResponse}</span>
                  </dd>
                </div>


                <div>
                  <dt className="font-semibold">
                    Next action
                  </dt>

                  <dd>
                    <span className="block wrap-break-word">{analysis.recommendedAction}</span>
                  </dd>
                </div>

              </dl>

            </div>
          )}

        </aside>

      </div>

    </section>
  );
}


/* =========================================
   BADGE
========================================= */

function Badge({ value }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {value}
    </span>
  );
}


export default Agent;