import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const genCode = () => 'AVE-' + Math.random().toString(36).slice(2, 6).toUpperCase()

// ─── DB → JS mappers ─────────────────────────────────────────────────────────
const mapProfile = (p) => ({
  id: p.id,
  name: p.name || '',
  email: p.email || '',
  salary: p.salary || 0,
  savingsGoal: p.savings_goal || 20,
  avatarColor: p.avatar_color || '#7c3aed',
  currencySymbol: p.currency_symbol || '$',
})

const mapGroup = (g, allMembers) => ({
  id: g.id,
  name: g.name,
  type: g.type,
  inviteCode: g.invite_code,
  createdBy: g.created_by,
  createdAt: g.created_at,
  members: (allMembers || []).filter(m => m.group_id === g.id).map(m => m.user_id),
  admins: (allMembers || []).filter(m => m.group_id === g.id && m.is_admin).map(m => m.user_id),
})

const mapCategory = (c) => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  color: c.color,
  budget: c.budget || 0,
  groupId: c.group_id,
  createdBy: c.created_by,
})

const mapExpense = (e) => ({
  id: e.id,
  title: e.title,
  amount: e.amount,
  date: e.date,
  notes: e.notes || '',
  categoryId: e.category_id || null,
  groupId: e.group_id,
  paidBy: e.paid_by,
  splitBetween: e.split_between || [],
})

const mapInvite = (i) => ({
  id: i.id,
  email: i.email,
  status: i.status,
  groupId: i.group_id,
  sentBy: i.sent_by,
  createdAt: i.created_at,
})

const DEFAULT_CATEGORIES = [
  { name: 'Housing',       icon: '🏠', color: '#6366f1', budget: 1500 },
  { name: 'Food & Dining', icon: '🍔', color: '#f97316', budget: 600  },
  { name: 'Transport',     icon: '🚗', color: '#0ea5e9', budget: 300  },
  { name: 'Entertainment', icon: '🎬', color: '#a855f7', budget: 200  },
  { name: 'Healthcare',    icon: '💊', color: '#10b981', budget: 150  },
  { name: 'Shopping',      icon: '🛍️', color: '#ec4899', budget: 250  },
  { name: 'Bills & Utils', icon: '💡', color: '#f59e0b', budget: 200  },
  { name: 'Personal Care', icon: '✨', color: '#14b8a6', budget: 100  },
]

