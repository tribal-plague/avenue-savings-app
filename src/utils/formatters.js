export const fmt = (amount, symbol = '$') => {
  const n = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.abs(amount))
  return `${symbol}${n}`
}

export const fmtDec = (amount, symbol = '$') => {
  const n = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount))
  return `${symbol}${n}`
}

export const fmtDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const fmtShortDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const pct = (value, total) => (total === 0 ? 0 : Math.round((value / total) * 100))

export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()

export const today = () => new Date().toISOString().slice(0, 10)
