import useStore from '../store/useStore'
import { fmtShortDate, pct, daysInMonth } from '../utils/formatters'
import { generateInsights, getMonthlyTrend } from '../utils/insights'
import { useCurrency } from '../hooks/useCurrency'
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis } from 'recharts'

function SavingsBlocks({ saved, goal }) {
  const pctDone = goal > 0 ? Math.min(1, saved / goal) : 0
  const BLOCKS = 10
  const filled = Math.round(pctDone * BLOCKS)
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: BLOCKS }).map((_, i) => (
        <div key={i} className={`h-10 rounded-md transition-all ${i < filled ? 'bg-avenue-dark' : 'bg-avenue-light'}`} />
      ))}
    </div>
  )
}

function CategoryRow({ cat, fmtCurrency }) {
  const pctUsed = cat.budget > 0 ? Math.min(100, pct(cat.spent, cat.budget)) : 0
  const over = cat.spent > cat.budget && cat.budget > 0
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-avenue-border last:border-0">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#0D2E3F' }} />
      <span className="flex-1 text-sm text-avenue-dark">{cat.name}</span>
      <div className="w-24 h-1 bg-avenue-light rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pctUsed}%`, backgroundColor: over ? '#ef4444' : cat.color || '#0D2E3F' }} />
      </div>
      <span className={`text-sm font-semibold w-20 text-right tabular-nums ${over ? 'text-red-500' : 'text-avenue-dark'}`}>
        {fmtCurrency(cat.spent)}
      </span>
    </div>
  )
}

