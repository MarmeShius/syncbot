function About() {
  return (
    <div className="bg-[#86c6af] transition-colors dark:bg-slate-950">
      {/* Header */}
      <section className="border-b border-green-300 bg-green-200 py-16 sm:py-20 transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="page-container max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            About SyncBot
          </p>

          <h1 className="mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl dark:text-white">
            Making customer support
            <span className="text-emerald-700 dark:text-emerald-400"> smarter.</span>
          </h1>

          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-300">
            SyncBot is an AI-enhanced customer support and ticket operations platform designed to make communication between customers and support teams real-time, SLA-guaranteed, and backed by grounded knowledge.
          </p>
        </div>
      </section>

      {/* Main About */}
      <section className="page-container py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Visual */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7 shadow-xl">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg">
                  🤖
                </div>
                <div>
                  <p className="font-bold text-white text-sm">SyncBot AI Copilot</p>
                  <p className="text-xs text-slate-400">RAG Knowledge Assistant</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="rounded-xl bg-slate-800 p-3.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUMMARY</p>
                  <p className="mt-1 text-xs text-slate-200">
                    Customer is experiencing difficulty accessing their account due to repeated password errors.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-800 p-3.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PRIORITY</p>
                    <p className="mt-1 text-xs font-bold text-rose-400">High (4h SLA)</p>
                  </div>
                  <div className="rounded-xl bg-slate-800 p-3.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SENTIMENT</p>
                    <p className="mt-1 text-xs font-bold text-amber-400">Frustrated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              OUR MISSION
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              Support teams should spend less time organizing tickets and more time helping people.
            </h2>

            <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Traditional support software creates bottlenecks and manual toil. SyncBot unifies real-time ticket streaming, automated least-loaded agent assignment, SLA deadline enforcement, and grounded RAG knowledge bases into one cohesive platform.
            </p>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Customers enjoy instant self-service FAQ suggestions, file uploads, and CSAT surveys, while support staff leverage AI analysis to resolve inquiries faster than ever before.
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-green-300 bg-white py-16 sm:py-20 transition-colors dark:border-slate-800 dark:bg-slate-900">
        <div className="page-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Built for every part of your support operations
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Each role receives dedicated workflows and tailored controls.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-green-300 bg-[#86c6af] p-7 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="text-3xl">👤</div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">Customers</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
                Submit requests with AI-generated titles, browse self-service FAQs, attach diagnostic files, follow real-time replies, and rate satisfaction upon resolution.
              </p>
            </div>

            <div className="rounded-2xl border border-green-300 bg-[#86c6af] p-7 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="text-3xl">🎧</div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">Support Agents</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
                Receive auto-assigned tickets, track priority SLA countdowns, consult AI copilots with Knowledge Base snippet inserts, and exchange private internal notes.
              </p>
            </div>

            <div className="rounded-2xl border border-green-300 bg-[#86c6af] p-7 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <div className="text-3xl">👨‍💼</div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">Administrators</h3>
              <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-400">
                Inspect live operational analytics dashboards, manage user roles, toggle automated agent routing, and curate the authoritative company Knowledge Base.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
