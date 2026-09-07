function About() {
  return (
    <div className="bg-white">

      {/* Header */}
      <section className="bg-linear-to-br from-purple-50 to-indigo-50 py-16 sm:py-20">

        <div className="page-container max-w-4xl text-center">

          <p className="font-semibold uppercase tracking-wider text-purple-600">
            About SyncBot
          </p>

          <h1 className="mt-3 text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Making customer support
            <span className="text-purple-600"> smarter.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            SyncBot is an AI-enhanced customer support and ticket management
            platform designed to make communication between customers and
            support teams simpler, faster, and more organized.
          </p>

        </div>

      </section>

      {/* Main About */}
      <section className="page-container py-16 sm:py-20">

        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Visual */}
          <div className="border-2 border-gray-800 bg-gray-950 p-8 shadow-xl">

            <div className="border border-gray-700 bg-gray-900 p-6">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600">
                  🤖
                </div>

                <div>
                  <p className="font-semibold text-white">
                    SyncBot AI
                  </p>

                  <p className="text-sm text-gray-400">
                    Ticket Assistant
                  </p>
                </div>
              </div>

              <div className="space-y-4">

                <div className="rounded-xl bg-gray-800 p-4">
                  <p className="text-xs text-gray-400">
                    SUMMARY
                  </p>

                  <p className="mt-2 text-sm text-gray-200">
                    Customer is experiencing difficulty accessing their
                    account.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">

                  <div className="rounded-xl bg-gray-800 p-4">
                    <p className="text-xs text-gray-400">
                      PRIORITY
                    </p>

                    <p className="mt-2 font-semibold text-red-400">
                      High
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-800 p-4">
                    <p className="text-xs text-gray-400">
                      SENTIMENT
                    </p>

                    <p className="mt-2 font-semibold text-yellow-400">
                      Frustrated
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* Text */}
          <div>

            <p className="font-semibold text-purple-600">
              OUR MISSION
            </p>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Support teams should spend less time organizing tickets and
              more time helping people.
            </h2>

            <p className="mt-6 leading-8 text-gray-600">
              Traditional support systems can become difficult to manage as
              customer requests increase. SyncBot brings ticket management,
              communication, assignment, and AI assistance together in a
              single platform.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              Customers can submit and track their requests, support agents
              can manage conversations and resolve issues, and administrators
              can oversee the complete support operation.
            </p>

          </div>

        </div>

      </section>

      {/* Roles */}
      <section className="bg-gray-50 py-16 sm:py-20">

        <div className="page-container">

          <div className="mb-12 text-center">

            <h2 className="text-3xl font-bold text-gray-900">
              Built for every part of your support team
            </h2>

            <p className="mt-4 text-gray-600">
              Each role gets the tools they need.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="border-2 border-slate-200 bg-white p-7 shadow-sm">

              <div className="text-3xl">
                👤
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Customers
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                Create support tickets, communicate with agents, and track
                the status of their requests.
              </p>

            </div>

            <div className="border-2 border-slate-200 bg-white p-7 shadow-sm">

              <div className="text-3xl">
                🎧
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Support Agents
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                Manage assigned tickets, communicate with customers, update
                priorities, and use AI assistance.
              </p>

            </div>

            <div className="border-2 border-slate-200 bg-white p-7 shadow-sm">

              <div className="text-3xl">
                👨‍💼
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Administrators
              </h3>

              <p className="mt-3 leading-7 text-gray-600">
                Manage users, assignments, categories, tickets, and overall
                support activity.
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default About;