// ─── Store ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  // ── State ──
  currentUserId: null,
  users: {},
  groups: [],
  categories: [],
  expenses: [],
  invites: [],
  activeGroupId: null,
  currentPage: 'dashboard',
  isAuthenticated: false,
  appView: 'landing',
  isLoading: true,

  // ── Navigation ──
  setPage: (page) => set({ currentPage: page }),
  setActiveGroup: (id) => set({ activeGroupId: id }),
  setAppView: (view) => set({ appView: view }),

  // ── Computed selectors (sync, operate on local state) ──
  getGroupCategories: (groupId) => get().categories.filter((c) => c.groupId === groupId),
  isGroupAdmin: (groupId) => {
    const { currentUserId, groups } = get()
    const g = groups.find((g) => g.id === groupId)
    return g?.admins?.includes(currentUserId) ?? false
  },
  getCurrentUser: () => {
    const { users, currentUserId } = get()
    return users[currentUserId]
  },
  getActiveGroup: () => {
    const { groups, activeGroupId } = get()
    return groups.find((g) => g.id === activeGroupId)
  },
  getGroupExpenses: (groupId) => get().expenses.filter((e) => e.groupId === groupId),

  // ── Data loading ──────────────────────────────────────────────────────────
  loadUserData: async (userId) => {
    set({ isLoading: true })
    try {
      // Profile
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', userId).single()

      // Group memberships for this user
      const { data: myMemberships } = await supabase
        .from('group_members').select('group_id').eq('user_id', userId)
      const groupIds = (myMemberships || []).map(r => r.group_id)

      if (groupIds.length === 0) {
        // First login after email confirmation — run account setup now
        const name = profile?.name || 'User'
        await get()._setupNewUser(userId, name)
        await get().loadUserData(userId)
        return
      }

      // All data in parallel
      const [
        { data: groups },
        { data: allMembers },
        { data: categories },
        { data: expenses },
        { data: invites },
      ] = await Promise.all([
        supabase.from('groups').select('*').in('id', groupIds),
        supabase.from('group_members').select('*').in('group_id', groupIds),
        supabase.from('categories').select('*').in('group_id', groupIds),
        supabase.from('expenses').select('*').in('group_id', groupIds).order('date', { ascending: false }),
        supabase.from('invites').select('*').in('group_id', groupIds),
      ])

      // Fetch all member profiles
      const allUserIds = [...new Set((allMembers || []).map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles').select('*').in('id', allUserIds)

      // Build users map
      const users = {}
      ;(profiles || []).forEach(p => { users[p.id] = mapProfile(p) })
      // Ensure current user email is available (from auth)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (users[userId] && authUser) users[userId].email = authUser.email || ''

      set({
        currentUserId: userId,
        users,
        groups: (groups || []).map(g => mapGroup(g, allMembers || [])),
        categories: (categories || []).map(mapCategory),
        expenses: (expenses || []).map(mapExpense),
        invites: (invites || []).map(mapInvite),
        activeGroupId: groupIds[0],
        isLoading: false,
        isAuthenticated: true,
        appView: 'app',
      })
    } catch (err) {
      console.error('loadUserData error:', err)
      set({ isLoading: false, appView: 'landing' })
    }
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    if (!email || !password) return { success: false, message: 'Please fill in all fields.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, message: error.message }
    await get().loadUserData(data.user.id)
    return { success: true }
  },

  signup: async (name, email, password) => {
    if (!name || !email || !password) return { success: false, message: 'Please fill in all fields.' }
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name } },
    })
    if (error) return { success: false, message: error.message }
    if (!data.user) return { success: false, message: 'Signup failed. Please try again.' }

    // Email confirmation is ON — session is null until they confirm
    if (!data.session) {
      return { success: true, needsConfirmation: true }
    }

    // Email confirmation is OFF — set up account immediately
    await get()._setupNewUser(data.user.id, name)
    await get().loadUserData(data.user.id)
    return { success: true }
  },

  // Internal: creates default group + categories for a new user
  _setupNewUser: async (userId, name) => {
    await supabase.from('profiles').upsert({
      id: userId, name, salary: 0, savings_goal: 20,
      avatar_color: '#7c3aed', currency_symbol: '$',
    }, { onConflict: 'id' })

    const { data: group } = await supabase
      .from('groups')
      .insert({ name: `${name.split(' ')[0]}'s Finances`, type: 'individual', invite_code: genCode(), created_by: userId })
      .select().single()

    if (!group) return

    await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, is_admin: true })
    await supabase.from('categories').insert(
      DEFAULT_CATEGORIES.map(c => ({ ...c, group_id: group.id, created_by: userId }))
    )
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({
      currentUserId: null, users: {}, groups: [], categories: [],
      expenses: [], invites: [], activeGroupId: null,
      currentPage: 'dashboard', isAuthenticated: false, appView: 'landing', isLoading: false,
    })
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  updateProfile: async (updates) => {
    const { currentUserId } = get()
    const dbUpdates = {}
    if (updates.name !== undefined)           dbUpdates.name = updates.name
    if (updates.salary !== undefined)         dbUpdates.salary = updates.salary
    if (updates.savingsGoal !== undefined)    dbUpdates.savings_goal = updates.savingsGoal
    if (updates.avatarColor !== undefined)    dbUpdates.avatar_color = updates.avatarColor
    if (updates.currencySymbol !== undefined) dbUpdates.currency_symbol = updates.currencySymbol
    await supabase.from('profiles').update(dbUpdates).eq('id', currentUserId)
    set((s) => ({ users: { ...s.users, [currentUserId]: { ...s.users[currentUserId], ...updates } } }))
  },

  // ── Groups ────────────────────────────────────────────────────────────────
  createGroup: async (name, type) => {
    const { currentUserId } = get()
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, type, invite_code: genCode(), created_by: currentUserId })
      .select().single()
    if (error || !group) return null
    await supabase.from('group_members').insert({ group_id: group.id, user_id: currentUserId, is_admin: true })
    const newGroup = mapGroup(group, [{ group_id: group.id, user_id: currentUserId, is_admin: true }])
    set((s) => ({ groups: [...s.groups, newGroup], activeGroupId: group.id }))
    return newGroup
  },

  updateGroup: async (groupId, updates) => {
    const dbUpdates = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.type) dbUpdates.type = updates.type
    await supabase.from('groups').update(dbUpdates).eq('id', groupId)
    set((s) => ({ groups: s.groups.map((g) => g.id === groupId ? { ...g, ...updates } : g) }))
  },

  deleteGroup: async (groupId) => {
    await supabase.from('groups').delete().eq('id', groupId)
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
      expenses: s.expenses.filter((e) => e.groupId !== groupId),
      categories: s.categories.filter((c) => c.groupId !== groupId),
      activeGroupId: s.activeGroupId === groupId
        ? (s.groups.find((g) => g.id !== groupId)?.id || null)
        : s.activeGroupId,
    }))
  },

  regenerateInviteCode: async (groupId) => {
    const newCode = genCode()
    await supabase.from('groups').update({ invite_code: newCode }).eq('id', groupId)
    set((s) => ({ groups: s.groups.map((g) => g.id === groupId ? { ...g, inviteCode: newCode } : g) }))
  },

  joinGroupByCode: async (code) => {
    const { currentUserId, groups } = get()
    const { data: group } = await supabase
      .from('groups').select('*').eq('invite_code', code.trim().toUpperCase()).single()
    if (!group) return { success: false, message: 'Invalid invite code.' }
    if (groups.find(g => g.id === group.id)?.members.includes(currentUserId)) {
      return { success: false, message: 'You are already in this group.' }
    }
    const { error } = await supabase.from('group_members')
      .insert({ group_id: group.id, user_id: currentUserId, is_admin: false })
    if (error) return { success: false, message: 'Failed to join group.' }
    await get().loadUserData(currentUserId)
    return { success: true }
  },

  // ── Members ───────────────────────────────────────────────────────────────
  removeMember: async (groupId, userId) => {
    await supabase.from('group_members').delete().match({ group_id: groupId, user_id: userId })
    set((s) => ({
      groups: s.groups.map((g) => g.id !== groupId ? g : {
        ...g,
        members: g.members.filter((m) => m !== userId),
        admins: g.admins.filter((a) => a !== userId),
      }),
    }))
  },

  toggleAdmin: async (groupId, userId) => {
    const { groups } = get()
    const group = groups.find(g => g.id === groupId)
    const isAdmin = group?.admins.includes(userId) || false
    await supabase.from('group_members')
      .update({ is_admin: !isAdmin }).match({ group_id: groupId, user_id: userId })
    set((s) => ({
      groups: s.groups.map((g) => g.id !== groupId ? g : {
        ...g,
        admins: isAdmin ? g.admins.filter(a => a !== userId) : [...g.admins, userId],
      }),
    }))
  },

  // ── Categories ────────────────────────────────────────────────────────────
  addCategory: async (data) => {
    const { currentUserId } = get()
    const { data: cat, error } = await supabase
      .from('categories')
      .insert({ group_id: data.groupId, created_by: currentUserId, name: data.name, icon: data.icon, color: data.color, budget: data.budget || 0 })
      .select().single()
    if (error || !cat) return
    set((s) => ({ categories: [...s.categories, mapCategory(cat)] }))
  },

  updateCategory: async (categoryId, updates) => {
    const dbUpdates = {}
    if (updates.name !== undefined)   dbUpdates.name = updates.name
    if (updates.icon !== undefined)   dbUpdates.icon = updates.icon
    if (updates.color !== undefined)  dbUpdates.color = updates.color
    if (updates.budget !== undefined) dbUpdates.budget = updates.budget
    await supabase.from('categories').update(dbUpdates).eq('id', categoryId)
    set((s) => ({ categories: s.categories.map((c) => c.id === categoryId ? { ...c, ...updates } : c) }))
  },

  deleteCategory: async (categoryId) => {
    await supabase.from('categories').delete().eq('id', categoryId)
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== categoryId),
      expenses: s.expenses.map((e) => e.categoryId === categoryId ? { ...e, categoryId: null } : e),
    }))
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  addExpense: async (data) => {
    const { currentUserId } = get()
    const { data: exp, error } = await supabase
      .from('expenses')
      .insert({
        group_id: data.groupId,
        category_id: data.categoryId || null,
        paid_by: data.paidBy || currentUserId,
        title: data.title,
        amount: data.amount,
        date: data.date,
        notes: data.notes || '',
        split_between: data.splitBetween || [data.paidBy || currentUserId],
      })
      .select().single()
    if (error || !exp) return
    set((s) => ({ expenses: [mapExpense(exp), ...s.expenses] }))
  },

  updateExpense: async (expenseId, updates) => {
    const dbUpdates = {}
    if (updates.title !== undefined)        dbUpdates.title = updates.title
    if (updates.amount !== undefined)       dbUpdates.amount = updates.amount
    if (updates.date !== undefined)         dbUpdates.date = updates.date
    if (updates.notes !== undefined)        dbUpdates.notes = updates.notes
    if (updates.categoryId !== undefined)   dbUpdates.category_id = updates.categoryId
    if (updates.paidBy !== undefined)       dbUpdates.paid_by = updates.paidBy
    if (updates.splitBetween !== undefined) dbUpdates.split_between = updates.splitBetween
    await supabase.from('expenses').update(dbUpdates).eq('id', expenseId)
    set((s) => ({ expenses: s.expenses.map((e) => e.id === expenseId ? { ...e, ...updates } : e) }))
  },

  deleteExpense: async (expenseId) => {
    await supabase.from('expenses').delete().eq('id', expenseId)
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== expenseId) }))
  },

  // ── Invites ───────────────────────────────────────────────────────────────
  createInvite: async (groupId, email) => {
    const { currentUserId } = get()
    const { data: invite, error } = await supabase
      .from('invites')
      .insert({ group_id: groupId, email, sent_by: currentUserId, status: 'pending' })
      .select().single()
    if (error || !invite) return
    set((s) => ({ invites: [...s.invites, mapInvite(invite)] }))
    return mapInvite(invite)
  },

  revokeInvite: async (inviteId) => {
    await supabase.from('invites').delete().eq('id', inviteId)
    set((s) => ({ invites: s.invites.filter((i) => i.id !== inviteId) }))
  },
}))

export default useStore
