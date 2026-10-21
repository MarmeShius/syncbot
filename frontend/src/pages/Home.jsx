import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Check,
  Clock3,
  Headset,
  LifeBuoy,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Zap,
} from "lucide-react";

const topics = [
  { label: "An order", icon: PackageCheck, text: "Track a delivery, report a missing parcel, or ask about an order." },
  { label: "My account", icon: ShieldCheck, text: "Get help with sign-in, profile details, or keeping your account secure." },
  { label: "Something else", icon: LifeBuoy, text: "Tell us what happened and we’ll help you find the right next step." },
];

const steps = [
  { number: "01", title: "Tell us what happened", text: "Describe the issue in your own words and add any helpful details.", icon: MessageCircle, color: "mint" },
  { number: "02", title: "We get it to the right place", text: "Your request is organized, prioritized, and routed to the support team.", icon: Zap, color: "peach" },
  { number: "03", title: "Get a clear response", text: "Follow the conversation and updates from your customer portal.", icon: TicketCheck, color: "blue" },
];

const features = [
  { title: "A clear place for every request", text: "Keep your support conversations and ticket updates together in one portal.", icon: TicketCheck },
  { title: "Helpful AI assistance", text: "AI tools can help organize requests and answer questions using available support information.", icon: Sparkles },
  { title: "People stay in the loop", text: "Customers and agents can follow replies and ticket progress as it changes.", icon: MessageCircle },
];

