import { useState } from 'react'
import { Save, Pencil } from 'lucide-react'
import useStore from '../store/useStore'
import { pct, initials } from '../utils/formatters'
import { useCurrency } from '../hooks/useCurrency'
import { generateInsights } from '../utils/insights'

const AVATAR_COLORS = ['#7c3aed','#0ea5e9','#10b981','#f97316','#ec4899','#f59e0b','#ef4444','#6366f1']

const CURRENCIES = [
  { symbol: '$',  label: 'USD — US Dollar' },
  { symbol: '£',  label: 'GBP — British Pound' },
  { symbol: '€',  label: 'EUR — Euro' },
  { symbol: '₹',  label: 'INR — Indian Rupee' },
  { symbol: '¥',  label: 'JPY — Japanese Yen' },
  { symbol: 'A$', label: 'AUD — Australian Dollar' },
  { symbol: 'C$', label: 'CAD — Canadian Dollar' },
  { symbol: 'Fr', label: 'CHF — Swiss Franc' },
  { symbol: '₩',  label: 'KRW — Korean Won' },
  { symbol: 'د.إ', label: 'AED — UAE Dirham' },
  { symbol: 'R',  label: 'ZAR — South African Rand' },
  { symbol: 'kr', label: 'SEK — Swedish Krona' },
]

