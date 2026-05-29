import assert from 'node:assert/strict'

process.env.NODE_ENV = 'test'

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
}

const { setAvenueApiForTests } = await import('../lib/avenueApi.js')
const { default: useStore } = await import('./useStore.js')

const baseState = {
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
  darkMode: false,
}

function resetStore(extra = {}) {
  storage.clear()
  useStore.setState({ ...baseState, ...extra })
}

function createApiMock() {
  let user = { id: 'alex@example.com', email: 'alex@example.com', name: 'Alex', role: 'avenue_user' }
  const calls = []
  return {
    calls,
    session: async () => ({ authenticated: true, user }),
    login: async (email, password) => {
      calls.push(['login', email, password])
      if (password === 'wrong') throw new Error('Incorrect email or password. Please try again.')
      user = { id: email, email, name: 'Alex', role: 'avenue_user' }
      return { success: true, user }
    },
    signup: async (name, email) => {
      calls.push(['signup', name, email])
      user = { id: email, email, name, role: 'avenue_user' }
      return { success: true, user }
    },
    logout: async () => ({ success: true }),
  }
}

resetStore()
let api = createApiMock()
setAvenueApiForTests(api)
let result = await useStore.getState().login('alex@example.com', 'wrong')
assert.equal(result.success, false)
assert.equal(result.message, 'Incorrect email or password. Please try again.')
assert.equal(useStore.getState().isAuthenticated, false)

resetStore()
api = createApiMock()
setAvenueApiForTests(api)
result = await useStore.getState().signup('Alex', 'alex@example.com', 'secret12345')
assert.equal(result.success, true)
assert.equal(useStore.getState().isAuthenticated, true)
assert.equal(useStore.getState().currentUserId, 'alex@example.com')
assert.equal(useStore.getState().groups.length, 1)
assert.equal(useStore.getState().groups[0].members.includes('alex@example.com'), true)

const firstGroupId = useStore.getState().activeGroupId
const created = await useStore.getState().createGroup('Household', 'shared')
await useStore.getState().setActiveGroup(firstGroupId)
result = await useStore.getState().joinGroupByCode(created.inviteCode)
assert.equal(result.success, true)
assert.equal(useStore.getState().activeGroupId, created.id)

await useStore.getState().toggleAdmin(created.id, 'user-2')
assert.equal(useStore.getState().groups.find((group) => group.id === created.id).admins.includes('user-2'), true)
await useStore.getState().removeMember(created.id, 'user-2')
assert.equal(useStore.getState().groups.find((group) => group.id === created.id).members.includes('user-2'), false)

const bill = await useStore.getState().addBill({
  groupId: created.id,
  name: 'Internet',
  amount: 80,
  frequency: 'monthly',
  dueDay: 15,
  nextDueDate: '2026-05-15',
})
assert.equal(bill.name, 'Internet')

const edgeBill = await useStore.getState().addBill({
  groupId: created.id,
  name: 'Rent',
  amount: 1200,
  frequency: 'monthly',
  dueDay: 31,
  nextDueDate: '2026-01-31',
})
const paid = await useStore.getState().markBillPaid(edgeBill.id)
assert.equal(paid.status, 'paid')
assert.equal(paid.nextDueDate, '2026-02-28')

await useStore.getState().deleteBill(edgeBill.id)
assert.equal(useStore.getState().recurringBills.some((item) => item.id === edgeBill.id), false)

const persisted = JSON.parse(localStorage.getItem('avenue:finance:alex@example.com'))
assert.equal(persisted.groups.some((group) => group.id === created.id), true)
assert.equal(persisted.recurringBills.some((item) => item.id === bill.id), true)

console.log('store auth, local finance, group, and bill flow tests passed')
