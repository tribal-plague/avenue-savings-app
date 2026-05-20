import { ArrowRight, Check, Moon, Sun } from 'lucide-react'
import useStore from '../store/useStore'
import Logo from '../components/Logo'

const FEATURES = [
  { icon: '👥', title: 'Shared spaces', body: 'Invite your partner, roommates, or team. Everyone logs expenses, everyone sees the picture.' },
  { icon: '📊', title: 'Live breakdown', body: 'Spending sorts itself by category in real time — with custom colors and icons you choose.' },
  { icon: '✦',  title: 'Smart insights', body: 'Avenue tells you when you\'re on pace, where you\'re overspending, and exactly what to fix.' },
  { icon: '₹',  title: 'Any currency',  body: 'Set your preferred symbol once. Every view, every number, every time.' },
  { icon: '✏️', title: 'Full control',  body: 'Create, edit, and delete any category, budget, or expense. Nothing is locked down.' },
  { icon: '🔒', title: 'Private by default', body: 'Spaces are isolated. Only members can see them. Your data is never shared.' },
]

const STEPS = [
  { n: '01', title: 'Create your space', body: 'Solo or shared. Set your salary, savings goal, and custom categories in under 2 minutes.' },
  { n: '02', title: 'Log as you spend', body: 'Add an expense in seconds. Categorize with a tap. Notes and splits included.' },
  { n: '03', title: 'Stay on track', body: 'Avenue shows your runway, savings progress, and per-person totals — updated instantly.' },
]

const CHECKLIST = [
  'Unlimited expenses & categories',
  'Group & couple spaces',
  'Smart insights & suggestions',
  'Budget tracking & savings goals',
  'Analytics dashboard',
  'Custom currency support',
]