function Home() {
  const [selectedTopic, setSelectedTopic] = useState(0);
  const [topicRotationPaused, setTopicRotationPaused] = useState(false);
  const TopicIcon = topics[selectedTopic].icon;

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      if (!topicRotationPaused) {
        setSelectedTopic((current) => (current + 1) % topics.length);
      }
    }, 4200);
    return () => window.clearInterval(timer);
  }, [topicRotationPaused]);

  return (
    <main className="overflow-hidden bg-[#86c6af] text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      <section className="home-hero home-hero-home relative isolate overflow-hidden bg-[#eaf7f0] dark:bg-slate-950">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="landing-container relative z-10 grid items-center gap-12 py-14 sm:py-20 lg:min-h-[650px] lg:grid-cols-[1fr_0.94fr] lg:gap-8 lg:py-24">
          <div className="home-reveal">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm dark:border-emerald-900 dark:bg-slate-900/80 dark:text-emerald-300">
              <span className="relative flex h-2.5 w-2.5"><span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>
              Maryam's Support Portal
            </div>

            <p className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">We’re here to help</p>
            <h1 className="mt-3 max-w-2xl text-5xl font-black leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl xl:text-7xl dark:text-white">
              How can we <span className="text-emerald-700 dark:text-emerald-400">help you</span> today?
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl dark:text-slate-300">
              Get support without the runaround. Tell us what you need, follow your request, and get a thoughtful response from the team.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 font-bold text-white shadow-lg shadow-emerald-900/15 transition duration-300 hover:-translate-y-1 hover:bg-emerald-800 hover:shadow-xl dark:bg-emerald-600 dark:hover:bg-emerald-500">
                Get support <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/about" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 font-bold text-slate-700 transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:text-emerald-300">
                Get to know us <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              {["One place for your tickets", "Real-time updates", "Friendly human support"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5"><Check size={15} className="text-emerald-600 dark:text-emerald-400" />{item}</span>
              ))}
            </div>
          </div>

          <SupportScene
            selectedTopic={selectedTopic}
            onSelect={setSelectedTopic}
            TopicIcon={TopicIcon}
            setTopicRotationPaused={setTopicRotationPaused}
          />
        </div>
      </section>

      <section className="relative py-20 sm:py-24">
        <div className="landing-container">
          <div className="home-reveal mx-auto max-w-2xl text-center">
            <span className="section-kicker">A simple path to help</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">From “I need help” to “we’ve got this.”</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">A calmer support experience, from the first message through the final update.</p>
          </div>
          <div className="relative mt-12 grid gap-5 md:grid-cols-3">
            <div className="step-connector absolute left-[17%] right-[17%] top-12 hidden h-px md:block" />
            {steps.map(({ number, title, text, icon: Icon, color }, index) => (
              <article key={number} className={`home-reveal group relative rounded-[1.75rem] border border-slate-200/80 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900`} style={{ animationDelay: `${index * 120}ms` }}>
                <div className={`step-icon step-icon-${color} relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl transition duration-300 group-hover:rotate-[-5deg] group-hover:scale-110`}><Icon size={27} strokeWidth={1.8} /></div>
                <p className="mt-6 text-xs font-black tracking-[0.18em] text-emerald-700 dark:text-emerald-400">STEP {number}</p>
                <h3 className="mt-2 text-xl font-extrabold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">{text}</p>
                <div className="mt-6 h-1 w-10 rounded-full bg-emerald-200 transition-all duration-300 group-hover:w-20 group-hover:bg-emerald-500 dark:bg-emerald-950" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#eef7f2] py-20 sm:py-24 dark:bg-slate-900/70">
        <div className="landing-container grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="home-reveal">
            <span className="section-kicker">Support that works together</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Less chasing updates. More getting things sorted.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-400">SyncBot brings customer requests and support conversations into one connected workflow, so everyone can see what needs attention.</p>
            <Link to="/about" className="group mt-7 inline-flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">See how SyncBot works <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ title, text, icon: Icon }, index) => (
              <article key={title} className="home-reveal group rounded-3xl border border-white bg-white/90 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 dark:bg-emerald-950 dark:text-emerald-300"><Icon size={22} /></div>
                <h3 className="mt-5 font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
              </article>
            ))}
            <div className="home-reveal flex items-center gap-4 rounded-3xl bg-emerald-800 p-6 text-white shadow-lg sm:col-span-2 dark:bg-emerald-950" style={{ animationDelay: "260ms" }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Headset size={24} /></div>
              <p className="text-sm font-semibold leading-6 text-emerald-50">A good support experience starts with listening—and keeps you informed along the way.</p>
              <Sparkles className="ml-auto hidden shrink-0 text-emerald-200 sm:block" size={22} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-4 py-20 sm:py-24">
        <div className="home-reveal landing-container relative overflow-hidden rounded-[2rem] bg-[#123d32] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div className="cta-glow" />
          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-200"><Headset size={27} /></div>
            <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-emerald-200">Whenever you’re ready</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Let’s make your next step easier.</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-emerald-50/80">Create an account to submit a request and keep all your support updates in one place.</p>
            <Link to="/register" className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-extrabold text-emerald-900 transition hover:-translate-y-1 hover:bg-emerald-50">Create an account <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SupportScene({ selectedTopic, onSelect, TopicIcon, setTopicRotationPaused }) {
  return (
    <div
      className="home-reveal home-reveal-late relative mx-auto w-full max-w-[590px]"
      aria-label="Interactive support preview"
      onMouseEnter={() => setTopicRotationPaused(true)}
      onMouseLeave={() => setTopicRotationPaused(false)}
      onFocusCapture={() => setTopicRotationPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setTopicRotationPaused(false);
      }}
    >
      <div className="scene-halo" />
      <div className="scene-card relative rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-[0_28px_90px_-35px_rgba(14,116,82,.45)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/85">
        <div className="overflow-hidden rounded-[1.5rem] bg-[#f8fbf9] dark:bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><Headset size={21} /></div><div><p className="text-sm font-extrabold">SyncBot Support</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Here to help</p></div></div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Support portal</span>
          </div>
          <div className="p-5 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c9ead8] text-emerald-900"><Bot size={18} /></div>
              <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">Hi! What can we help you with today?</div>
            </div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Choose a topic to get started</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Common support topics">
              {topics.map(({ label }, index) => (
                <button key={label} type="button" aria-pressed={selectedTopic === index} onClick={() => onSelect(index)} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition duration-200 hover:-translate-y-0.5 ${selectedTopic === index ? "border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-900/15" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-800"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div key={selectedTopic} className="topic-response mt-4 flex min-h-[96px] items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-950 dark:bg-emerald-950/35">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300"><TopicIcon size={18} /></span>
              <div><p className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">We can help with that</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">{topics[selectedTopic].text}</p></div>
            </div>
            <div className="mt-3 flex items-center gap-2" aria-hidden="true">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div key={selectedTopic} className="topic-progress h-full rounded-full bg-emerald-500" /></div>
              <span className="text-[10px] font-medium text-slate-400">Explore topics</span>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">Your support, all in one place</span>
              <Link to="/register" aria-label="Create an account to get support" className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:scale-105 hover:bg-emerald-800"><ArrowRight size={18} /></Link>
            </div>
          </div>
        </div>
      </div>
      <div className="scene-float scene-float-top absolute -right-3 top-10 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Clock3 size={17} /></span><div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p><p className="text-xs font-extrabold">In progress</p></div></div></div>
      <div className="scene-float scene-float-bottom absolute -bottom-5 -left-4 hidden rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:block dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Check size={17} /></span><div><p className="text-xs font-extrabold">You’re in the loop</p><p className="text-[10px] text-slate-500 dark:text-slate-400">Updates stay with your ticket</p></div></div></div>
    </div>
  );
}

export default Home;
