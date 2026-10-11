import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  HeartHandshake,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";

const principles = [
  { icon: HeartHandshake, title: "People first", text: "Every request comes from a person who deserves to feel heard and respected.", tone: "rose" },
  { icon: MessageCircle, title: "Clear communication", text: "Keep the conversation and ticket progress easy to follow from one place.", tone: "mint" },
  { icon: ShieldCheck, title: "Useful technology", text: "Use AI and automation to help teams focus their time on solving real problems.", tone: "blue" },
];

const roles = [
  { icon: UsersRound, label: "Customers", title: "Know where things stand", text: "Create support requests, follow replies, and stay up to date as your issue moves forward.", tone: "mint" },
  { icon: MessageCircle, label: "Support agents", title: "Focus on the conversation", text: "Work from a shared ticket queue, coordinate responses, and keep customers informed.", tone: "blue" },
  { icon: ShieldCheck, label: "Administrators", title: "Keep the operation moving", text: "Oversee the support workflow, manage access, and see how the team is doing.", tone: "peach" },
];

function About() {
  return (
    <main className="overflow-hidden bg-[#86c6af] text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="home-hero home-hero-about relative isolate overflow-hidden bg-[#eaf7f0] dark:bg-slate-950">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="landing-container relative z-10 grid items-center gap-12 py-16 sm:py-20 lg:min-h-[510px] lg:grid-cols-[1fr_0.9fr] lg:py-24">
          <div className="home-reveal">
            <span className="section-kicker">A little about us</span>
            <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[1.03] tracking-[-0.05em] sm:text-6xl xl:text-7xl">
              Good support starts with <span className="text-emerald-700 dark:text-emerald-400">listening.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              SyncBot helps customers and support teams work through requests with more clarity, better follow-up, and a little help from thoughtful technology.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="group inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-1 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">Get started <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></Link>
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3.5 font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-emerald-800">Explore home <ArrowRight size={17} /></Link>
            </div>
          </div>
          <AboutIllustration />
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="landing-container grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div className="home-reveal order-2 lg:order-1">
            <span className="section-kicker">Why SyncBot</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Make the support journey feel connected.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">
              Support can feel frustrating when messages, updates, and next steps are scattered. SyncBot brings the customer conversation and the team’s ticket workflow together, so each request has a clearer path forward.
            </p>
            <div className="mt-7 space-y-4">
              {[
                "Customers can follow their requests and replies.",
                "Agents can organize work and coordinate responses.",
                "AI assistance can help with repetitive support tasks.",
              ].map((item) => <div key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><Zap size={12} /></span>{item}</div>)}
            </div>
          </div>
          <div className="home-reveal order-1 lg:order-2">
            <JourneyCard />
          </div>
        </div>
      </section>

      <section className="bg-[#eef7f2] py-20 sm:py-24 dark:bg-slate-900/70">
        <div className="landing-container">
          <div className="home-reveal mx-auto max-w-2xl text-center">
            <span className="section-kicker">What guides us</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">The kind of support we believe in.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">Simple principles shape every part of the experience.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, text, tone }, index) => (
              <article key={title} className="home-reveal group rounded-[1.75rem] border border-white bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950" style={{ animationDelay: `${index * 120}ms` }}>
                <div className={`about-icon about-icon-${tone} flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110`}><Icon size={25} /></div>
                <h3 className="mt-6 text-xl font-extrabold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{text}</p>
                <div className="mt-6 h-1 w-10 rounded-full bg-emerald-200 transition-all duration-300 group-hover:w-20 group-hover:bg-emerald-500 dark:bg-emerald-950" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="landing-container">
          <div className="home-reveal mb-11 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><span className="section-kicker">One shared experience</span><h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Built for everyone in the conversation.</h2></div>
            <p className="max-w-md leading-7 text-slate-600 dark:text-slate-400">Customers, agents, and administrators each have a role in making support feel smoother.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {roles.map(({ icon: Icon, label, title, text, tone }, index) => (
              <article key={label} className="home-reveal group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900" style={{ animationDelay: `${index * 110}ms` }}>
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-150 dark:bg-emerald-950/40" />
                <div className="relative">
                  <div className={`about-icon about-icon-${tone} flex h-12 w-12 items-center justify-center rounded-xl`}><Icon size={22} /></div>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">{label}</p>
                  <h3 className="mt-2 text-xl font-extrabold">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:pb-24">
        <div className="home-reveal landing-container relative overflow-hidden rounded-[2rem] bg-[#123d32] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="cta-glow" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-200"><Sparkles size={26} /></div>
            <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Let’s make support feel better.</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-emerald-50/80">Start with a conversation. We’ll help you take it from there.</p>
            <Link to="/register" className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-extrabold text-emerald-900 transition hover:-translate-y-1 hover:bg-emerald-50">Join SyncBot <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function AboutIllustration() {
  return (
    <div className="home-reveal home-reveal-late relative mx-auto w-full max-w-[550px]" role="img" aria-label="Illustration of a friendly customer support conversation">
      <div className="about-illustration-halo" />
      <div className="relative rounded-[2rem] border border-white bg-white/70 p-4 shadow-[0_28px_90px_-35px_rgba(14,116,82,.4)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-[#dff1e7] px-4 pb-4 pt-5 dark:bg-slate-800 sm:px-7 sm:pt-7">
          <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full bg-[#b8e1cb] dark:bg-emerald-950" />
          <div className="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-[#c5e8d4] dark:bg-slate-700" />
          <div className="relative z-10 mx-auto max-w-[390px]">
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
              <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white"><HeartHandshake size={17} /></div><span className="text-xs font-extrabold">A team that listens</span></div><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <svg viewBox="0 0 420 310" className="mx-auto w-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <ellipse cx="210" cy="286" rx="166" ry="15" fill="#5B9A78" fillOpacity=".16" />
              <path d="M69 145c0-68 56-123 125-123h47c68 0 123 55 123 123v91H69v-91Z" fill="#F9FCFA" />
              <path d="M78 141c0-63 51-114 114-114h50c63 0 114 51 114 114v82H78v-82Z" fill="#D7EEE1" />
              <rect x="113" y="107" width="193" height="126" rx="12" fill="#FFFFFF" />
              <rect x="125" y="119" width="169" height="15" rx="5" fill="#EAF6EF" />
              <circle cx="135" cy="126.5" r="3" fill="#44A978" /><circle cx="146" cy="126.5" r="3" fill="#F1B46A" /><circle cx="157" cy="126.5" r="3" fill="#7FB2E4" />
              <rect x="127" y="149" width="79" height="67" rx="8" fill="#EAF7F0" />
              <circle cx="166" cy="172" r="13" fill="#F3C7A6" />
              <path d="M151 169c1-12 8-19 16-19 10 0 17 8 17 19-5-4-10-7-17-7-6 0-11 3-16 7Z" fill="#314C45" />
              <path d="M146 208c2-14 10-22 20-22 11 0 19 8 21 22h-41Z" fill="#4A9B77" />
              <rect x="217" y="151" width="59" height="7" rx="3.5" fill="#B6D8C4" />
              <rect x="217" y="165" width="69" height="7" rx="3.5" fill="#D5E8DC" />
              <rect x="217" y="179" width="49" height="7" rx="3.5" fill="#D5E8DC" />
              <rect x="216" y="198" width="60" height="13" rx="6.5" fill="#16845B" />
              <path d="M177 235h61l14 37h-89l14-37Z" fill="#547E6A" />
              <path d="M152 272h122c11 0 19 8 19 18H133c0-10 8-18 19-18Z" fill="#375D4D" />
              <path d="M95 92c-17 0-31 14-31 31v8h21v-8c0-5 4-10 10-10h6V92h-6Z" fill="#16845B" />
              <path d="M322 92c17 0 31 14 31 31v8h-21v-8c0-5-4-10-10-10h-6V92h6Z" fill="#16845B" />
              <path d="M331 77c-7-14-20-21-36-18 0-15-9-26-23-31-8 11-9 23-2 35-13-6-25-4-35 7 5 14 16 21 31 21-11 9-14 21-8 35 16 2 28-4 35-18 8 13 19 18 34 15 5-15 1-27-11-36 14 1 25-3 33-15Z" fill="#29493F" />
              <ellipse cx="301" cy="115" rx="34" ry="40" fill="#E8B996" />
              <path d="M269 111c1-24 14-40 35-40 20 0 32 16 33 38-10-6-20-10-34-10-14 0-24 4-34 12Z" fill="#29493F" />
              <path d="M283 117c3 2 6 2 9 0M310 117c3 2 6 2 9 0" stroke="#684A3F" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M292 133c5 5 12 5 17 0" stroke="#A85D53" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M276 155c4-11 13-16 25-16 12 0 22 6 26 16l12 47h-75l12-47Z" fill="#16845B" />
              <path d="m281 141 20 23 19-23" fill="#FFFFFF" />
              <path d="M276 87c-10 2-17 9-19 19m84-1c-1-10-7-17-16-19" stroke="#16845B" strokeWidth="5" strokeLinecap="round" />
              <rect x="49" y="39" width="81" height="43" rx="14" fill="#FFFFFF" />
              <path d="M74 81 66 92l19-10" fill="#FFFFFF" />
              <path d="M68 57h44M68 67h28" stroke="#69A984" strokeWidth="4" strokeLinecap="round" />
              <circle cx="363" cy="177" r="20" fill="#FFFFFF" />
              <path d="m354 177 6 6 12-13" stroke="#16845B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="relative -mt-1 rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><MessageCircle size={17} /></div><p className="text-sm font-bold">“Thanks for reaching out. We’re here to help.”</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="scene-float scene-float-top absolute -right-3 top-16 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><UsersRound size={17} /></span><span className="text-xs font-extrabold">People come first</span></div></div>
    </div>
  );
}

const journeyViews = {
  customer: {
    label: "Customer",
    intro: "A clear view of your request",
    steps: [
      ["01", "Share what happened", "Create a support request", "mint"],
      ["02", "Follow the conversation", "See replies and progress", "blue"],
      ["03", "Get a helpful next step", "Keep updates with your ticket", "peach"],
    ],
  },
  agent: {
    label: "Support agent",
    intro: "A focused workspace for the team",
    steps: [
      ["01", "Review the ticket queue", "See requests that need attention", "mint"],
      ["02", "Investigate and respond", "Keep the customer informed", "blue"],
      ["03", "Move the request forward", "Update its status as work progresses", "peach"],
    ],
  },
  admin: {
    label: "Administrator",
    intro: "A clearer view of support operations",
    steps: [
      ["01", "Manage team access", "Keep roles and users organized", "mint"],
      ["02", "Monitor support activity", "Review ticket and team workflows", "blue"],
      ["03", "Improve the process", "Use insights to guide the team", "peach"],
    ],
  },
};

function JourneyCard() {
  const [activeView, setActiveView] = useState("customer");
  const journey = journeyViews[activeView];

  return (
    <div className="relative mx-auto max-w-[520px]">
      <div className="about-illustration-halo" />
      <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">One connected journey</p><h3 className="mt-1 text-lg font-extrabold">{journey.intro}</h3></div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><Sparkles size={22} /></span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="View the journey by role">
          {Object.entries(journeyViews).map(([key, view]) => (
            <button
              key={key}
              type="button"
              aria-pressed={activeView === key}
              onClick={() => setActiveView(key)}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition duration-200 hover:-translate-y-0.5 ${activeView === key ? "bg-emerald-700 text-white shadow-md shadow-emerald-900/15 dark:bg-emerald-600" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"}`}
            >
              {view.label}
            </button>
          ))}
        </div>
        <div className="journey-line relative mt-6 space-y-5">
          {journey.steps.map(([number, title, text, tone], index) => (
            <div className="journey-item relative flex gap-4" key={`${activeView}-${number}`} style={{ animationDelay: `${index * 120}ms` }}>
              <div className={`journey-dot journey-dot-${tone} relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-black`}>{number}</div>
              <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 p-4 transition duration-300 hover:translate-x-1 dark:bg-slate-950"><p className="text-sm font-extrabold">{title}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default About;