export default function Landing() {
  const setAppView = useStore((s) => s.setAppView)
  const darkMode   = useStore((s) => s.darkMode)
  const toggleDark = useStore((s) => s.toggleDarkMode)

  return (
    <div className="min-h-screen bg-avenue-bg text-avenue-dark">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-avenue-bg/90 backdrop-blur-md border-b border-avenue-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={22} className="text-avenue-dark" />
            <span className="font-bold text-avenue-dark text-lg tracking-tight">avenue</span>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            {[['Features', '#features'], ['How it works', '#how-it-works'], ['Pricing', '#pricing']].map(([l, h]) => (
              <a key={l} href={h} className="text-sm text-avenue-muted hover:text-avenue-dark transition-colors">{l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-avenue-muted hover:text-avenue-dark hover:bg-avenue-light transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setAppView('auth')}
              className="hidden md:block text-sm text-avenue-muted hover:text-avenue-dark transition-colors px-2">
              Sign in
            </button>
            <button onClick={() => setAppView('auth')}
              className="bg-avenue-dark text-white dark:bg-white dark:text-black text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-1.5">
              Get started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-avenue-surface border border-avenue-border text-avenue-muted text-xs px-4 py-1.5 rounded-full mb-10 tracking-wide">
          <Logo size={12} className="text-avenue-muted" />
          A calmer way to budget
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-avenue-dark leading-[1.05] tracking-tight mb-6 max-w-3xl mx-auto">
          Your money,{' '}
          <span className="text-avenue-muted font-normal italic">finally clear.</span>
        </h1>

        <p className="text-base md:text-lg text-avenue-muted max-w-lg mx-auto mb-10 leading-relaxed">
          Avenue is a clean, focused budgeting space for you, your partner, or your team.
          Track spending, hit savings goals, and see who spent what.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <button onClick={() => setAppView('auth')}
            className="bg-avenue-dark text-white dark:bg-white dark:text-black font-medium px-8 py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
            Start for free <ArrowRight size={15} />
          </button>
          <a href="#how-it-works"
            className="border border-avenue-border text-avenue-dark font-medium px-8 py-3.5 rounded-xl hover:bg-avenue-light transition-all text-sm text-center">
            See how it works
          </a>
        </div>

        <p className="text-xs text-avenue-muted/60 mb-16">Free forever · No credit card needed</p>

        {/* ── App mockup ─────────────────────────────────────────── */}
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute inset-x-20 top-4 h-32 bg-avenue-dark/5 blur-3xl rounded-full" />

          <div className="relative bg-avenue-surface rounded-2xl border border-avenue-border shadow-card overflow-hidden text-left">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-avenue-light border-b border-avenue-border">
              <div className="w-2.5 h-2.5 rounded-full bg-avenue-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-avenue-border" />
              <div className="w-2.5 h-2.5 rounded-full bg-avenue-border" />
              <div className="flex-1 flex justify-center">
                <span className="text-xs text-avenue-muted/50 font-mono bg-avenue-bg rounded-md px-4 py-0.5">avenue.app — dashboard</span>
              </div>
            </div>

            {/* Mock nav */}
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-avenue-border bg-avenue-surface">
              <div className="flex items-center gap-1.5">
                <Logo size={14} className="text-avenue-dark" />
                <span className="font-bold text-avenue-dark text-xs">avenue</span>
              </div>
              <div className="flex items-center gap-1 ml-3">
                {['Overview', 'Expenses', 'Categories', 'Analytics'].map((t, i) => (
                  <span key={t} className={`px-2.5 py-1 rounded-md text-xs font-medium ${i === 0 ? 'bg-avenue-dark text-white dark:bg-white dark:text-black' : 'text-avenue-muted'}`}>{t}</span>
                ))}
              </div>
            </div>

            {/* Mock dashboard */}
            <div className="p-6 bg-avenue-bg">
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Available to spend', value: '$3,847', sub: 'of $4,800 budget' },
                  { label: 'Spent this month', value: '$953', sub: '↑ 12% from last month' },
                  { label: 'Savings on track', value: '$1,200', sub: '20% of income', ok: true },
                ].map((s) => (
                  <div key={s.label} className="bg-avenue-surface rounded-xl p-4 border border-avenue-border">
                    <p className="text-xs text-avenue-muted mb-1.5">{s.label}</p>
                    <p className="text-2xl font-bold text-avenue-dark">{s.value}</p>
                    <p className={`text-xs mt-1 ${s.ok ? 'text-emerald-500' : 'text-avenue-muted'}`}>{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: '🏠 Housing', amt: '$950', pct: 63, color: '#6366f1' },
                  { name: '🍔 Food', amt: '$310', pct: 52, color: '#f97316' },
                  { name: '🚗 Transport', amt: '$97', pct: 32, color: '#0ea5e9' },
                ].map((c) => (
                  <div key={c.name} className="bg-avenue-surface rounded-xl p-3.5 border border-avenue-border">
                    <div className="flex justify-between text-xs mb-2.5">
                      <span className="font-medium text-avenue-dark">{c.name}</span>
                      <span className="text-avenue-muted">{c.amt}</span>
                    </div>
                    <div className="h-1.5 bg-avenue-light rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                    </div>
                    <p className="text-xs text-avenue-muted mt-1.5">{c.pct}% of budget</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs text-avenue-muted uppercase tracking-widest mb-3 font-medium">Why Avenue</p>
          <h2 className="text-3xl md:text-4xl font-bold text-avenue-dark leading-tight max-w-lg mx-auto">
            Money tools that don't feel like work.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-avenue-surface border border-avenue-border rounded-2xl p-6 hover:border-avenue-dark/20 hover:shadow-subtle transition-all group">
              <div className="w-10 h-10 bg-avenue-bg rounded-xl flex items-center justify-center text-xl mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-semibold text-avenue-dark mb-2">{f.title}</h3>
              <p className="text-sm text-avenue-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works — always dark panel regardless of mode ───── */}
      <section id="how-it-works" className="bg-[#0D2E3F] dark:bg-zinc-950 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Three steps. Then forget about it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="border border-white/10 rounded-2xl p-7 hover:border-white/20 transition-all">
                <p className="text-white/25 text-xs font-mono mb-5">{s.n}</p>
                <h3 className="font-semibold text-white text-base mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button onClick={() => setAppView('auth')}
              className="bg-white text-black font-medium px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all text-sm inline-flex items-center gap-2">
              Get started now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-xs text-avenue-muted uppercase tracking-widest mb-3 font-medium">Pricing</p>
          <h2 className="text-3xl font-bold text-avenue-dark">Simple. Free.</h2>
          <p className="text-avenue-muted mt-3 max-w-md mx-auto text-sm leading-relaxed">
            Avenue is completely free. No plans, no paywalls, no catch.
          </p>
        </div>

        <div className="max-w-sm mx-auto bg-avenue-surface border border-avenue-border rounded-2xl p-8 text-center shadow-card">
          <div className="w-12 h-12 bg-[#0D2E3F] dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Logo size={20} className="text-white dark:text-black" />
          </div>
          <p className="text-avenue-muted font-medium text-xs uppercase tracking-widest mb-2">Everything included</p>
          <p className="text-5xl font-bold text-avenue-dark mb-1">$0</p>
          <p className="text-avenue-muted text-sm mb-8">Forever. No credit card needed.</p>

          <div className="space-y-3 text-left mb-8">
            {CHECKLIST.map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded-full border border-avenue-border flex items-center justify-center flex-shrink-0">
                  <Check size={9} className="text-avenue-dark" />
                </div>
                <span className="text-avenue-dark">{f}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setAppView('auth')}
            className="w-full bg-avenue-dark text-white dark:bg-white dark:text-black font-medium py-3.5 rounded-xl transition-all text-sm">
            Start for free →
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-avenue-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={18} className="text-avenue-dark" />
            <span className="font-bold text-avenue-dark">avenue</span>
          </div>
          <p className="text-xs text-avenue-muted">© 2026 Avenue. Built for clarity.</p>
          <button onClick={() => setAppView('auth')}
            className="text-sm text-avenue-dark hover:text-avenue-muted transition-colors">
            Open app →
          </button>
        </div>
      </footer>
    </div>
  )
}
