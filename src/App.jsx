import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import useStore from './store/useStore'
import TopNav from './components/Layout/TopNav'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Categories from './pages/Categories'
import Budget from './pages/Budget'
import Groups from './pages/Groups'
import Analytics from './pages/Analytics'
import Admin from './pages/Admin'

const PAGES = {
  dashboard:  Dashboard,
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
          expenses: [], invites: [], activeGroupId: null,
          currentPage: 'dashboard', isAuthenticated: false,
          appView: 'landing', isLoading: false,
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
      <main className="pb-12">
        <PageComponent />
      </main>
    </div>
  )
}
