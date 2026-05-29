import { useState } from 'react'
import { Plus, Pencil, Trash2, Filter, SlidersHorizontal } from 'lucide-react'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'
import { fmtDate, today } from '../utils/formatters'
import { useCurrency } from '../hooks/useCurrency'

function ExpenseForm({ initial, onSave, onCancel, categories, users, groupMembers }) {
  const { symbol } = useCurrency()
  const [form, setForm] = useState({
    title: initial?.title || '',
    amount: initial?.amount || '',
    categoryId: initial?.categoryId || categories[0]?.id || '',
    date: initial?.date || today(),
    paidBy: initial?.paidBy || '',
    notes: initial?.notes || '',
  })
  const err = !form.title || !form.amount || !form.date

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Description *</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          placeholder="e.g. Grocery run"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-avenue-muted mb-1">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-avenue-muted/70 text-sm">{symbol}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-avenue-border rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-avenue-muted mb-1">Date *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40 bg-white"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Paid by</label>
        <select
          value={form.paidBy}
          onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40 bg-white"
        >
          {groupMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40 resize-none"
          rows={2}
          placeholder="Optional notes…"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-surface">
          Cancel
        </button>
        <button
          disabled={err}
          onClick={() => onSave({ ...form, amount: parseFloat(form.amount) })}
          className="flex-1 bg-avenue-dark text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 disabled:opacity-40"
        >
          {initial ? 'Save changes' : 'Add expense'}
        </button>
      </div>
    </div>
  )
}

export default function Expenses() {
  const { fmt, symbol } = useCurrency()
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const groups = useStore((s) => s.groups)
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.getGroupCategories(activeGroupId))
  const addExpense = useStore((s) => s.addExpense)
  const updateExpense = useStore((s) => s.updateExpense)
  const deleteExpense = useStore((s) => s.deleteExpense)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [delConfirm, setDelConfirm] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [sortBy, setSortBy] = useState('date')

  const group = groups.find((g) => g.id === activeGroupId)
  const groupMembers = (group?.members || []).map((id) => users[id]).filter(Boolean)

  let groupExpenses = expenses.filter((e) => e.groupId === activeGroupId)
  if (filterCat) groupExpenses = groupExpenses.filter((e) => e.categoryId === filterCat)
  if (filterMonth) groupExpenses = groupExpenses.filter((e) => e.date.startsWith(filterMonth))
  groupExpenses = [...groupExpenses].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date) - new Date(a.date)
    if (sortBy === 'amount') return b.amount - a.amount
    return a.title.localeCompare(b.title)
  })

  const total = groupExpenses.reduce((acc, e) => acc + e.amount, 0)

  const handleAdd = (form) => {
    addExpense({ ...form, groupId: activeGroupId, paidBy: form.paidBy || currentUserId, splitBetween: [form.paidBy || currentUserId] })
    setShowAdd(false)
  }

  const handleEdit = (form) => {
    updateExpense(editing.id, form)
    setEditing(null)
  }

  const handleDelete = (id) => {
    deleteExpense(id)
    setDelConfirm(null)
  }

  // Build month options from existing expenses
  const months = [...new Set(expenses.filter((e) => e.groupId === activeGroupId).map((e) => e.date.slice(0, 7)))].sort().reverse()

  return (
    <div className="p-6 animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-avenue-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="border border-avenue-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-avenue-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          >
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-avenue-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 transition-colors"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="bg-avenue-surface border border-avenue-border rounded-2xl px-5 py-3 mb-5 flex items-center justify-between">
        <span className="text-sm text-avenue-dark">{groupExpenses.length} expense{groupExpenses.length !== 1 ? 's' : ''} shown</span>
        <span className="font-bold text-avenue-dark">{fmt(total)}</span>
      </div>

      {/* List */}
      {groupExpenses.length === 0 ? (
        <div className="text-center py-16 text-avenue-muted/70">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-medium text-avenue-muted">No expenses yet</p>
          <p className="text-sm mt-1">Add your first expense to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-avenue-border shadow-sm overflow-hidden">
          {groupExpenses.map((exp, idx) => {
            const cat = categories.find((c) => c.id === exp.categoryId)
            const paidByUser = users[exp.paidBy]
            return (
              <div key={exp.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-avenue-surface transition-colors ${idx < groupExpenses.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: cat?.color ? cat.color + '18' : '#f3f4f6' }}>
                  {cat?.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-avenue-dark text-sm">{exp.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-avenue-muted/70">{fmtDate(exp.date)}</span>
                    {cat && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.color + '18', color: cat.color }}>
                        {cat.name}
                      </span>
                    )}
                    {paidByUser && groupMembers.length > 1 && (
                      <span className="text-xs text-avenue-muted/70">· Paid by {paidByUser.name}</span>
                    )}
                  </div>
                  {exp.notes && <p className="text-xs text-avenue-muted/70 mt-0.5 truncate">{exp.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-avenue-dark">{fmt(exp.amount)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditing(exp)} className="p-1.5 rounded-lg hover:bg-avenue-light text-avenue-muted/70 hover:text-avenue-dark transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDelConfirm(exp)} className="p-1.5 rounded-lg hover:bg-red-50 text-avenue-muted/70 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <ExpenseForm
          categories={categories}
          users={users}
          groupMembers={groupMembers}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Expense">
        {editing && (
          <ExpenseForm
            initial={editing}
            categories={categories}
            users={users}
            groupMembers={groupMembers}
            onSave={handleEdit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!delConfirm} onClose={() => setDelConfirm(null)} title="Delete Expense" size="sm">
        {delConfirm && (
          <div>
            <p className="text-sm text-avenue-muted mb-5">
              Are you sure you want to delete <span className="font-semibold">{delConfirm.title}</span> ({fmt(delConfirm.amount)})?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDelConfirm(null)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-surface">
                Cancel
              </button>
              <button onClick={() => handleDelete(delConfirm.id)} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
