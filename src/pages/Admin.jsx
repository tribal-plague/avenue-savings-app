import { useState } from 'react'
import { Crown, Trash2, UserX, RefreshCw, Download, ShieldCheck, Users, Receipt, AlertTriangle } from 'lucide-react'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'
import { fmtDate, initials, monthLabel } from '../utils/formatters'
import { useCurrency } from '../hooks/useCurrency'
import { getMonthExpenses, sumExpenses, getCategoryTotals } from '../utils/insights'
import { getBillStatus, getMonthlyCommitment } from '../utils/bills'

export default function Admin() {
  const { fmt } = useCurrency()
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const expenses = useStore((s) => s.expenses)
  const bills = useStore((s) => s.getGroupBills(activeGroupId))
  const activityLog = useStore((s) => s.getGroupActivity(activeGroupId))
  const categories = useStore((s) => s.getGroupCategories(activeGroupId))
  const invites = useStore((s) => s.invites)
  const removeMember = useStore((s) => s.removeMember)
  const toggleAdmin = useStore((s) => s.toggleAdmin)
  const updateGroup = useStore((s) => s.updateGroup)
  const deleteExpense = useStore((s) => s.deleteExpense)
  const revokeInvite = useStore((s) => s.revokeInvite)
  const regenerateInviteCode = useStore((s) => s.regenerateInviteCode)
  const isGroupAdmin = useStore((s) => s.isGroupAdmin)

  const [tab, setTab] = useState('overview')
  const [removeConfirm, setRemoveConfirm] = useState(null)
  const [deleteExpConfirm, setDeleteExpConfirm] = useState(null)

  const group = groups.find((g) => g.id === activeGroupId)
  const isAdmin = isGroupAdmin(activeGroupId)

  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-avenue-muted font-medium">Admin access required</p>
          <p className="text-sm text-avenue-muted/70 mt-1">You need admin privileges to view this page.</p>
        </div>
      </div>
    )
  }

  const now = new Date()
  const groupExpenses = expenses.filter((e) => e.groupId === activeGroupId)
  const thisMonthExp = getMonthExpenses(groupExpenses, now.getFullYear(), now.getMonth())
  const catTotals = getCategoryTotals(thisMonthExp, categories)
  const pendingInvites = invites.filter((i) => i.groupId === activeGroupId)
  const overBudgetCats = catTotals.filter((c) => c.over > 0)
  const overdueBills = bills.filter((b) => getBillStatus(b.nextDueDate).state === 'overdue')
  const dueTodayBills = bills.filter((b) => getBillStatus(b.nextDueDate).state === 'due_today')
  const monthlyBills = getMonthlyCommitment(bills)

  const memberStats = (group?.members || []).map((uid) => {
    const user = users[uid]
    const totalSpent = sumExpenses(groupExpenses.filter((e) => e.paidBy === uid))
    const thisMonthSpent = sumExpenses(thisMonthExp.filter((e) => e.paidBy === uid))
    const expCount = groupExpenses.filter((e) => e.paidBy === uid).length
    return { uid, user, totalSpent, thisMonthSpent, expCount, isAdmin: group?.admins?.includes(uid) }
  })

  const TABS = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'expenses', label: 'All Expenses', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: RefreshCw },
  ]

  const exportCSV = () => {
    const rows = [['Date', 'Description', 'Category', 'Amount', 'Paid By']]
    groupExpenses.forEach((e) => {
      const cat = categories.find((c) => c.id === e.categoryId)
      const user = users[e.paidBy]
      rows.push([e.date, e.title, cat?.name || 'Uncategorized', e.amount, user?.name || e.paidBy])
    })
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${group?.name || 'avenue'}-expenses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Admin badge */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <Crown className="text-amber-500" size={20} />
        <div>
          <p className="text-sm font-semibold text-amber-800">Admin Panel — {group?.name}</p>
          <p className="text-xs text-amber-600">You have full administrative access to this group.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-avenue-light rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === id ? 'bg-white text-avenue-dark shadow-sm' : 'text-avenue-muted hover:text-avenue-dark'}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
              <p className="text-xs text-avenue-muted/70 mb-1">Total members</p>
              <p className="text-2xl font-bold text-avenue-dark">{group?.members?.length || 0}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
              <p className="text-xs text-avenue-muted/70 mb-1">This month spend</p>
              <p className="text-2xl font-bold text-avenue-dark">{fmt(sumExpenses(thisMonthExp))}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
              <p className="text-xs text-avenue-muted/70 mb-1">Total expenses</p>
              <p className="text-2xl font-bold text-avenue-dark">{groupExpenses.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
              <p className="text-xs text-avenue-muted/70 mb-1">Pending invites</p>
              <p className="text-2xl font-bold text-avenue-dark">{pendingInvites.length}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
              <p className="text-xs text-avenue-muted/70 mb-1">Fixed bills</p>
              <p className="text-2xl font-bold text-avenue-dark">{fmt(monthlyBills)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
              <p className="text-xs text-avenue-muted/70 mb-1">Due or overdue</p>
              <p className="text-2xl font-bold text-red-500">{overdueBills.length + dueTodayBills.length}</p>
            </div>
          </div>

          {overBudgetCats.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <p className="text-sm font-semibold text-red-700">Over-budget alerts</p>
              </div>
              <div className="space-y-2">
                {overBudgetCats.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between text-sm">
                    <span className="text-red-700">{cat.icon} {cat.name}</span>
                    <span className="text-red-600 font-semibold">{fmt(cat.over)} over budget</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member spending breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-avenue-border shadow-sm">
            <p className="font-semibold text-avenue-dark mb-4">Member Spending This Month</p>
            <div className="space-y-3">
              {memberStats.map(({ uid, user, thisMonthSpent, expCount, isAdmin: memberIsAdmin }) => (
                <div key={uid} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: user?.avatarColor || '#9ca3af' }}>
                    {initials(user?.name || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-avenue-dark">{user?.name}</span>
                      {memberIsAdmin && <Crown size={11} className="text-amber-500" />}
                      {uid === currentUserId && <span className="text-xs text-avenue-muted/70">(you)</span>}
                    </div>
                    <p className="text-xs text-avenue-muted/70">{expCount} expense{expCount !== 1 ? 's' : ''} total</p>
                  </div>
                  <span className="text-sm font-bold text-avenue-dark">{fmt(thisMonthSpent)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-avenue-border shadow-sm">
            <p className="font-semibold text-avenue-dark mb-4">Household Activity</p>
            {activityLog.length === 0 ? (
              <p className="text-sm text-avenue-muted/70 py-3">No bill activity yet.</p>
            ) : (
              <div className="space-y-3">
                {activityLog.slice(0, 6).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 border-b border-avenue-border last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-sm text-avenue-dark">{item.summary}</p>
                      <p className="text-xs text-avenue-muted/70 mt-0.5">{users[item.actorId]?.name || 'Household'} - {fmtDate(item.createdAt.slice(0, 10))}</p>
                    </div>
                    <span className="text-xs text-avenue-muted bg-avenue-surface border border-avenue-border rounded-full px-2 py-0.5">{item.action.replaceAll('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <div className="bg-white rounded-2xl border border-avenue-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-avenue-border bg-avenue-surface">
                <th className="text-left text-xs font-medium text-avenue-muted/70 px-5 py-3 uppercase tracking-wider">Member</th>
                <th className="text-left text-xs font-medium text-avenue-muted/70 px-5 py-3 uppercase tracking-wider">Role</th>
                <th className="text-right text-xs font-medium text-avenue-muted/70 px-5 py-3 uppercase tracking-wider">This Month</th>
                <th className="text-right text-xs font-medium text-avenue-muted/70 px-5 py-3 uppercase tracking-wider">All Time</th>
                <th className="text-right text-xs font-medium text-avenue-muted/70 px-5 py-3 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-avenue-border">
              {memberStats.map(({ uid, user, thisMonthSpent, totalSpent, isAdmin: memberIsAdmin }) => (
                <tr key={uid} className="hover:bg-avenue-surface transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: user?.avatarColor || '#9ca3af' }}>
                        {initials(user?.name || '?')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-avenue-dark">{user?.name}</p>
                        <p className="text-xs text-avenue-muted/70">{user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {memberIsAdmin
                      ? <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full w-fit"><Crown size={10} />Admin</span>
                      : <span className="text-xs text-avenue-muted/70 bg-avenue-light px-2 py-0.5 rounded-full">Member</span>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm font-semibold text-avenue-dark">{fmt(thisMonthSpent)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-sm text-avenue-muted">{fmt(totalSpent)}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {uid !== currentUserId && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAdmin(activeGroupId, uid)}
                          className="text-xs border border-avenue-border text-avenue-muted px-2.5 py-1 rounded-lg hover:bg-avenue-surface"
                        >
                          {memberIsAdmin ? 'Demote' : 'Make admin'}
                        </button>
                        <button
                          onClick={() => setRemoveConfirm({ uid, name: user?.name })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-avenue-muted/70 hover:text-red-500 transition-colors"
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pendingInvites.length > 0 && (
            <div className="border-t border-avenue-border p-5">
              <p className="text-xs font-semibold text-avenue-muted/70 uppercase tracking-wider mb-3">Pending Invites</p>
              <div className="space-y-2">
                {pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-avenue-surface rounded-xl">
                    <div>
                      <p className="text-sm text-avenue-dark">{inv.email}</p>
                      <p className="text-xs text-avenue-muted/70">Invited {fmtDate(inv.createdAt.slice(0, 10))}</p>
                    </div>
                    <button onClick={() => revokeInvite(inv.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2.5 py-1 rounded-lg">
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-avenue-muted/70">{groupExpenses.length} total expenses</p>
            <button onClick={exportCSV} className="flex items-center gap-2 border border-avenue-border text-avenue-muted px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-surface">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-avenue-border shadow-sm overflow-hidden">
            {[...groupExpenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50).map((exp, idx, arr) => {
              const cat = categories.find((c) => c.id === exp.categoryId)
              const paidByUser = users[exp.paidBy]
              return (
                <div key={exp.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-avenue-surface ${idx < arr.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <span className="text-xl">{cat?.icon || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-avenue-dark">{exp.title}</p>
                    <p className="text-xs text-avenue-muted/70">{fmtDate(exp.date)} · {cat?.name || 'Uncategorized'} · {paidByUser?.name || 'Unknown'}</p>
                  </div>
                  <span className="text-sm font-bold text-avenue-dark mr-3">{fmt(exp.amount)}</span>
                  <button onClick={() => setDeleteExpConfirm(exp)} className="p-1.5 rounded-lg hover:bg-red-50 text-avenue-muted/40 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-white rounded-2xl p-5 border border-avenue-border shadow-sm">
            <h3 className="text-sm font-semibold text-avenue-dark mb-4">Group Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-avenue-muted mb-1">Group name</label>
                <div className="flex gap-2">
                  <input defaultValue={group?.name} id="admin-group-name"
                    className="flex-1 border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40" />
                  <button
                    onClick={() => { const el = document.getElementById('admin-group-name'); if (el) updateGroup(activeGroupId, { name: el.value }) }}
                    className="bg-avenue-dark text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90"
                  >Save</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-avenue-muted mb-1">Group type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['individual', '👤', 'Individual'], ['couple', '💑', 'Couple'], ['group', '👥', 'Group']].map(([val, icon, label]) => (
                    <button key={val} onClick={() => updateGroup(activeGroupId, { type: val })}
                      className={`p-2.5 rounded-xl border text-sm transition-all text-center ${group?.type === val ? 'border-avenue-dark/30 bg-avenue-surface text-avenue-dark font-medium' : 'border-avenue-border text-avenue-muted hover:bg-avenue-surface'}`}>
                      <div>{icon}</div>
                      <div className="text-xs mt-0.5">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-avenue-border shadow-sm">
            <h3 className="text-sm font-semibold text-avenue-dark mb-4">Invite Code</h3>
            <div className="flex items-center gap-3 p-3 bg-avenue-surface rounded-xl mb-3">
              <code className="flex-1 text-center font-mono text-lg font-bold text-avenue-dark tracking-widest">{group?.inviteCode}</code>
            </div>
            <button onClick={() => regenerateInviteCode(activeGroupId)} className="flex items-center gap-2 text-sm text-avenue-muted hover:text-avenue-dark">
              <RefreshCw size={13} /> Regenerate code (invalidates current code)
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
            <h3 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h3>
            <button onClick={exportCSV} className="flex items-center gap-2 text-sm text-avenue-muted hover:text-avenue-dark mb-3">
              <Download size={13} /> Export all expenses as CSV
            </button>
          </div>
        </div>
      )}

      {/* Remove member confirm */}
      <Modal open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} title="Remove Member" size="sm">
        {removeConfirm && (
          <div>
            <p className="text-sm text-avenue-muted mb-5">Remove <span className="font-semibold">{removeConfirm.name}</span> from {group?.name}? They will lose access to shared expenses.</p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveConfirm(null)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => { removeMember(activeGroupId, removeConfirm.uid); setRemoveConfirm(null) }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">Remove</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete expense confirm */}
      <Modal open={!!deleteExpConfirm} onClose={() => setDeleteExpConfirm(null)} title="Delete Expense" size="sm">
        {deleteExpConfirm && (
          <div>
            <p className="text-sm text-avenue-muted mb-5">Delete <span className="font-semibold">{deleteExpConfirm.title}</span> ({fmt(deleteExpConfirm.amount)})? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteExpConfirm(null)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => { deleteExpense(deleteExpConfirm.id); setDeleteExpConfirm(null) }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
