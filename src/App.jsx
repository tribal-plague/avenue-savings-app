import { useEffect } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import useStore from './store/useStore'
import TopNav from './components/Layout/TopNav'
import MobileNav from './components/Layout/MobileNav'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Categories from './pages/Categories'
import Budget from './pages/Budget'
import Groups from './pages/Groups'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'
import Bills from './pages/Bills'

const PAGES = {
  dashboard:  Dashboard,
  bills:      Bills,
  expenses:   Expenses,
  categories: Categories,
  budget:     Budget,
  groups:     Groups,
  analytics:  Analytics,
  admin:      Admin,
}

export default function App() {
  const appView      = useStore((s) => s.appView)
  const currentPage  = useStore((s) => s.currentPage)
  const isLoading    = useStore((s) => s.isLoading)
  const loadUserData = useStore((s) => s.loadUserData)

  useEffect(() => {
    useStore.getState().initDarkMode()

    if (!isSupabaseConfigured) {
      useStore.setState({ isLoading: false, appView: 'config' })
      return
    }

    // Check for existing Supabase session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id)
      } else {
        useStore.setState({ isLoading: false, appView: 'landing' })
      }
    })

    // Handle sign-out from other tabs
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useStore.setState({
          currentUserId: null, users: {}, groups: [], categories: [],
          expenses: [], invites: [], recurringBills: [], activityLog: [], activeGroupId: null,
          currentPage: 'dashboard', isAuthenticated: false,
          appView: 'landing', isLoading: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (appView === 'config') {
    return (
      <div className="min-h-screen bg-avenue-bg flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white border border-avenue-border rounded-2xl p-6 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-avenue-dark text-white flex items-center justify-center font-bold mb-4">A</div>
          <h1 className="text-2xl font-bold text-avenue-dark mb-2">Configure Avenue</h1>
          <p className="text-sm text-avenue-muted leading-relaxed mb-5">
            Avenue needs Supabase credentials before it can load household data. Create a local `.env`
            from `.env.example`, then restart the dev server.
          </p>
          <div className="bg-avenue-surface border border-avenue-border rounded-xl p-4 font-mono text-xs text-avenue-dark space-y-1">
            <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--av-bg))' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-avenue-dark border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-avenue-muted">Loading Avenue…</p>
        </div>
      </div>
    )
  }

  if (appView === 'landing') return <Landing />
  if (appView === 'auth')    return <Auth />

  const PageComponent = PAGES[currentPage] || Dashboard
  return (
    <div className="min-h-screen bg-avenue-bg">
      <TopNav />
      <main className="pb-20 md:pb-12">
        <PageComponent />
      </main>
      <MobileNav />
    </div>
  )
}
