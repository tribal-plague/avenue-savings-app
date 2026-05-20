import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import useStore from '../store/useStore'

const FEATURES = [
  { icon: '👥', title: 'Shared spaces', body: 'Invite your partner, roommates, or team. Everyone logs expenses, everyone sees the truth.' },
  { icon: '📊', title: 'Live breakdown', body: 'Watch your spending sort itself by category — with custom colors and icons that match your style.' },
  { icon: '✦', title: 'Smart insights', body: 'Avenue tells you when you\'re on pace, where you\'re overspending, and exactly what to fix.' },
  { icon: '₹', title: 'Any currency', body: 'Set your preferred symbol once. We handle the rest consistently across every view.' },
  { icon: '✏️', title: 'Full control', body: 'Create, edit, and delete any category, budget, or expense. Nothing is locked down.' },
  { icon: '🔒', title: 'Private by default', body: 'Your data lives in your browser. Spaces are isolated and only members can see them.' },
]

const STEPS = [
  { n: '01', title: 'Create your space', body: 'Solo or shared. Set your salary, savings goal, and custom categories in under 2 minutes.' },
  { n: '02', title: 'Log as you spend', body: 'Add an expense in seconds. Categorize with a tap. Notes and split tracking included.' },
  { n: '03', title: 'Stay on track', body: 'Avenue shows your runway, savings progress, and per-person totals — updated instantly.' },
]

export default function Landing() {
  const setAppView = useStore((s) => s.setAppView)

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-avenue-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-avenue-dark rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-avenue-dark text-lg tracking-tight">Avenue</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'Pricing'].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                className="text-sm text-avenue-muted hover:text-avenue-dark transition-colors">
                {l}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => setAppView('auth')}
              className="hidden md:block text-sm text-avenue-muted hover:text-avenue-dark transition-colors">
              Sign in
            </button>
            <button onClick={() => setAppView('auth')}
              className="bg-avenue-dark text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-avenue-dark/90 transition-all flex items-center gap-1.5">
              Open app <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-avenue-border text-avenue-muted text-xs px-3 py-1.5 rounded-full mb-8 tracking-wide">
          A calmer way to budget
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-avenue-dark leading-tight tracking-tight mb-6 max-w-2xl mx-auto">
          Spend smarter,{' '}
          <span className="text-avenue-muted font-normal">together.</span>
        </h1>

        <p className="text-base text-avenue-muted max-w-lg mx-auto mb-10 leading-relaxed">
          Avenue is a clean budgeting space for you, your partner, or your team.
          Track every expense, hit your savings goal, and see who spent what.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button onClick={() => setAppView('auth')}
            className="bg-avenue-dark text-white font-medium px-7 py-3 rounded-lg hover:bg-avenue-dark/90 transition-all text-sm flex items-center justify-center gap-2">
            Open your space <ArrowRight size={15} />
          </button>
          <a href="#how-it-works"
            className="border border-avenue-border text-avenue-dark font-medium px-7 py-3 rounded-lg hover:bg-avenue-surface transition-all text-sm text-center">
            See how it works
          </a>
        </div>
        <p className="text-xs text-avenue-muted/60">No account required · All data stays local · Free forever</p>

        {/* App preview mockup */}
        <div className="mt-14 bg-white rounded-2xl border border-avenue-border shadow-card overflow-hidden max-w-4xl mx-auto">
          <div className="flex items-center gap-1.5 px-4 py-3 bg-avenue-surface border-b border-avenue-border">
            <div className="w-2.5 h-2.5 rounded-full bg-avenue-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-avenue-border" />
            <div className="w-2.5 h-2.5 rounded-full bg-avenue-border" />
            <span className="ml-3 text-xs text-avenue-muted/60 font-mono">avenue — dashboard</span>
          </div>
          <div className="p-6 text-left">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-medium text-avenue-muted uppercase tracking-widest mb-1">Available to Spend</p>
                <p className="text-4xl font-bold text-avenue-dark">$3,847</p>
                <p className="text-xs text-avenue-muted mt-1">of $4,800 budget · $953 spent this month</p>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-xs text-avenue-muted uppercase tracking-wider mb-1">Monthly Income</p>
                  <p className="text-lg font-semibold text-avenue-dark">$6,000</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-avenue-muted uppercase tracking-wider mb-1">Savings Goal</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-avenue-dark">$1,200</p>
                    <span className="text-xs bg-avenue-surface text-avenue-dark border border-avenue-border px-2 py-0.5 rounded-full">On track</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['🏠 Housing', '$953', 64], ['🍔 Food & Dining', '$310', 52], ['🚗 Transport', '$97', 32]].map(([cat, amt, pct]) => (
                <div key={cat} className="bg-avenue-surface rounded-xl p-3 border border-avenue-border">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-medium text-avenue-dark">{cat}</span>
                    <span className="text-avenue-muted">{amt}</span>
                  </div>
                  <div className="h-1 bg-avenue-border rounded-full">
                    <div className="h-full rounded-full bg-avenue-dark/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs text-avenue-muted uppercase tracking-widest mb-3">Why Avenue</p>
          <h2 className="text-3xl md:text-4xl font-bold text-avenue-dark leading-tight">
            Money tools that don't feel like work.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-avenue-border rounded-xl p-6 hover:border-avenue-dark/20 hover:shadow-subtle transition-all">
              <div className="w-9 h-9 bg-avenue-surface rounded-lg flex items-center justify-center text-lg mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-avenue-dark mb-2 text-sm">{f.title}</h3>
              <p className="text-sm text-avenue-muted leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-avenue-dark py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              Three steps. Then forget about it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all">
                <p className="text-white/30 text-xs font-mono mb-4">{s.n}</p>
                <h3 className="font-semibold text-white text-base mb-2">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs text-avenue-muted uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-avenue-dark">Simple. Free.</h2>
          <p className="text-avenue-muted mt-3 max-w-md mx-auto text-sm">Avenue is completely free. Your data never leaves your device.</p>
        </div>

        <div className="max-w-sm mx-auto bg-white border border-avenue-border rounded-xl p-8 text-center shadow-subtle">
          <p className="text-avenue-muted font-medium text-xs uppercase tracking-widest mb-3">Everything included</p>
          <p className="text-5xl font-bold text-avenue-dark mb-2">$0</p>
          <p className="text-avenue-muted text-sm mb-8">Forever. No credit card needed.</p>
          <div className="space-y-3 text-left mb-8">
            {['Unlimited expenses & categories', 'Group & couple spaces', 'Smart insights & suggestions', 'Budget tracking & savings goals', 'Analytics dashboard', 'Custom currency'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded-full border border-avenue-dark/20 flex items-center justify-center flex-shrink-0">
                  <Check size={9} className="text-avenue-dark" />
                </div>
                <span className="text-avenue-dark">{f}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setAppView('auth')}
            className="w-full bg-avenue-dark text-white font-medium py-3 rounded-lg hover:bg-avenue-dark/90 transition-all text-sm">
            Start for free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-avenue-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-avenue-dark rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">A</span>
            </div>
            <span className="font-semibold text-avenue-dark">Avenue</span>
          </div>
          <p className="text-xs text-avenue-muted">© 2026 Avenue. All data stored locally on your device.</p>
          <button onClick={() => setAppView('auth')}
            className="text-sm text-avenue-dark hover:text-avenue-muted transition-colors">
            Open app →
          </button>
        </div>
      </footer>
    </div>
  )
}
