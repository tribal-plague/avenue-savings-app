import { useState } from 'react'
import useStore from '../store/useStore'

const STEPS = ['Welcome', 'Profile', 'Group', 'Done']

export default function Setup() {
  const completeSetup = useStore((s) => s.completeSetup)
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ name: '', email: '', salary: '', savingsGoal: 20 })
  const [group, setGroup] = useState({ name: '', type: 'individual' })

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => s - 1)

  const finish = () => {
    completeSetup(
      { name: profile.name, email: profile.email, salary: parseFloat(profile.salary) || 0, savingsGoal: parseFloat(profile.savingsGoal) || 20 },
      group.name || `${profile.name.split(' ')[0]}'s Finances`,
      group.type
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-avenue-900 via-avenue-800 to-avenue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-avenue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">Avenue</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-avenue-500' : 'bg-gray-100'}`} />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Avenue</h1>
              <p className="text-gray-500 mt-2">Your smart expense management tool for individuals, couples, and groups.</p>
            </div>
            <div className="space-y-3">
              {['Track every expense with categories you create', 'Set savings goals and stay on budget', 'Get AI-powered insights and suggestions', 'Share expenses with your household or team'].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-avenue-100 text-avenue-600 rounded-full flex items-center justify-center text-xs flex-shrink-0">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <button onClick={next} className="w-full bg-avenue-600 text-white py-3 rounded-xl font-medium hover:bg-avenue-dark/90">
              Get started
            </button>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tell us about yourself</h2>
              <p className="text-gray-500 text-sm mt-1">This helps personalize your experience.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-400"
                  placeholder="Alex Johnson" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input value={profile.email} type="email" onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-400"
                  placeholder="alex@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly salary <span className="text-gray-400">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input type="number" value={profile.salary} onChange={(e) => setProfile({ ...profile, salary: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-400"
                    placeholder="5000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Monthly savings goal</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="80" value={profile.savingsGoal}
                    onChange={(e) => setProfile({ ...profile, savingsGoal: e.target.value })}
                    className="flex-1 accent-avenue-600" />
                  <span className="text-sm font-bold text-avenue-dark/90 w-10 text-right">{profile.savingsGoal}%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={back} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Back</button>
              <button onClick={next} disabled={!profile.name} className="flex-1 bg-avenue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 disabled:opacity-40">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Group */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Set up your workspace</h2>
              <p className="text-gray-500 text-sm mt-1">Who will be tracking expenses together?</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[['individual', '👤', 'Just me', 'Track your personal finances'], ['couple', '💑', 'Couple', 'Share with your partner'], ['group', '👥', 'Group', 'Household or team']].map(([val, icon, label, desc]) => (
                <button key={val} onClick={() => setGroup({ ...group, type: val })}
                  className={`p-4 rounded-xl border text-center transition-all ${group.type === val ? 'border-avenue-dark/30 bg-avenue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className={`text-sm font-medium ${group.type === val ? 'text-avenue-dark/90' : 'text-gray-700'}`}>{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-tight">{desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Workspace name <span className="text-gray-400">(optional)</span></label>
              <input value={group.name} onChange={(e) => setGroup({ ...group, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-400"
                placeholder={`${profile.name.split(' ')[0] || 'My'}'s Finances`} />
            </div>
            <div className="flex gap-3">
              <button onClick={back} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium">Back</button>
              <button onClick={next} className="flex-1 bg-avenue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90">
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="space-y-5 text-center">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">You're all set, {profile.name.split(' ')[0]}!</h2>
              <p className="text-gray-500 text-sm mt-2">Avenue is ready. Start by adding your first expense.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{profile.name}</span>
              </div>
              {profile.salary && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monthly income</span>
                  <span className="font-medium text-gray-800">${parseFloat(profile.salary).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Savings goal</span>
                <span className="font-medium text-gray-800">{profile.savingsGoal}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Workspace type</span>
                <span className="font-medium text-gray-800 capitalize">{group.type}</span>
              </div>
            </div>
            <button onClick={finish} className="w-full bg-avenue-600 text-white py-3 rounded-xl font-medium hover:bg-avenue-dark/90">
              Go to Dashboard →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
