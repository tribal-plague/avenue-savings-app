import { useMemo, useState } from 'react'
import { CalendarClock, Check, Pencil, Plus, ReceiptText, SkipForward, Trash2 } from 'lucide-react'
import useStore from '../store/useStore'
import Modal from '../components/ui/Modal'
import { fmtDate, today } from '../utils/formatters'
import { useCurrency } from '../hooks/useCurrency'
import { BILL_FREQUENCIES, getBillStatus, getMonthlyCommitment, sortBillsByDueDate } from '../utils/bills'

function statusClasses(state) {
  if (state === 'overdue') return 'bg-red-50 text-red-600 border-red-200'
  if (state === 'due_today') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (state === 'upcoming') return 'bg-sky-50 text-sky-700 border-sky-200'
  return 'bg-avenue-surface text-avenue-muted border-avenue-border'
}

function BillForm({ initial, onSave, onCancel, categories, members, currentUserId }) {
  const { symbol } = useCurrency()
  const initialDate = initial?.nextDueDate || today()
  const [form, setForm] = useState({
    name: initial?.name || '',
    amount: initial?.amount || '',
    categoryId: initial?.categoryId || '',
    payerId: initial?.payerId || currentUserId,
    frequency: initial?.frequency || 'monthly',
    dueDay: initial?.dueDay || new Date(`${initialDate}T00:00:00`).getDate(),
    nextDueDate: initialDate,
    notes: initial?.notes || '',
  })
  const invalid = !form.name || !form.amount || !form.nextDueDate || !form.payerId

  const updateNextDue = (nextDueDate) => {
    setForm({ ...form, nextDueDate, dueDay: new Date(`${nextDueDate}T00:00:00`).getDate() })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Bill name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          placeholder="e.g. Rent, Internet, Electricity"
          autoFocus
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
          <label className="block text-xs font-medium text-avenue-muted mb-1">Next due *</label>
          <input
            type="date"
            value={form.nextDueDate}
            onChange={(e) => updateNextDue(e.target.value)}
            className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-avenue-muted mb-1">Frequency</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          >
            {BILL_FREQUENCIES.map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-avenue-muted mb-1">Paid by *</label>
          <select
            value={form.payerId}
            onChange={(e) => setForm({ ...form, payerId: e.target.value })}
            className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
          >
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-avenue-dark/40"
        >
          <option value="">Uncategorized</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-avenue-muted mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border border-avenue-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/40 resize-none"
          placeholder="Account, autopay, reminder details..."
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-surface">Cancel</button>
        <button
          disabled={invalid}
          onClick={() => onSave({ ...form, amount: parseFloat(form.amount), dueDay: Number(form.dueDay) || 1 })}
          className="flex-1 bg-avenue-dark text-white py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 disabled:opacity-40"
        >
          {initial ? 'Save bill' : 'Create bill'}
        </button>
      </div>
    </div>
  )
}

function BillRow({ bill, category, payer, fmt, onEdit, onPaid, onSkip, onDelete }) {
  const due = getBillStatus(bill.nextDueDate)
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-avenue-surface transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: category?.color ? `${category.color}18` : '#f3f4f6' }}>
        {category?.icon || <ReceiptText size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-avenue-dark text-sm truncate">{bill.name}</p>
          <span className={`text-xs border px-2 py-0.5 rounded-full ${statusClasses(due.state)}`}>{due.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-avenue-muted/70">
          <span>{bill.frequency}</span>
          <span>Due {fmtDate(bill.nextDueDate)}</span>
          {payer && <span>Paid by {payer.name}</span>}
          {category && <span>{category.name}</span>}
        </div>
        {bill.notes && <p className="text-xs text-avenue-muted/70 mt-1 truncate">{bill.notes}</p>}
      </div>
      <p className="font-bold text-avenue-dark tabular-nums w-24 text-right">{fmt(bill.amount)}</p>
      <div className="flex items-center gap-1">
        <button title="Mark paid" onClick={() => onPaid(bill.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-avenue-muted/70 hover:text-emerald-600 transition-colors"><Check size={14} /></button>
        <button title="Skip cycle" onClick={() => onSkip(bill.id)} className="p-1.5 rounded-lg hover:bg-sky-50 text-avenue-muted/70 hover:text-sky-600 transition-colors"><SkipForward size={14} /></button>
        <button title="Edit" onClick={() => onEdit(bill)} className="p-1.5 rounded-lg hover:bg-avenue-light text-avenue-muted/70 hover:text-avenue-dark transition-colors"><Pencil size={14} /></button>
        <button title="Delete" onClick={() => onDelete(bill)} className="p-1.5 rounded-lg hover:bg-red-50 text-avenue-muted/70 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
      </div>
    </div>
  )
}

export default function Bills() {
  const { fmt } = useCurrency()
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const groups = useStore((s) => s.groups)
  const categories = useStore((s) => s.getGroupCategories(activeGroupId))
  const bills = useStore((s) => s.getGroupBills(activeGroupId))
  const addBill = useStore((s) => s.addBill)
  const saveBill = useStore((s) => s.saveBill)
  const markBillPaid = useStore((s) => s.markBillPaid)
  const skipBill = useStore((s) => s.skipBill)
  const deleteBill = useStore((s) => s.deleteBill)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const group = groups.find((g) => g.id === activeGroupId)
  const members = (group?.members || []).map((id) => users[id]).filter(Boolean)
  const sortedBills = useMemo(() => sortBillsByDueDate(bills), [bills])
  const overdue = sortedBills.filter((b) => getBillStatus(b.nextDueDate).state === 'overdue')
  const dueToday = sortedBills.filter((b) => getBillStatus(b.nextDueDate).state === 'due_today')
  const upcoming = sortedBills.filter((b) => !['overdue', 'due_today'].includes(getBillStatus(b.nextDueDate).state))
  const monthlyCommitment = getMonthlyCommitment(bills)

  const saveNewBill = async (form) => {
    await addBill({ ...form, groupId: activeGroupId, payerId: form.payerId || currentUserId })
    setShowAdd(false)
  }

  const saveEdit = async (form) => {
    await saveBill(editing.id, form)
    setEditing(null)
  }

  const renderSection = (title, items) => (
    <div className="bg-white rounded-2xl border border-avenue-border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-avenue-border bg-avenue-surface flex items-center justify-between">
        <p className="text-sm font-semibold text-avenue-dark">{title}</p>
        <span className="text-xs text-avenue-muted">{items.length} bill{items.length === 1 ? '' : 's'}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-avenue-muted">No bills in this lane.</div>
      ) : (
        items.map((bill) => (
          <BillRow
            key={bill.id}
            bill={bill}
            category={categories.find((c) => c.id === bill.categoryId)}
            payer={users[bill.payerId]}
            fmt={fmt}
            onEdit={setEditing}
            onPaid={markBillPaid}
            onSkip={skipBill}
            onDelete={setDeleting}
          />
        ))
      )}
    </div>
  )

  return (
    <div className="p-6 animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-avenue-muted uppercase tracking-widest mb-1">Household Bills</p>
          <h1 className="text-3xl font-bold text-avenue-dark">Recurring commitments</h1>
          <p className="text-sm text-avenue-muted mt-1">Track what is due, who pays it, and what needs attention.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-avenue-dark text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-avenue-dark/90 transition-colors">
          <Plus size={16} /> New bill
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
          <p className="text-xs text-avenue-muted/70 mb-1">Monthly fixed bills</p>
          <p className="text-2xl font-bold text-avenue-dark">{fmt(monthlyCommitment)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
          <p className="text-xs text-avenue-muted/70 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-500">{overdue.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
          <p className="text-xs text-avenue-muted/70 mb-1">Due today</p>
          <p className="text-2xl font-bold text-amber-600">{dueToday.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-avenue-border shadow-sm">
          <p className="text-xs text-avenue-muted/70 mb-1">Active bills</p>
          <p className="text-2xl font-bold text-avenue-dark">{bills.length}</p>
        </div>
      </div>

      {bills.length === 0 ? (
        <div className="bg-white rounded-2xl border border-avenue-border shadow-sm p-12 text-center">
          <CalendarClock size={42} className="text-avenue-muted/30 mx-auto mb-3" />
          <p className="font-semibold text-avenue-dark">No recurring bills yet</p>
          <p className="text-sm text-avenue-muted mt-1">Add rent, utilities, subscriptions, or shared household commitments.</p>
          <button onClick={() => setShowAdd(true)} className="mt-5 bg-avenue-dark text-white px-4 py-2 rounded-xl text-sm font-medium">Create first bill</button>
        </div>
      ) : (
        <div className="space-y-5">
          {renderSection('Needs attention', [...overdue, ...dueToday])}
          {renderSection('Upcoming', upcoming)}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Recurring Bill">
        <BillForm categories={categories} members={members} currentUserId={currentUserId} onSave={saveNewBill} onCancel={() => setShowAdd(false)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Recurring Bill">
        {editing && <BillForm initial={editing} categories={categories} members={members} currentUserId={currentUserId} onSave={saveEdit} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Bill" size="sm">
        {deleting && (
          <div>
            <p className="text-sm text-avenue-muted mb-5">Delete <span className="font-semibold">{deleting.name}</span>? This removes it from household bill tracking.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-xl text-sm font-medium hover:bg-avenue-surface">Cancel</button>
              <button onClick={() => { deleteBill(deleting.id); setDeleting(null) }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
