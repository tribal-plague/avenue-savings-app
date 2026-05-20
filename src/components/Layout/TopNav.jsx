import { useState } from 'react'
import { Plus, ChevronDown, LogOut, Settings, Users, PiggyBank, ShieldCheck, Moon, Sun } from 'lucide-react'
import useStore from '../../store/useStore'
import { initials } from '../../utils/formatters'
import Modal from '../ui/Modal'
import { useCurrency } from '../../hooks/useCurrency'
import Logo from '../Logo'

const MAIN_TABS = [
  { id: 'dashboard',  label: 'Overview' },
  { id: 'expenses',   label: 'Expenses' },
  { id: 'categories', label: 'Categories' },
  { id: 'analytics',  label: 'Analytics' },
]

const MANAGE_TABS = [
  { id: 'budget',  label: 'Budget & Goals', icon: PiggyBank },
  { id: 'groups',  label: 'Groups',          icon: Users },
  { id: 'admin',   label: 'Admin Panel',     icon: ShieldCheck },
]

export default function TopNav() {
  const currentPage    = useStore((s) => s.currentPage)
  const setPage        = useStore((s) => s.setPage)
  const currentUserId  = useStore((s) => s.currentUserId)
  const users          = useStore((s) => s.users)
  const groups         = useStore((s) => s.groups)
  const activeGroupId  = useStore((s) => s.activeGroupId)
  const setActiveGroup = useStore((s) => s.setActiveGroup)
  const logout         = useStore((s) => s.logout)
  const isGroupAdmin   = useStore((s) => s.isGroupAdmin)
  const darkMode       = useStore((s) => s.darkMode)
  const toggleDark     = useStore((s) => s.toggleDarkMode)
  const addExpense     = useStore((s) => s.addExpense)
  const categories     = useStore((s) => s.getGroupCategories(activeGroupId))
  const { symbol }     = useCurrency()

  const user        = users[currentUserId]
  const activeGroup = groups.find((g) => g.id === activeGroupId)
  const isAdmin     = isGroupAdmin(activeGroupId)

  const [groupOpen,  setGroupOpen]  = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const [showAdd,    setShowAdd]    = useState(false)
  const [addForm,    setAddForm]    = useState({ title: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' })
  const [addError,   setAddError]   = useState('')

  const handleAdd = (e) => {
    e.preventDefault()
    if (!addForm.title || !addForm.amount) { setAddError('Title and amount are required.'); return }
    addExpense({ ...addForm, amount: parseFloat(addForm.amount), groupId: activeGroupId, paidBy: currentUserId, splitBetween: [currentUserId] })
    setShowAdd(false)
    setAddForm({ title: '', amount: '', categoryId: '', date: new Date().toISOString().slice(0, 10), notes: '' })
    setAddError('')
  }

  const isManagePage = ['budget', 'groups', 'admin'].includes(currentPage)

  return (
    <>
      <header className="sticky top-0 z-40 bg-avenue-bg/95 backdrop-blur-md border-b border-avenue-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Logo size={20} className="text-avenue-dark" />
            <span className="font-bold text-avenue-dark text-base tracking-tight">avenue</span>
          </div>

          {/* Group picker */}
          <div className="relative">
            <button
              onClick={() => { setGroupOpen(!groupOpen); setManageOpen(false); setUserOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-avenue-surface border border-avenue-border hover:bg-avenue-light transition-colors text-sm font-medium text-avenue-dark"
            >
              <span className="w-4 h-4 rounded bg-avenue-dark text-white text-xs flex items-center justify-center font-bold">
                {activeGroup?.name?.[0] || 'G'}
              </span>
              {activeGroup?.name}
              <ChevronDown size={13} className={`text-avenue-muted transition-transform ${groupOpen ? 'rotate-180' : ''}`} />
            </button>
            {groupOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-avenue-surface border border-avenue-border rounded-xl shadow-card overflow-hidden z-50 animate-fade-in">
                {groups.map((g) => (
                  <button key={g.id} onClick={() => { setActiveGroup(g.id); setGroupOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-avenue-surface transition-colors text-left ${g.id === activeGroupId ? 'font-semibold text-avenue-dark' : 'text-avenue-muted'}`}>
                    <span className="w-5 h-5 rounded bg-avenue-light text-avenue-dark text-xs flex items-center justify-center font-bold">{g.name[0]}</span>
                    {g.name}
                    {g.id === activeGroupId && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-avenue-dark/50" />}
                  </button>
                ))}
                <div className="border-t border-avenue-border">
                  <button onClick={() => { setPage('groups'); setGroupOpen(false) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-avenue-dark font-medium hover:bg-avenue-surface transition-colors">
                    <Plus size={13} /> New group
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main tabs */}
          <nav className="flex items-center gap-1 flex-1">
            {MAIN_TABS.map(({ id, label }) => (
              <button key={id} onClick={() => { setPage(id); setManageOpen(false) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === id ? 'bg-avenue-dark text-white dark:bg-white dark:text-black' : 'text-avenue-muted hover:text-avenue-dark hover:bg-avenue-light'}`}>
                {label}
              </button>
            ))}

            {/* Manage dropdown */}
            <div className="relative">
              <button
                onClick={() => { setManageOpen(!manageOpen); setGroupOpen(false); setUserOpen(false) }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isManagePage ? 'bg-avenue-dark text-white dark:bg-white dark:text-black' : 'text-avenue-muted hover:text-avenue-dark hover:bg-avenue-light'}`}>
                Manage <ChevronDown size={13} className={`transition-transform ${manageOpen ? 'rotate-180' : ''}`} />
              </button>
              {manageOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-avenue-border rounded-xl shadow-card overflow-hidden z-50 animate-fade-in">
                  {MANAGE_TABS.filter((t) => t.id !== 'admin' || isAdmin).map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => { setPage(id); setManageOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-avenue-surface transition-colors text-left ${currentPage === id ? 'font-semibold text-avenue-dark' : 'text-avenue-muted'}`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right: Dark toggle + Add + User */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-avenue-muted hover:text-avenue-dark hover:bg-avenue-light transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-avenue-dark text-white dark:bg-white dark:text-black text-sm font-medium px-4 py-2 rounded-lg transition-all">
              <Plus size={15} /> Add expense
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => { setUserOpen(!userOpen); setGroupOpen(false); setManageOpen(false) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:ring-2 hover:ring-avenue-dark/30 transition-all"
                style={{ backgroundColor: user?.avatarColor || '#0D2E3F' }}
              >
                {initials(user?.name)}
              </button>
              {userOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-avenue-surface border border-avenue-border rounded-xl shadow-card overflow-hidden z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-avenue-border">
                    <p className="text-sm font-semibold text-avenue-dark">{user?.name}</p>
                    <p className="text-xs text-avenue-muted truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { setPage('budget'); setUserOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-avenue-muted hover:bg-avenue-surface hover:text-avenue-dark transition-colors">
                    <Settings size={14} /> Profile & Budget
                  </button>
                  <div className="border-t border-avenue-border">
                    <button onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick Add Expense Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAddError('') }} title="Add Expense" size="sm">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-avenue-dark mb-1.5">Description *</label>
            <input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
              className="w-full bg-avenue-surface border border-avenue-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/30"
              placeholder="e.g. Grocery run" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-avenue-dark mb-1.5">Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-avenue-muted text-sm">{symbol}</span>
                <input type="number" min="0" step="0.01" value={addForm.amount}
                  onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                  className="w-full bg-avenue-surface border border-avenue-border rounded-lg pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/30"
                  placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-avenue-dark mb-1.5">Date</label>
              <input type="date" value={addForm.date} onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
                className="w-full bg-avenue-surface border border-avenue-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-avenue-dark mb-1.5">Category</label>
            <select value={addForm.categoryId} onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
              className="w-full bg-avenue-surface border border-avenue-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-avenue-dark/20 focus:border-avenue-dark/30">
              <option value="">Uncategorized</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {addError && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addError}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowAdd(false)}
              className="flex-1 border border-avenue-border text-avenue-muted py-2.5 rounded-lg text-sm font-medium hover:bg-avenue-surface">Cancel</button>
            <button type="submit"
              className="flex-1 bg-avenue-dark text-white py-2.5 rounded-lg text-sm font-medium hover:bg-avenue-dark/90">Add expense</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
