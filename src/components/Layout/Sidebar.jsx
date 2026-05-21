import {
  LayoutDashboard, Receipt, Tag, PiggyBank, Users, BarChart3, CalendarClock,
  ShieldCheck, ChevronDown, Plus, LogOut
} from 'lucide-react'
import useStore from '../../store/useStore'
import { initials } from '../../utils/formatters'
import { useState } from 'react'

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'bills',      label: 'Bills',       icon: CalendarClock },
  { id: 'expenses',   label: 'Expenses',    icon: Receipt },
  { id: 'categories', label: 'Categories',  icon: Tag },
  { id: 'budget',     label: 'Budget',      icon: PiggyBank },
  { id: 'groups',     label: 'Groups',      icon: Users },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart3 },
]

export default function Sidebar() {
  const currentPage = useStore((s) => s.currentPage)
  const setPage = useStore((s) => s.setPage)
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const setActiveGroup = useStore((s) => s.setActiveGroup)
  const isGroupAdmin = useStore((s) => s.isGroupAdmin)

  const user = users[currentUserId]
  const activeGroup = groups.find((g) => g.id === activeGroupId)
  const isAdmin = isGroupAdmin(activeGroupId)
  const [groupOpen, setGroupOpen] = useState(false)

  return (
    <aside className="w-60 min-h-screen bg-avenue-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-avenue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Avenue</span>
        </div>
      </div>

      {/* Group switcher */}
      <div className="px-3 py-3 border-b border-white/10">
        <button
          onClick={() => setGroupOpen(!groupOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-avenue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {activeGroup?.name?.[0] || 'G'}
              </span>
            </div>
            <span className="text-white/90 text-sm font-medium truncate">
              {activeGroup?.name || 'Select group'}
            </span>
          </div>
          <ChevronDown size={14} className={`text-white/50 flex-shrink-0 transition-transform ${groupOpen ? 'rotate-180' : ''}`} />
        </button>

        {groupOpen && (
          <div className="mt-1 bg-white/10 rounded-xl overflow-hidden">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setActiveGroup(g.id); setGroupOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors text-left ${g.id === activeGroupId ? 'text-white font-medium' : 'text-white/60'}`}
              >
                <span className="w-4 h-4 rounded bg-avenue-500/50 flex items-center justify-center text-xs text-white">
                  {g.name[0]}
                </span>
                <span className="truncate">{g.name}</span>
              </button>
            ))}
            <button
              onClick={() => { setPage('groups'); setGroupOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-avenue-300 hover:bg-white/10 transition-colors border-t border-white/10"
            >
              <Plus size={14} />
              <span>New group</span>
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = currentPage === id
          return (
            <button
              key={id}
              onClick={() => setPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-avenue-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}

        {isAdmin && (
          <button
            onClick={() => setPage('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'admin'
                ? 'bg-avenue-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck size={18} />
            Admin
          </button>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => setPage('budget')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: user?.avatarColor || '#7c3aed' }}
          >
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name}</div>
            <div className="text-white/40 text-xs truncate">{user?.email}</div>
          </div>
        </button>
      </div>
    </aside>
  )
}
