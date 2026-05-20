import { Bell, Search } from 'lucide-react'
import useStore from '../../store/useStore'
import { initials, monthLabel } from '../../utils/formatters'

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  expenses:   'Expenses',
  categories: 'Categories',
  budget:     'Budget & Goals',
  groups:     'Groups',
  analytics:  'Analytics',
  admin:      'Admin Panel',
}

export default function Header() {
  const currentPage = useStore((s) => s.currentPage)
  const currentUserId = useStore((s) => s.currentUserId)
  const users = useStore((s) => s.users)
  const groups = useStore((s) => s.groups)
  const activeGroupId = useStore((s) => s.activeGroupId)
  const setPage = useStore((s) => s.setPage)

  const user = users[currentUserId]
  const activeGroup = groups.find((g) => g.id === activeGroupId)
  const now = new Date()

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{PAGE_TITLES[currentPage] || 'Avenue'}</h1>
        <p className="text-xs text-gray-400">
          {activeGroup?.name} · {monthLabel(now.getFullYear(), now.getMonth())}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search expenses…"
            className="pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-xl w-52 focus:outline-none focus:ring-2 focus:ring-avenue-400 focus:border-transparent"
          />
        </div>

        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-avenue-500 rounded-full" />
        </button>

        <button
          onClick={() => setPage('budget')}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: user?.avatarColor || '#7c3aed' }}
        >
          {initials(user?.name)}
        </button>
      </div>
    </header>
  )
}
