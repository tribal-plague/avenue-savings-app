import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import useStore from '../store/useStore'
import Logo from '../components/Logo'

export default function Auth() {
  const setAppView = useStore((s) => s.setAppView)
  const login = useStore((s) => s.login)
  const signup = useStore((s) => s.signup)

  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const up = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = mode === 'login'
      ? await login(form.email, form.password)
      : await signup(form.name, form.email, form.password)
    setSubmitting(false)
    if (result.success && result.needsConfirmation) {
      setConfirmed(true)
      return
    }
    if (!result.success) setError(result.message)
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-avenue-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-avenue-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-avenue-border">
            <span className="text-2xl">📬</span>
          </div>
          <h2 className="text-xl font-bold text-avenue-dark mb-2">Check your email</h2>
          <p className="text-sm text-avenue-muted leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="font-medium text-avenue-dark">{form.email}</span>.
            Click it to activate your account, then come back and sign in.
          </p>
          <button
            onClick={() => { setConfirmed(false); setMode('login') }}
            className="mt-6 text-sm font-medium text-avenue-dark hover:text-avenue-muted transition-colors"
          >
            Back to sign in →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-avenue-bg flex">
      {/* Left panel — always dark navy, never flips in dark mode */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0D2E3F] p-12">
        <button onClick={() => setAppView('landing')} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to home
        </button>

        <div>
          <div className="mb-8">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center mb-6">
              <Logo size={18} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Your money,<br />finally clear.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              A calm, focused space to track spending, hit savings goals, and understand where your money actually goes.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { emoji: '📊', stat: '3 months', label: 'of spending insights on day one' },
              { emoji: '⚡', stat: '< 30 sec', label: 'to log an expense' },
              { emoji: '🎯', stat: '100%', label: 'free, forever' },
            ].map((s) => (
              <div key={s.stat} className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white/8 rounded-lg flex items-center justify-center text-base">{s.emoji}</div>
                <div>
                  <p className="text-white font-medium text-sm">{s.stat}</p>
                  <p className="text-white/30 text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">© 2026 Avenue</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="lg:hidden w-full max-w-sm mb-8">
          <button onClick={() => setAppView('landing')} className="flex items-center gap-2 text-avenue-muted hover:text-avenue-dark transition-colors text-sm">
            <ArrowLeft size={16} /> Back to home
          </button>
        </div>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Logo size={20} className="text-avenue-dark" />
            <span className="font-bold text-avenue-dark text-lg">avenue</span>
          </div>

          <h1 className="text-2xl font-bold text-avenue-dark mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your space'}
          </h1>
          <p className="text-sm text-avenue-muted mb-8">
            {mode === 'login'
              ? 'Sign in to continue to Avenue.'
              : 'Set up your free Avenue account in seconds.'}
          </p>

          <div className="flex p-1 bg-avenue-surface rounded-lg mb-6 border border-avenue-border">
            {['login', 'signup'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === m ? 'bg-white text-avenue-dark shadow-subtle' : 'text-avenue-muted hover:text-avenue-dark'}`}>
                {m === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-avenue-dark mb-1.5">Full name</label>
                <input
                  value={form.name} onChange={up('name')} placeholder="Alex Johnson"
                  className="w-full bg-white border border-avenue-border rounded-lg px-4 py-2.5 text-sm text-avenue-dark placeholder:text-avenue-muted/40 focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/40 transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-avenue-dark mb-1.5">Email address</label>
              <input
                type="email" value={form.email} onChange={up('email')} placeholder="alex@example.com"
                className="w-full bg-white border border-avenue-border rounded-lg px-4 py-2.5 text-sm text-avenue-dark placeholder:text-avenue-muted/40 focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-avenue-dark mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={up('password')} placeholder="••••••••"
                  className="w-full bg-white border border-avenue-border rounded-lg px-4 py-2.5 pr-11 text-sm text-avenue-dark placeholder:text-avenue-muted/40 focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/40 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-avenue-muted hover:text-avenue-dark transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-[#0D2E3F] text-white dark:bg-white dark:text-black font-medium py-3 rounded-lg transition-all text-sm mt-2 disabled:opacity-60">
              {submitting ? 'Please wait…' : (mode === 'login' ? 'Sign in to Avenue →' : 'Create my space →')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