export default function Dashboard() {
  const currentUserId = useStore((s) => s.currentUserId)
  const users         = useStore((s) => s.users)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const groups        = useStore((s) => s.groups)
  const expenses      = useStore((s) => s.expenses)
  const categories    = useStore((s) => s.getGroupCategories(activeGroupId))
  const setPage       = useStore((s) => s.setPage)
  const { fmt: fmtCurrency } = useCurrency()

  const user        = users[currentUserId]
  const activeGroup = groups.find((g) => g.id === activeGroupId)
  const groupExpenses = expenses.filter((e) => e.groupId === activeGroupId)

  const now      = new Date()
  const daysLeft = daysInMonth(now.getFullYear(), now.getMonth()) - now.getDate()
  const salary   = user?.salary || 0
  const savingsPct    = user?.savingsGoal || 20
  const savingsTarget = salary * (savingsPct / 100)

  const { insights, suggestions, thisTotal, lastTotal, projectedSavings, remaining, budget, catTotals } =
    generateInsights(groupExpenses, categories, user, fmtCurrency)

  const trendData    = getMonthlyTrend(groupExpenses)
  const monthChange  = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0
  const availToSpend = Math.max(0, remaining)

  const topCats  = [...catTotals].filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent)
  const recentExp = [...groupExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const members   = (activeGroup?.members || []).map((id) => users[id]).filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 animate-fade-in pb-24 md:pb-8">

      {/* Hero row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <p className="text-xs font-medium text-avenue-muted uppercase tracking-widest mb-2">Available to Spend</p>
          <p className="text-5xl md:text-6xl font-bold text-avenue-dark leading-none tabular-nums">
            {fmtCurrency(availToSpend)}
          </p>
          <p className="text-sm text-avenue-muted mt-2">
            of {fmtCurrency(budget)} budget · {fmtCurrency(thisTotal)} spent this month
            {monthChange !== 0 && (
              <span className={`ml-2 font-medium ${monthChange > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                ({monthChange > 0 ? '+' : ''}{monthChange}% vs last month)
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-6 md:gap-8 flex-shrink-0">
          <div>
            <p className="text-xs font-medium text-avenue-muted uppercase tracking-widest mb-1">Monthly Income</p>
            <p className="text-xl md:text-2xl font-bold text-avenue-dark tabular-nums">{salary > 0 ? fmtCurrency(salary) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-avenue-muted uppercase tracking-widest mb-1">Savings Goal</p>
            <div className="flex items-center gap-2">
              <p className="text-xl md:text-2xl font-bold text-avenue-dark tabular-nums">{fmtCurrency(savingsTarget)}</p>
              {salary > 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${projectedSavings >= savingsTarget ? 'bg-avenue-surface text-avenue-dark border-avenue-border' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {projectedSavings >= savingsTarget ? 'On track' : 'At risk'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

        {/* Left col */}
        <div className="space-y-4 md:space-y-5">

          {/* Spending Breakdown */}
          <div className="bg-avenue-surface rounded-xl border border-avenue-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-avenue-dark text-sm">Spending Breakdown</h3>
              <button onClick={() => setPage('categories')} className="text-xs text-avenue-muted hover:text-avenue-dark transition-colors">
                Manage →
              </button>
            </div>
            {topCats.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2">🧾</p>
                <p className="text-sm text-avenue-muted">No expenses this month</p>
                <button onClick={() => setPage('expenses')} className="text-xs text-avenue-dark font-medium mt-2 hover:text-avenue-muted">Add your first →</button>
              </div>
            ) : (
              <div>
                {topCats.map((cat) => <CategoryRow key={cat.id} cat={cat} fmtCurrency={fmtCurrency} />)}
              </div>
            )}
          </div>

          {/* Avenue Analysis — always dark regardless of mode */}
          <div className="bg-[#0D2E3F] dark:bg-zinc-900 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-white/40 text-sm">✦</span>
              <h3 className="font-semibold text-white text-sm">Avenue Analysis</h3>
            </div>
            <div className="space-y-3">
              {insights.slice(0, 3).map((ins, i) => (
                <div key={i} className="rounded-lg p-3.5 bg-white/8 border border-white/10">
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm leading-none mt-0.5 flex-shrink-0 opacity-70">{ins.icon}</span>
                    <div>
                      <p className="text-white font-medium text-xs mb-0.5">{ins.title}</p>
                      <p className="text-white/50 text-xs leading-relaxed">{ins.body}</p>
                    </div>
                  </div>
                </div>
              ))}
              {suggestions[0] && (
                <div className="mt-1 p-3 border border-white/10 bg-white/6 rounded-lg">
                  <p className="text-white/50 text-xs font-medium mb-0.5">Suggestion</p>
                  <p className="text-white/50 text-xs leading-relaxed">{suggestions[0].body}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="lg:col-span-2 space-y-4 md:space-y-5">

          {/* Savings Progress */}
          <div className="bg-avenue-surface rounded-xl border border-avenue-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-avenue-dark text-sm">Savings Progress</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-avenue-muted">
                  {salary > 0 ? `${Math.round(Math.min(100, (projectedSavings / savingsTarget) * 100))}% of goal` : 'Set salary to track'}
                </span>
                <button onClick={() => setPage('budget')} className="text-xs text-avenue-muted hover:text-avenue-dark transition-colors">
                  Modify →
                </button>
              </div>
            </div>
            <SavingsBlocks saved={Math.max(0, projectedSavings)} goal={savingsTarget} />
            <div className="flex items-end justify-between mt-3">
              <div>
                <p className="text-2xl font-bold text-avenue-dark tabular-nums">{fmtCurrency(Math.max(0, projectedSavings))}</p>
                <p className="text-xs text-avenue-muted">projected savings · goal: {fmtCurrency(savingsTarget)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-avenue-dark">{daysLeft} days left</p>
                <p className="text-xs text-avenue-muted">this month</p>
              </div>
            </div>
          </div>

          {/* Spending trend */}
          <div className="bg-avenue-surface rounded-xl border border-avenue-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-avenue-dark text-sm">Spending Trend</h3>
              <button onClick={() => setPage('analytics')} className="text-xs text-avenue-muted hover:text-avenue-dark transition-colors">Full analytics →</button>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D2E3F" stopOpacity={0.10} />
                    <stop offset="95%" stopColor="#0D2E3F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#71717A' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [fmtCurrency(v), 'Spent']} contentStyle={{ borderRadius: 8, border: '1px solid #E4E4E7', fontSize: 12, backgroundColor: 'rgb(var(--av-surface))' }} />
                <Area type="monotone" dataKey="total" stroke="#0D2E3F" strokeWidth={1.5} fill="url(#dashGrad)" dot={false} activeDot={{ r: 3, fill: '#0D2E3F', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

            {/* Members */}
            <div className="bg-avenue-surface rounded-xl border border-avenue-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-avenue-dark text-sm">Members & Spending</h3>
                <button onClick={() => setPage('groups')} className="text-xs text-avenue-muted hover:text-avenue-dark transition-colors">
                  Invite →
                </button>
              </div>
              <div className="space-y-3">
                {members.map((m) => {
                  const spent = groupExpenses
                    .filter((e) => { const d = new Date(e.date + 'T00:00:00'); return e.paidBy === m.id && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() })
                    .reduce((acc, e) => acc + e.amount, 0)
                  const isYou = m.id === currentUserId
                  const pctOfTotal = thisTotal > 0 ? pct(spent, thisTotal) : 0
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: m.avatarColor || '#0D2E3F' }}>
                            {m.avatarUrl
                              ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                              : (m.avatarEmoji || (m.name || '?')[0])}
                          </div>
                          <div>
                            <span className="text-sm text-avenue-dark">{m.name}</span>
                            {isYou && <span className="ml-1.5 text-xs text-avenue-muted bg-avenue-light px-1.5 py-0.5 rounded-full">You</span>}
                            {activeGroup?.admins?.includes(m.id) && <span className="ml-1 text-xs">👑</span>}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-avenue-dark tabular-nums">{fmtCurrency(spent)}</span>
                      </div>
                      <div className="h-1 bg-avenue-light rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-avenue-dark/50" style={{ width: `${pctOfTotal}%` }} />
                      </div>
                    </div>
                  )
                })}
                {members.length <= 1 && (
                  <p className="text-xs text-avenue-muted pt-1">Invite someone to share expenses. <button onClick={() => setPage('groups')} className="text-avenue-dark font-medium hover:text-avenue-muted">Invite →</button></p>
                )}
              </div>
            </div>

            {/* Recent transactions */}
            <div className="bg-avenue-surface rounded-xl border border-avenue-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-avenue-dark text-sm">Recent Transactions</h3>
                <button onClick={() => setPage('expenses')} className="text-xs text-avenue-muted hover:text-avenue-dark transition-colors">
                  + Add
                </button>
              </div>
              <div className="space-y-1">
                {recentExp.length === 0 && (
                  <p className="text-sm text-avenue-muted py-3 text-center">No transactions yet</p>
                )}
                {recentExp.map((exp) => {
                  const cat = categories.find((c) => c.id === exp.categoryId)
                  return (
                    <div key={exp.id} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-avenue-light">
                        {cat?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-avenue-dark truncate">{exp.title}</p>
                        <p className="text-xs text-avenue-muted">{fmtShortDate(exp.date)}{cat ? ` · ${cat.name}` : ''}</p>
                      </div>
                      <span className="text-sm font-semibold text-avenue-dark tabular-nums flex-shrink-0">−{fmtCurrency(exp.amount)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
