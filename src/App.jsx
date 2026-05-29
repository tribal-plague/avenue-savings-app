'use client'

import { Suspense, lazy, useEffect } from 'react'
import useStore from './store/useStore'
import TopNav from './components/Layout/TopNav'
import MobileNav from './components/Layout/MobileNav'
const Landing = lazy(() => import('./views/Landing'))
const Auth = lazy(() => import('./views/Auth'))
const Dashboard = lazy(() => import('./views/Dashboard'))
const Expenses = lazy(() => import('./views/Expenses'))
const Categories = lazy(() => import('./views/Categories'))
const Budget = lazy(() => import('./views/Budget'))
const Groups = lazy(() => import('./views/Groups'))
const Analytics = lazy(() => import('./views/Analytics'))
const Admin = lazy(() => import('./views/Admin'))
const Bills = lazy(() => import('./views/Bills'))

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

function LoadingScreen({ label = 'Loading Avenue...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--av-bg))' }}>
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-avenue-dark border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-avenue-muted">{label}</p>
      </div>
    </div>
  )
}

export default function App() {
  const appView      = useStore((s) => s.appView)
  const currentPage  = useStore((s) => s.currentPage)
  const isLoading    = useStore((s) => s.isLoading)
  const checkSession = useStore((s) => s.checkSession)

  useEffect(() => {
    useStore.getState().initDarkMode()
    checkSession()
  }, [])

  if (appView === 'config') {
    return (
      <div className="min-h-screen bg-avenue-bg flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-white border border-avenue-border rounded-2xl p-6 shadow-card">
          <div className="w-10 h-10 rounded-xl bg-avenue-dark text-white flex items-center justify-center font-bold mb-4">A</div>
          <h1 className="text-2xl font-bold text-avenue-dark mb-2">Configure Avenue</h1>
          <p className="text-sm text-avenue-muted leading-relaxed mb-5">
            Avenue needs the Cosmos-backed auth environment before users can sign in.
            Configure the Memory Router user database variables, then restart the server.
          </p>
          <div className="bg-avenue-surface border border-avenue-border rounded-xl p-4 font-mono text-xs text-avenue-dark space-y-1">
            <p>MR_COSMOS_ENDPOINT=https://cosmodb-free-tier.documents.azure.com:443/</p>
            <p>MR_COSMOS_DATABASE=memory-router</p>
            <p>MR_COSMOS_USERS_CONTAINER=memory_router_users</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (appView === 'landing') {
    return <Suspense fallback={<LoadingScreen />}><Landing /></Suspense>
  }
  if (appView === 'auth') {
    return <Suspense fallback={<LoadingScreen />}><Auth /></Suspense>
  }

  const PageComponent = PAGES[currentPage] || Dashboard
  return (
    <div className="min-h-screen bg-avenue-bg">
      <TopNav />
      <main className="pb-20 md:pb-12">
        <Suspense fallback={<LoadingScreen label="Loading page..." />}>
          <PageComponent />
        </Suspense>
      </main>
      <MobileNav />
    </div>
  )
}
