import { Link } from "react-router-dom";

const steps = [
  [
    "01",
    "Customer writes",
    "A clear request enters one shared queue with instant AI deflection.",
    "from-emerald-500 to-teal-500",
  ],
  [
    "02",
    "AI prepares & routes",
    "Ticket titles are suggested, SLAs computed, and agents assigned automatically.",
    "from-amber-400 to-orange-400",
  ],
  [
    "03",
    "Agent resolves & delights",
    "Staff reply in real-time, enforce SLA deadlines, and collect CSAT ratings.",
    "from-sky-400 to-blue-500",
  ],
];

function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-emerald-700 transition-colors dark:bg-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1f18] text-white">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -right-32 -top-32 h-125 w-125 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-300/5 blur-3xl" />
        </div>

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="page-container relative z-10 grid items-center gap-16 py-16 lg:grid-cols-[1fr_.95fr] lg:py-24 xl:gap-24">
          {/* LEFT */}
          <div className="animate-fade-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-lg shadow-emerald-950/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              AI-assisted support operations
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-6xl xl:text-7xl">
              Make every support conversation feel{" "}
              <span className="bg-linear-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                thoughtfully handled.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              SyncBot brings real-time customer requests, SLA tracking, RAG knowledge bases, and practical
              AI guidance into one calm workspace.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group rounded-2xl bg-emerald-400 px-7 py-4 text-center font-bold text-[#0b1f18] shadow-xl shadow-emerald-950/30 transition duration-300 hover:-translate-y-1 hover:bg-emerald-300 hover:shadow-2xl"
              >
                Start a conversation
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                to="/login"
                className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-center font-semibold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-white/10 hover:text-emerald-200"
              >
                Sign in to workspace
              </Link>
            </div>

            {/* Trust points */}
            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Real-time WebSockets",
                "SLA Deadline Engine",
                "AI RAG Knowledge Base",
                "CSAT Ratings",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-400"
                >
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT WORKFLOW */}
          <WorkflowPreview />
        </div>
      </section>

      {/* STEPS */}
      <section className="relative bg-white py-20 lg:py-28 transition-colors dark:bg-slate-900">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              A better handoff
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              From “something is wrong” to{" "}
              <span className="text-emerald-700 dark:text-emerald-400">“we’ve got this.”</span>
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-500 dark:text-slate-400">
              Every part of the support journey stays visible in real time, while private internal notes and SLA tracking keep the operation organized.
            </p>
          </div>

          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-12 hidden h-px bg-linear-to-r from-emerald-200 via-amber-200 to-sky-200 md:block dark:from-emerald-900 dark:via-amber-900 dark:to-sky-900" />

            {steps.map(([number, title, text, gradient], index) => (
              <div
                key={number}
                className="group relative rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${gradient} text-sm font-extrabold text-white shadow-lg transition-transform duration-300 group-hover:scale-110`}
                >
                  {number}
                </div>

                <h3 className="mt-7 text-xl font-extrabold text-slate-950 dark:text-white">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">{text}</p>

                <div className="mt-6 h-1 w-10 rounded-full bg-slate-100 transition-all duration-300 group-hover:w-20 group-hover:bg-emerald-400 dark:bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative overflow-hidden border-y border-emerald-100 bg-emerald-50/60 py-20 lg:py-28 transition-colors dark:border-slate-800 dark:bg-slate-950">
        <div className="page-container relative z-10 grid items-center gap-14 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <span className="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Designed for focus
            </span>

            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              Less dashboard noise.
              <br />
              <span className="text-emerald-700 dark:text-emerald-400">More useful action.</span>
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-400">
              Customers get a simple portal with AI title generation and instant FAQ self-service. Agents get least-loaded auto-routing, SLA clocks, and AI copilots.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Feature
              icon="◉"
              title="Real-Time Sync"
              text="Instant WebSockets streaming for messages, status changes, and ratings."
            />

            <Feature
              icon="✦"
              title="SLA Guardrails"
              text="Automated response and resolution deadlines per ticket priority."
            />

            <Feature
              icon="⌁"
              title="AI & Knowledge RAG"
              text="Ground answers in verified company documentation."
            />

            <Feature
              icon="↗"
              title="CSAT Satisfaction"
              text="5-star rating surveys and analytics after every resolution."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-white py-20 text-center lg:py-28 transition-colors dark:bg-slate-900">
        <div className="page-container relative z-10">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            Ready when you are
          </span>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
            Give your next customer a{" "}
            <span className="text-emerald-700 dark:text-emerald-400">clearer answer.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-500 dark:text-slate-400">
            Create an account and start experiencing smart AI customer support in less than a minute.
          </p>

          <Link
            to="/register"
            className="group mt-9 inline-flex items-center rounded-2xl bg-emerald-700 px-8 py-4 font-bold text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-emerald-800 hover:shadow-2xl dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            Create customer account
            <span className="ml-2 transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function WorkflowPreview() {
  return (
    <div className="relative animate-float">
      <div className="absolute -inset-5 rounded-[3rem] bg-emerald-400/10 blur-3xl" />

      <div className="relative rounded-4xl border border-white/10 bg-white/8 p-2 shadow-2xl backdrop-blur-xl">
        <div className="overflow-hidden rounded-[1.6rem] bg-[#f7faf8] text-slate-900 dark:bg-slate-900 dark:text-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                Live workflow
              </span>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-7">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    TKT-1042 &bull; SLA 3h 40m left
                  </p>
                  <h3 className="mt-2 text-base font-extrabold text-slate-900 dark:text-white">
                    Payment needs a second look
                  </h3>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  In progress
                </span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                “I was charged, but my order still says unpaid.”
              </p>
            </div>

            <div className="ml-4 border-l-2 border-dashed border-emerald-300 pl-5 dark:border-emerald-700">
              <div className="rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50 p-4 shadow-sm dark:border-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/40">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-sm text-white shadow-md">
                    ✦
                  </span>
                  <div>
                    <p className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                      RAG Context Match
                    </p>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                      Cited KB: "Billing Inquiries &amp; Refund Policy"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#10251e] p-5 shadow-xl text-white">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Agent Response
                </p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-300">
                  Human
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-200">
                Thanks for reporting this. We have verified the transaction reference with our billing gateway and confirmed the order is now active.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, text, icon }) {
  return (
    <div className="group rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700 transition duration-300 group-hover:scale-110 group-hover:bg-emerald-700 group-hover:text-white dark:bg-slate-800 dark:text-emerald-400">
        {icon}
      </div>
      <h3 className="mt-5 font-extrabold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

export default Home;