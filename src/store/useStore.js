import { create } from 'zustand'
import { avenueApi } from '../lib/avenueApi.js'
import { advanceDueDate } from '../utils/bills.js'

const emptySession = {
  currentUserId: null,
  users: {},
  groups: [],
  categories: [],
  expenses: [],
  invites: [],
  recurringBills: [],
  activityLog: [],
  activeGroupId: null,
  currentPage: 'dashboard',
  isAuthenticated: false,
  appView: 'landing',
  isLoading: false,
}

const defaultCategories = [
  { name: 'Housing', icon: 'Home', color: '#2563eb', budget: 1200 },
  { name: 'Food', icon: 'Utensils', color: '#16a34a', budget: 600 },
  { name: 'Transport', icon: 'Car', color: '#f97316', budget: 300 },
  { name: 'Savings', icon: 'PiggyBank', color: '#7c3aed', budget: 500 },
]

function makeId(prefix) {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

function normalizeUser(user) {
  const email = String(user?.email || user?.id || '').toLowerCase()
  return {
    id: email,
    email,
    name: user?.name || user?.display_name || user?.email || 'Avenue User',
    role: user?.role || 'avenue_user',
    salary: user?.salary || 0,
    savingsGoal: user?.savingsGoal || 20,
    currencySymbol: user?.currencySymbol || '$',
    avatarUrl: user?.avatarUrl || '',
    avatarEmoji: user?.avatarEmoji || 'A',
  }
}

function storageKey(userId) {
  return `avenue:finance:${userId}`
}

function canUseStorage() {
  return typeof localStorage !== 'undefined'
}

function createDefaultFinanceState(user) {
  const groupId = makeId('group')
  return {
    currentUserId: user.id,
    users: { [user.id]: user },
    groups: [{
      id: groupId,
      name: `${user.name.split(' ')[0] || 'My'} Finances`,
      type: 'individual',
      inviteCode: `AVE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      members: [user.id],
      admins: [user.id],
      createdAt: new Date().toISOString(),
    }],
    categories: defaultCategories.map((category) => ({ ...category, id: makeId('category'), groupId })),
    expenses: [],
    invites: [],
    recurringBills: [],
    activityLog: [],
    activeGroupId: groupId,
  }
}

function loadFinanceState(user) {
  if (!canUseStorage()) return createDefaultFinanceState(user)
  const key = storageKey(user.id)
  const stored = localStorage.getItem(key)
  if (!stored) {
    const initial = createDefaultFinanceState(user)
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }
  try {
    const parsed = JSON.parse(stored)
    return {
      ...createDefaultFinanceState(user),
      ...parsed,
      currentUserId: user.id,
      users: { ...(parsed.users || {}), [user.id]: { ...(parsed.users?.[user.id] || {}), ...user } },
    }
  } catch {
    const initial = createDefaultFinanceState(user)
    localStorage.setItem(key, JSON.stringify(initial))
    return initial
  }
}

function persistFinanceState(state) {
  if (!canUseStorage() || !state.currentUserId) return
  const snapshot = {
    currentUserId: state.currentUserId,
    users: state.users,
    groups: state.groups,
    categories: state.categories,
    expenses: state.expenses,
    invites: state.invites,
    recurringBills: state.recurringBills,
    activityLog: state.activityLog,
    activeGroupId: state.activeGroupId,
  }
  localStorage.setItem(storageKey(state.currentUserId), JSON.stringify(snapshot))
}

function commit(set, get, updater) {
  const current = get()
  const next = typeof updater === 'function' ? updater(current) : updater
  const merged = { ...current, ...next }
  set(next)
  persistFinanceState(merged)
  return merged
}

function applyAuthedState(set, user) {
  const financeState = loadFinanceState(normalizeUser(user))
  set({
    ...financeState,
    isLoading: false,
    isAuthenticated: true,
    appView: 'app',
  })
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const useStore = create((set, get) => ({
  ...emptySession,
  isLoading: true,
  darkMode: false,

  setPage: (page) => set({ currentPage: page }),
  setActiveGroup: (id) => set({ activeGroupId: id }),
  setAppView: (view) => set({ appView: view }),

  toggleDarkMode: () => {
    const next = !get().darkMode
    set({ darkMode: next })
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', next)
    if (canUseStorage()) localStorage.setItem('av-dark', next ? '1' : '0')
  },
  initDarkMode: () => {
    const saved = canUseStorage() && localStorage.getItem('av-dark') === '1'
    set({ darkMode: saved })
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', saved)
  },

  getGroupCategories: (groupId) => get().categories.filter((c) => c.groupId === groupId),
  getGroupExpenses: (groupId) => get().expenses.filter((e) => e.groupId === groupId),
  getGroupBills: (groupId) => get().recurringBills.filter((b) => b.groupId === groupId),
  getGroupActivity: (groupId) => get().activityLog.filter((a) => a.groupId === groupId),
  getCurrentUser: () => get().users[get().currentUserId],
  getActiveGroup: () => get().groups.find((g) => g.id === get().activeGroupId),
  isGroupAdmin: (groupId) => {
    const group = get().groups.find((g) => g.id === groupId)
    return group?.admins?.includes(get().currentUserId) ?? false
  },

  checkSession: async () => {
    set({ isLoading: true })
    try {
      const result = await avenueApi.session()
      if (!result.authenticated || !result.user) {
        set(emptySession)
        return
      }
      applyAuthedState(set, result.user)
    } catch (error) {
      console.error('[avenue] session check failed:', error?.message || error)
      set({ ...emptySession, appView: 'config' })
    }
  },

  loadUserData: async () => {
    await get().checkSession()
  },

  login: async (email, password) => {
    if (!email || !password) return { success: false, message: 'Please fill in all fields.' }
    try {
      const result = await avenueApi.login(email, password)
      applyAuthedState(set, result.user)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || 'Incorrect email or password. Please try again.' }
    }
  },

  signup: async (name, email, password) => {
    if (!name || !email || !password) return { success: false, message: 'Please fill in all fields.' }
    try {
      const result = await avenueApi.signup(name, email, password)
      applyAuthedState(set, result.user)
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message || 'Signup failed. Please try again.' }
    }
  },

  logout: async () => {
    await avenueApi.logout().catch(() => null)
    set(emptySession)
  },

  updateProfile: async (updates) => {
    const currentUserId = get().currentUserId
    commit(set, get, (state) => ({
      users: {
        ...state.users,
        [currentUserId]: { ...state.users[currentUserId], ...updates },
      },
    }))
    return get().users[currentUserId]
  },

  uploadAvatar: async (file) => {
    const avatarUrl = await fileToDataUrl(file)
    await get().updateProfile({ avatarUrl, avatarEmoji: '' })
    return avatarUrl
  },

  createGroup: async (name, type) => {
    const userId = get().currentUserId
    const group = {
      id: makeId('group'),
      name,
      type,
      inviteCode: `AVE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      members: [userId],
      admins: [userId],
      createdAt: new Date().toISOString(),
    }
    commit(set, get, (state) => ({ groups: [...state.groups, group], activeGroupId: group.id }))
    return group
  },
  updateGroup: async (groupId, updates) => commit(set, get, (state) => ({
    groups: state.groups.map((group) => group.id === groupId ? { ...group, ...updates } : group),
  })),
  deleteGroup: async (groupId) => commit(set, get, (state) => ({
    groups: state.groups.filter((group) => group.id !== groupId),
    categories: state.categories.filter((category) => category.groupId !== groupId),
    expenses: state.expenses.filter((expense) => expense.groupId !== groupId),
    recurringBills: state.recurringBills.filter((bill) => bill.groupId !== groupId),
    activeGroupId: state.activeGroupId === groupId ? state.groups.find((group) => group.id !== groupId)?.id || null : state.activeGroupId,
  })),
  regenerateInviteCode: async (groupId) => commit(set, get, (state) => ({
    groups: state.groups.map((group) => group.id === groupId ? { ...group, inviteCode: `AVE-${Math.random().toString(36).slice(2, 8).toUpperCase()}` } : group),
  })),
  joinGroupByCode: async (code) => {
    const match = get().groups.find((group) => group.inviteCode?.toLowerCase() === String(code).toLowerCase())
    if (!match) return { success: false, message: 'Invite code not found.' }
    commit(set, get, (state) => ({
      groups: state.groups.map((group) => group.id === match.id ? { ...group, members: [...new Set([...group.members, state.currentUserId])] } : group),
      activeGroupId: match.id,
    }))
    return { success: true }
  },

  removeMember: async (groupId, userId) => commit(set, get, (state) => ({
    groups: state.groups.map((group) => group.id === groupId ? {
      ...group,
      members: group.members.filter((id) => id !== userId),
      admins: group.admins.filter((id) => id !== userId),
    } : group),
  })),
  toggleAdmin: async (groupId, userId) => commit(set, get, (state) => ({
    groups: state.groups.map((group) => {
      if (group.id !== groupId) return group
      const isAdmin = group.admins.includes(userId)
      return { ...group, admins: isAdmin ? group.admins.filter((id) => id !== userId) : [...group.admins, userId] }
    }),
  })),

  addCategory: async (data) => {
    const category = { id: makeId('category'), ...data }
    commit(set, get, (state) => ({ categories: [...state.categories, category] }))
    return category
  },
  updateCategory: async (categoryId, updates) => commit(set, get, (state) => ({
    categories: state.categories.map((category) => category.id === categoryId ? { ...category, ...updates } : category),
  })),
  deleteCategory: async (categoryId) => commit(set, get, (state) => ({
    categories: state.categories.filter((category) => category.id !== categoryId),
    expenses: state.expenses.map((expense) => expense.categoryId === categoryId ? { ...expense, categoryId: null } : expense),
  })),

  addExpense: async (data) => {
    const expense = { id: makeId('expense'), date: new Date().toISOString().slice(0, 10), paidBy: get().currentUserId, ...data }
    commit(set, get, (state) => ({ expenses: [expense, ...state.expenses] }))
    return expense
  },
  updateExpense: async (expenseId, updates) => commit(set, get, (state) => ({
    expenses: state.expenses.map((expense) => expense.id === expenseId ? { ...expense, ...updates } : expense),
  })),
  deleteExpense: async (expenseId) => commit(set, get, (state) => ({
    expenses: state.expenses.filter((expense) => expense.id !== expenseId),
  })),

  logActivity: async (payload) => {
    const activity = { id: makeId('activity'), ...payload, actorId: get().currentUserId, createdAt: new Date().toISOString() }
    commit(set, get, (state) => ({ activityLog: [activity, ...state.activityLog].slice(0, 200) }))
    return activity
  },

  addBill: async (data) => {
    const bill = { id: makeId('bill'), status: 'active', ...data }
    commit(set, get, (state) => ({ recurringBills: [...state.recurringBills, bill] }))
    await get().logActivity({
      groupId: bill.groupId,
      action: 'bill_created',
      entityType: 'recurring_bill',
      entityId: bill.id,
      summary: `Created recurring bill "${bill.name}".`,
      metadata: { amount: bill.amount, nextDueDate: bill.nextDueDate },
    }).catch(() => {})
    return bill
  },

  updateBill: async (billId, updates) => {
    commit(set, get, (state) => ({
      recurringBills: state.recurringBills.map((bill) => bill.id === billId ? { ...bill, ...updates } : bill),
    }))
    return get().recurringBills.find((bill) => bill.id === billId) || null
  },

  saveBill: async (billId, updates) => {
    const bill = await get().updateBill(billId, updates)
    if (bill) {
      await get().logActivity({
        groupId: bill.groupId,
        action: 'bill_updated',
        entityType: 'recurring_bill',
        entityId: bill.id,
        summary: `Updated recurring bill "${bill.name}".`,
      }).catch(() => {})
    }
    return bill
  },

  markBillPaid: async (billId) => {
    const bill = get().recurringBills.find((item) => item.id === billId)
    if (!bill) return null
    const nextDueDate = advanceDueDate(bill.nextDueDate, bill.frequency, bill.dueDay)
    const mapped = await get().updateBill(billId, { status: 'paid', nextDueDate })
    if (mapped) {
      await get().logActivity({
        groupId: mapped.groupId,
        action: 'bill_paid',
        entityType: 'recurring_bill',
        entityId: mapped.id,
        summary: `Marked "${mapped.name}" paid. Next due ${mapped.nextDueDate}.`,
        metadata: { nextDueDate: mapped.nextDueDate },
      }).catch(() => {})
    }
    return mapped
  },

  skipBill: async (billId) => {
    const bill = get().recurringBills.find((item) => item.id === billId)
    if (!bill) return null
    const nextDueDate = advanceDueDate(bill.nextDueDate, bill.frequency, bill.dueDay)
    const mapped = await get().updateBill(billId, { status: 'skipped', nextDueDate })
    if (mapped) {
      await get().logActivity({
        groupId: mapped.groupId,
        action: 'bill_skipped',
        entityType: 'recurring_bill',
        entityId: mapped.id,
        summary: `Skipped "${mapped.name}" for this cycle. Next due ${mapped.nextDueDate}.`,
        metadata: { nextDueDate: mapped.nextDueDate },
      }).catch(() => {})
    }
    return mapped
  },

  deleteBill: async (billId) => {
    const bill = get().recurringBills.find((item) => item.id === billId)
    commit(set, get, (state) => ({ recurringBills: state.recurringBills.filter((item) => item.id !== billId) }))
    if (bill) {
      await get().logActivity({
        groupId: bill.groupId,
        action: 'bill_deleted',
        entityType: 'recurring_bill',
        entityId: bill.id,
        summary: `Deleted recurring bill "${bill.name}".`,
      }).catch(() => {})
    }
  },

  createInvite: async (groupId, email) => {
    const invite = { id: makeId('invite'), groupId, email, status: 'pending', createdAt: new Date().toISOString() }
    commit(set, get, (state) => ({ invites: [invite, ...state.invites] }))
    return invite
  },
  revokeInvite: async (inviteId) => commit(set, get, (state) => ({
    invites: state.invites.filter((invite) => invite.id !== inviteId),
  })),
}))

export default useStore
