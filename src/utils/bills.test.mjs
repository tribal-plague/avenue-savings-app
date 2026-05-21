import assert from 'node:assert/strict'
import { advanceDueDate, getBillStatus, getMonthlyCommitment } from './bills.js'

assert.equal(advanceDueDate('2026-01-31', 'monthly', 31), '2026-02-28')
assert.equal(advanceDueDate('2026-02-28', 'monthly', 31), '2026-03-31')
assert.equal(advanceDueDate('2026-05-20', 'weekly'), '2026-05-27')
assert.equal(advanceDueDate('2024-02-29', 'yearly', 29), '2025-02-28')

assert.deepEqual(getBillStatus('2026-05-19', '2026-05-20').state, 'overdue')
assert.deepEqual(getBillStatus('2026-05-20', '2026-05-20').state, 'due_today')
assert.deepEqual(getBillStatus('2026-05-24', '2026-05-20').state, 'upcoming')
assert.deepEqual(getBillStatus('2026-06-10', '2026-05-20').state, 'scheduled')

const monthly = getMonthlyCommitment([
  { amount: 1200, frequency: 'monthly' },
  { amount: 100, frequency: 'weekly' },
  { amount: 1200, frequency: 'yearly' },
])
assert.equal(Math.round(monthly), 1733)

console.log('bills helper tests passed')
