import { today } from './formatters.js'

const DAY_MS = 24 * 60 * 60 * 1000

export const BILL_FREQUENCIES = ['weekly', 'monthly', 'yearly']

export function parseLocalDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`)
}

export function toDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function clampDay(year, month, day) {
  return Math.min(Math.max(Number(day) || 1, 1), new Date(year, month + 1, 0).getDate())
}

export function getBillStatus(nextDueDate, referenceDate = today()) {
  const due = parseLocalDate(nextDueDate)
  const ref = parseLocalDate(referenceDate)
  const diffDays = Math.round((due - ref) / DAY_MS)

  if (diffDays < 0) return { state: 'overdue', diffDays, label: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} overdue` }
  if (diffDays === 0) return { state: 'due_today', diffDays, label: 'Due today' }
  if (diffDays <= 7) return { state: 'upcoming', diffDays, label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}` }
  return { state: 'scheduled', diffDays, label: `Due ${nextDueDate}` }
}

export function advanceDueDate(currentDueDate, frequency = 'monthly', dueDay) {
  const current = parseLocalDate(currentDueDate)

  if (frequency === 'weekly') {
    current.setDate(current.getDate() + 7)
    return toDateString(current)
  }

  if (frequency === 'yearly') {
    const nextYear = current.getFullYear() + 1
    const month = current.getMonth()
    const day = clampDay(nextYear, month, dueDay || current.getDate())
    return toDateString(new Date(nextYear, month, day))
  }

  const nextMonth = current.getMonth() + 1
  const nextYear = current.getFullYear() + Math.floor(nextMonth / 12)
  const normalizedMonth = nextMonth % 12
  const day = clampDay(nextYear, normalizedMonth, dueDay || current.getDate())
  return toDateString(new Date(nextYear, normalizedMonth, day))
}

export function getMonthlyCommitment(bills = []) {
  return bills.reduce((total, bill) => {
    const amount = Number(bill.amount) || 0
    if (bill.frequency === 'weekly') return total + amount * 4.33
    if (bill.frequency === 'yearly') return total + amount / 12
    return total + amount
  }, 0)
}

export function sortBillsByDueDate(bills = []) {
  return [...bills].sort((a, b) => String(a.nextDueDate).localeCompare(String(b.nextDueDate)))
}

export function summarizeBills(bills = [], referenceDate = today()) {
  const withStatus = sortBillsByDueDate(bills).map((bill) => ({
    ...bill,
    dueStatus: getBillStatus(bill.nextDueDate, referenceDate),
  }))

  return {
    bills: withStatus,
    overdue: withStatus.filter((bill) => bill.dueStatus.state === 'overdue'),
    dueToday: withStatus.filter((bill) => bill.dueStatus.state === 'due_today'),
    upcoming: withStatus.filter((bill) => ['upcoming', 'scheduled'].includes(bill.dueStatus.state)),
    monthlyCommitment: getMonthlyCommitment(bills),
  }
}