export default function Budget() {
  const currentUserId = useStore((s) => s.currentUserId)
  const users         = useStore((s) => s.users)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const expenses      = useStore((s) => s.expenses)
  const categories    = useStore((s) => s.getGroupCategories(activeGroupId))
  const updateProfile = useStore((s) => s.updateProfile)
  const updateCategory = useStore((s) => s.updateCategory)
  const { fmt: fmtCurrency, symbol } = useCurrency()

  const user = users[currentUserId]
  const groupExpenses = expenses.filter((e) => e.groupId === activeGroupId)

  const [editProfile,   setEditProfile]   = useState(false)
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    salary: user?.salary || '',
    savingsGoal: user?.savingsGoal || 20,
    avatarColor: user?.avatarColor || '#7c3aed',
    currencySymbol: user?.currencySymbol || '$',
  })
  const [editingBudget, setEditingBudget] = useState({})

  const { catTotals } = generateInsights(groupExpenses, categories, user, fmtCurrency)

  const salary = user?.salary || 0
  const savingsPct = user?.savingsGoal || 20
  const savingsTarget = salary * (savingsPct / 100)
  const totalCatBudget = categories.reduce((acc, c) => acc + (c.budget || 0), 0)
  const unallocated = salary - savingsTarget - totalCatBudget

  const saveProfile = () => {
    updateProfile({ ...profile, salary: parseFloat(profile.salary) || 0, savingsGoal: parseFloat(profile.savingsGoal) || 0 })
    setEditProfile(false)
  }

  return (
    <div className="p-6 animate-fade-in max-w-3xl">

      {/* Profile card */}
      <div className="bg-white rounded-xl p-6 border border-avenue-border mb-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-sm font-semibold text-avenue-dark">Your Profile</h2>
          <button onClick={() => setEditProfile(!editProfile)} className="flex items-center gap-1.5 text-xs text-avenue-muted hover:text-avenue-dark transition-colors">
            <Pencil size={12} /> {editProfile ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-avenue-muted mb-1">Full name</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full border border-avenue-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-avenue-muted mb-1">Email</label>
                <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full border border-avenue-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-avenue-muted mb-1">Monthly salary</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-avenue-muted/70 text-sm">{symbol}</span>
                  <input type="number" value={profile.salary} onChange={(e) => setProfile({ ...profile, salary: e.target.value })}
                    className="w-full border border-avenue-border rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-avenue-muted mb-1">Savings goal (%)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" value={profile.savingsGoal}
                    onChange={(e) => setProfile({ ...profile, savingsGoal: e.target.value })}
                    className="w-full border border-avenue-border rounded-lg px-3 pr-7 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-avenue-muted/70 text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Currency selector */}
            <div>
              <label className="block text-xs font-medium text-avenue-muted mb-1">Currency</label>
              <select
                value={profile.currencySymbol}
                onChange={(e) => setProfile({ ...profile, currencySymbol: e.target.value })}
                className="w-full border border-avenue-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 bg-white text-avenue-dark"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol}>{c.symbol} — {c.label.split('—')[1].trim()}</option>
                ))}
                {!CURRENCIES.find((c) => c.symbol === profile.currencySymbol) && (
                  <option value={profile.currencySymbol}>Custom: {profile.currencySymbol}</option>
                )}
              </select>
              <p className="text-xs text-avenue-muted mt-1.5">This symbol appears throughout the app on all amounts.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-avenue-muted mb-2">Avatar color</label>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button key={c} onClick={() => setProfile({ ...profile, avatarColor: c })}
                    className={`w-7 h-7 rounded-full transition-all ${profile.avatarColor === c ? 'ring-2 ring-offset-2 ring-avenue-dark/40 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button onClick={saveProfile} className="flex items-center gap-2 bg-avenue-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-avenue-dark/90 transition-all">
              <Save size={14} /> Save profile
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: user?.avatarColor || '#7c3aed' }}>
              {initials(user?.name)}
            </div>
            <div>
              <p className="font-semibold text-avenue-dark text-base">{user?.name}</p>
              <p className="text-sm text-avenue-muted">{user?.email}</p>
              <p className="text-xs text-avenue-muted mt-0.5">Currency: <span className="font-medium text-avenue-dark">{symbol}</span></p>
            </div>
          </div>
        )}
      </div>

      {/* Budget overview */}
      {salary > 0 && (
        <div className="bg-white rounded-xl p-6 border border-avenue-border mb-6">
          <h2 className="text-sm font-semibold text-avenue-dark mb-5">Monthly Budget Overview</h2>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="text-center p-4 bg-avenue-surface rounded-xl border border-avenue-border">
              <p className="text-xl font-bold text-avenue-dark">{fmtCurrency(salary)}</p>
              <p className="text-xs text-avenue-muted mt-1">Monthly Income</p>
            </div>
            <div className="text-center p-4 bg-avenue-surface rounded-xl border border-avenue-border">
              <p className="text-xl font-bold text-avenue-dark">{fmtCurrency(savingsTarget)}</p>
              <p className="text-xs text-avenue-muted mt-1">Savings Goal ({savingsPct}%)</p>
            </div>
            <div className={`text-center p-4 rounded-xl border ${unallocated < 0 ? 'bg-red-50 border-red-200' : 'bg-avenue-surface border-avenue-border'}`}>
              <p className={`text-xl font-bold ${unallocated < 0 ? 'text-red-600' : 'text-avenue-dark'}`}>{fmtCurrency(Math.abs(unallocated))}</p>
              <p className={`text-xs mt-1 ${unallocated < 0 ? 'text-red-400' : 'text-avenue-muted'}`}>
                {unallocated < 0 ? 'Over-allocated' : 'Unallocated'}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 rounded-full bg-avenue-dark/30" style={{ width: `${pct(savingsTarget, salary)}%` }} />
              <span className="text-xs text-avenue-muted">Savings {pct(savingsTarget, salary)}%</span>
            </div>
            {categories.slice(0, 5).map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className="h-3 rounded-full" style={{ width: `${pct(cat.budget, salary)}%`, backgroundColor: cat.color + 'cc' }} />
                <span className="text-xs text-avenue-muted">{cat.icon} {cat.name} {pct(cat.budget, salary)}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-avenue-muted">Budget allocation as % of income</p>
        </div>
      )}

      {salary === 0 && (
        <div className="bg-avenue-surface border border-avenue-border rounded-xl p-5 mb-6 text-sm text-avenue-muted">
          Set your monthly salary above to unlock budget tracking and savings projections.
        </div>
      )}

      {/* Category budgets */}
      <div className="bg-white rounded-xl p-6 border border-avenue-border">
        <h2 className="text-sm font-semibold text-avenue-dark mb-4">Category Budgets</h2>
        <div className="space-y-2">
          {catTotals.map((cat) => {
            const isEditing = editingBudget[cat.id] !== undefined
            return (
              <div key={cat.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-avenue-surface transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: cat.color + '18' }}>
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-avenue-dark">{cat.name}</p>
                  <p className="text-xs text-avenue-muted">Spent: {fmtCurrency(cat.spent)}</p>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-avenue-muted text-xs">{symbol}</span>
                      <input
                        type="number"
                        value={editingBudget[cat.id]}
                        onChange={(e) => setEditingBudget({ ...editingBudget, [cat.id]: e.target.value })}
                        className="w-24 border border-avenue-border rounded-lg pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={() => { updateCategory(cat.id, { budget: parseFloat(editingBudget[cat.id]) || 0 }); setEditingBudget((p) => { const n = { ...p }; delete n[cat.id]; return n }) }}
                      className="text-xs bg-avenue-dark text-white px-3 py-1.5 rounded-lg hover:bg-avenue-dark/90 transition-all"
                    >Save</button>
                    <button
                      onClick={() => setEditingBudget((p) => { const n = { ...p }; delete n[cat.id]; return n })}
                      className="text-xs text-avenue-muted hover:text-avenue-dark"
                    >✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-avenue-dark w-20 text-right">{fmtCurrency(cat.budget)}/mo</span>
                    <button
                      onClick={() => setEditingBudget({ ...editingBudget, [cat.id]: cat.budget })}
                      className="p-1.5 rounded-lg hover:bg-avenue-light text-avenue-muted hover:text-avenue-dark transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
