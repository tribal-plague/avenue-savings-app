import { useState } from 'react'
import { LayoutDashboard, Receipt, Tag, BarChart2, Plus, Settings } from 'lucide-react'
import useStore from '../../store/useStore'
import Modal from '../ui/Modal'
import { useCurrency } from '../../hooks/useCurrency'

const TABS = [
  { id: 'dashboard',  label: 'Home',     icon: LayoutDashboard },
  { id: 'expenses',   label: 'Expenses', icon: Receipt },
  { id: 'categories', label: 'Budget',   icon: Tag },
  { id: 'analytics',  label: 'Analytics',icon: BarChart2 },
  { id: 'budget',     label: 'Profile',  icon: Settings },
]

export default function MobileNav() {
  const currentPage   = useStore((s) => s.currentPage)
  const setPage       = useStore((s) => s.setPage)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const currentUserId = useStore((s) => s.currentUserId)
  const addExpense    = useStore((s) => s.addExpense)
  const categories    = useStore((s) => s.getGroupCategories(activeGroupId))
  const { symbol }    = useCurrency()

  const [showAdd,  setShowAdd]  = useState(false)
  const [addForm,  setAddForm]  = useState({ title: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' })
  const [addError, setAddError] = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!addForm.title || !addForm.amount) { setAddError('Title and amount are required.'); return }
    addExpense({ ...addForm, amount: parseFloat(addForm.amount), groupId: activeGroupId, paidBy: currentUserId, splitBetween: [currentUserId] })
    setShowAdd(false)
    setAddForm({ title: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' })
    setAddError('')
  }

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-avenue-surface border-t border-avenue-border">
        <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {TABS.slice(0, 2).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentPage === id ? 'text-avenue-dark' : 'text-avenue-muted'}`}>
              <Icon size={20} strokeWidth={currentPage === id ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}

          {/* Center add button */}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-avenue-dark text-white dark:bg-white dark:text-black shadow-card -mt-4 transition-all active:scale-95">
            <Plus size={22} />
          </button>

          {TABS.slice(2, 4).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentPage === id ? 'text-avenue-dark' : 'text-avenue-muted'}`}>
              <Icon size={20} strokeWidth={currentPage === id ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}

          {/* Profile / last tab */}
          {TABS.slice(4).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${currentPage === id ? 'text-avenue-dark' : 'text-avenue-muted'}`}>
              <Icon size={20} strokeWidth={currentPage === id ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddError('') }} title="Add Expense" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-avenue-dark mb-1.5">Description *</label>
            <input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              className="w-full bg-avenue-bg border border-avenue-border rounded-lg px-3 py-2.5 text-sm text-avenue-dark focus:outline-none focus:ring-2 focus:ring-avenue-dark/20"
              placeholder="e.g. Grocery run" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-avenue-dark mb-1.5">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-avenue-muted text-sm">{symbol}</span>
                <input type="number" min="0" step="0.01" value={addForm.amount}
                  onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                  className="w-full bg-avenue-bg border border-avenue-border rounded-lg pl-7 pr-3 py-2.5 text-sm text-avenue-dark focus:outline-none focus:ring-2 focus:ring-avenue-dark/20"
                  placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-avenue-dark mb-1.5">Date</label>
              <input type="date" value={addForm.date} onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                className="w-full bg-avenue-bg border border-avenue-border rounded-lg px-3 py-2.5 text-sm text-avenue-dark focus:outline-none focus:ring-2 focus:ring-avenue-dark/20" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-avenue-dark mb-1.5">Category</label>
            <select value={addForm.categoryId} onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
              className="w-full bg-avenue-bg border border-avenue-border rounded-lg px-3 py-2.5 text-sm text-avenue-dark focus:outline-none focus:ring-2 focus:ring-avenue-dark/20">
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {addError && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-lg text-sm font-medium hover:bg-avenue-light">Cancel</button>
            <button type="submit"
              className="flex-1 bg-avenue-dark text-white dark:bg-white dark:text-black py-2.5 rounded-lg text-sm font-medium">Add</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
