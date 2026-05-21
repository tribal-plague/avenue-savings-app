import useStore from '../store/useStore'
import { pct, monthLabel } from '../utils/formatters'
import { useCurrency } from '../hooks/useCurrency'
import { getMonthlyTrend, getMonthExpenses, sumExpenses, getCategoryTotals } from '../utils/insights'
import { getBillStatus, getMonthlyCommitment } from '../utils/bills'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts'

const CHART_COLORS = ['#7c3aed','#0ea5e9','#f97316','#10b981','#ec4899','#f59e0b','#ef4444','#14b8a6']

function SectionCard({ title, sub, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-avenue-border shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-avenue-dark">{title}</h3>
        {sub && <p className="text-xs text-avenue-muted/70 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-avenue-border rounded-xl shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-avenue-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{fmt(p.value)}</p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { fmt } = useCurrency()
  const activeGroupId = useStore((s) => s.activeGroupId)
  const expenses = useStore((s) => s.expenses)
  const bills = useStore((s) => s.getGroupBills(activeGroupId))
  const categories = useStore((s) => s.getGroupCategories(activeGroupId))
  const users = useStore((s) => s.users)
  const groups = useStore((s) => s.groups)

  const group = groups.find((g) => g.id === activeGroupId)
  const groupExpenses = expenses.filter((e) => e.groupId === activeGroupId)

  const now = new Date()
  const monthTrend = getMonthlyTrend(groupExpenses, 6)
  const thisMonthExp = getMonthExpenses(groupExpenses, now.getFullYear(), now.getMonth())
  const lastMonthExp = getMonthExpenses(groupExpenses, now.getFullYear(), now.getMonth() - 1)

  const thisCatTotals = getCategoryTotals(thisMonthExp, categories).filter((c) => c.spent > 0)
  const lastCatTotals = getCategoryTotals(lastMonthExp, categories)

  // Budget vs actual for current month
  const budgetVsActual = categories
    .filter((c) => c.budget > 0)
    .map((c) => ({
      name: `${c.icon} ${c.name}`,
      budget: c.budget,
      spent: thisCatTotals.find((t) => t.id === c.id)?.spent || 0,
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 8)

  // Month-over-month per category
  const momData = categories
    .map((c) => ({
      name: `${c.icon} ${c.name}`,
      thisMonth: thisCatTotals.find((t) => t.id === c.id)?.spent || 0,
      lastMonth: lastCatTotals.find((t) => t.id === c.id)?.spent || 0,
    }))
    .filter((c) => c.thisMonth > 0 || c.lastMonth > 0)
    .sort((a, b) => b.thisMonth - a.thisMonth)
    .slice(0, 6)

  // Per-member spending (for groups)
  const memberSpending = (group?.members || []).map((uid) => {
    const user = users[uid]
    const total = sumExpenses(thisMonthExp.filter((e) => e.paidBy === uid))
    return { name: user?.name?.split(' ')[0] || 'Unknown', total, color: user?.avatarColor || '#9ca3af' }
  }).filter((m) => m.total > 0)

  const totalThisMonth = sumExpenses(thisMonthExp)
  const totalLastMonth = sumExpenses(lastMonthExp)
  const momChange = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth * 100).toFixed(1) : null
  const monthlyBills = getMonthlyCommitment(bills)
  const dueBills = bills.filter((b) => ['overdue', 'due_today'].includes(getBillStatus(b.nextDueDate).state))

  return (
    <div className="p-6 animate-fade-in space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {monthTrend.slice(-3).reverse().map((m, i) => (
          <div key={m.label} className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
            <p className="text-xs font-medium text-avenue-muted/70 mb-1">{i === 0 ? 'This month' : i === 1 ? 'Last month' : '2 months ago'}</p>
            <p className="text-xl font-bold text-avenue-dark">{fmt(m.total)}</p>
            <p className="text-xs text-avenue-muted/70 mt-0.5">{m.label}</p>
          </div>
        ))}
        <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
          <p className="text-xs font-medium text-avenue-muted/70 mb-1">Month change</p>
          <p className={`text-xl font-bold ${momChange && parseFloat(momChange) < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {momChange !== null ? (parseFloat(momChange) > 0 ? '+' : '') + momChange + '%' : '—'}
          </p>
          <p className="text-xs text-avenue-muted/70 mt-0.5">vs last month</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
          <p className="text-xs font-medium text-avenue-muted/70 mb-1">Fixed bills</p>
          <p className="text-xl font-bold text-avenue-dark">{fmt(monthlyBills)}</p>
          <p className="text-xs text-avenue-muted/70 mt-0.5">{dueBills.length} due or overdue</p>
        </div>
      </div>

      {/* Spending trend */}
      <SectionCard title="6-Month Spending Trend" sub="Total expenses per month">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthTrend}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category pie */}
        <SectionCard title="Spending by Category" sub={`${monthLabel(now.getFullYear(), now.getMonth())}`}>
          {thisCatTotals.length === 0 ? (
            <p className="text-sm text-avenue-muted/70 text-center py-8">No expenses this month</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={thisCatTotals} dataKey="spent" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {thisCatTotals.map((entry, i) => (
                      <Cell key={entry.id} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {thisCatTotals.slice(0, 6).map((cat, i) => (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-avenue-muted text-xs truncate">{cat.icon} {cat.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-avenue-dark ml-2">{pct(cat.spent, totalThisMonth)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Budget vs actual */}
        <SectionCard title="Budget vs Actual" sub="This month by category">
          {budgetVsActual.length === 0 ? (
            <p className="text-sm text-avenue-muted/70 text-center py-8">No budget data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetVsActual} layout="vertical" barCategoryGap="30%">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={90} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="budget" name="Budget" fill="#e9d5ff" radius={[0, 4, 4, 0]} />
                <Bar dataKey="spent" name="Spent" radius={[0, 4, 4, 0]}>
                  {budgetVsActual.map((entry, i) => (
                    <Cell key={i} fill={entry.spent > entry.budget ? '#ef4444' : '#7c3aed'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Month over month + per member */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month over month by category */}
        <SectionCard title="Month-over-Month" sub="This month vs last month per category">
          {momData.length === 0 ? (
            <p className="text-sm text-avenue-muted/70 text-center py-8">Not enough data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={momData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="lastMonth" name="Last month" fill="#e9d5ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="thisMonth" name="This month" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Per-member spending */}
        {group?.members?.length > 1 ? (
          <SectionCard title="Spending by Member" sub="This month">
            {memberSpending.length === 0 ? (
              <p className="text-sm text-avenue-muted/70 text-center py-8">No expenses recorded this month</p>
            ) : (
              <div className="space-y-3 pt-2">
                {memberSpending.map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: m.color }}>
                      {m.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-avenue-dark">{m.name}</span>
                        <span className="font-bold text-avenue-dark">{fmt(m.total)}</span>
                      </div>
                      <div className="h-2 bg-avenue-light rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct(m.total, totalThisMonth)}%`, backgroundColor: m.color }} />
                      </div>
                    </div>
                    <span className="text-xs text-avenue-muted/70 w-8 text-right">{pct(m.total, totalThisMonth)}%</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        ) : (
          <SectionCard title="Daily Average" sub="Spending pace this month">
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-4xl font-bold text-avenue-dark">{fmt(now.getDate() > 0 ? totalThisMonth / now.getDate() : 0)}</p>
              <p className="text-sm text-avenue-muted/70 mt-2">per day this month</p>
              <p className="text-xs text-avenue-muted/40 mt-1">Based on {now.getDate()} days of data</p>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}
