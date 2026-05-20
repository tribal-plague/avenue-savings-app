import { fmt, pct, daysInMonth } from './formatters'

export function getMonthExpenses(expenses, year, month) {
  return expenses.filter((e) => {
    const d = new Date(e.date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export function sumExpenses(expenses) {
  return expenses.reduce((acc, e) => acc + e.amount, 0)
}

export function getCategoryTotals(expenses, categories) {
  const totals = {}
  expenses.forEach((e) => {
    if (!totals[e.categoryId]) totals[e.categoryId] = 0
    totals[e.categoryId] += e.amount
  })
  return categories.map((cat) => ({
    ...cat,
    spent: totals[cat.id] || 0,
    remaining: Math.max(0, cat.budget - (totals[cat.id] || 0)),
    over: Math.max(0, (totals[cat.id] || 0) - cat.budget),
    utilization: pct(totals[cat.id] || 0, cat.budget),
  }))
}

export function generateInsights(expenses, categories, user, fmtFn) {
  if (!fmtFn) {
    const sym = user?.currencySymbol || '$'
    fmtFn = (n) => fmt(n, sym)
  }
  const _fmt = fmtFn
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const dayOfMonth = now.getDate()
  const totalDays = daysInMonth(year, month)
  const daysLeft = totalDays - dayOfMonth

  const thisMonthExp = getMonthExpenses(expenses, year, month)
  const lastMonthExp = getMonthExpenses(expenses, year, month - 1)
  const thisTotal = sumExpenses(thisMonthExp)
  const lastTotal = sumExpenses(lastMonthExp)

  const salary = user?.salary || 0
  const savingsPct = user?.savingsGoal || 20
  const savingsTarget = salary * (savingsPct / 100)
  const budget = salary - savingsTarget
  const remaining = budget - thisTotal
  const projectedSpend = dayOfMonth > 0 ? (thisTotal / dayOfMonth) * totalDays : 0
  const projectedSavings = salary - projectedSpend

  const catTotals = getCategoryTotals(thisMonthExp, categories)
  const topCategory = [...catTotals].sort((a, b) => b.spent - a.spent)[0]
  const overBudgetCats = catTotals.filter((c) => c.over > 0)
  const monthChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0

  const insights = []
  const suggestions = []

  // Budget utilization
  if (budget > 0) {
    const used = pct(thisTotal, budget)
    const daysPct = pct(dayOfMonth, totalDays)
    if (used > daysPct + 15) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Spending ahead of pace',
        body: `You've used ${used}% of your budget but only ${daysPct}% of the month has passed.`,
      })
    } else if (used < daysPct - 10) {
      insights.push({
        type: 'success',
        icon: '✅',
        title: 'Great spending pace',
        body: `Only ${used}% of budget used with ${daysPct}% of the month gone — you're ahead!`,
      })
    } else {
      insights.push({
        type: 'info',
        icon: '📊',
        title: 'On track this month',
        body: `${used}% of budget used so far. ${_fmt(remaining)} remaining for the rest of the month.`,
      })
    }
  }

  // Savings projection
  if (salary > 0) {
    if (projectedSavings >= savingsTarget) {
      insights.push({
        type: 'success',
        icon: '🎯',
        title: 'Savings goal on track',
        body: `Projected savings: ${_fmt(projectedSavings)} — above your ${_fmt(savingsTarget)} goal. Keep it up!`,
      })
    } else {
      const shortfall = savingsTarget - projectedSavings
      insights.push({
        type: 'warning',
        icon: '💸',
        title: 'Savings goal at risk',
        body: `At current pace, you'll save ${_fmt(Math.max(0, projectedSavings))} — ${_fmt(shortfall)} short of your goal.`,
      })
    }
  }

  // Month-over-month
  if (lastTotal > 0) {
    if (monthChange > 10) {
      insights.push({
        type: 'warning',
        icon: '📈',
        title: `Spending up ${monthChange}% vs last month`,
        body: `This month: ${_fmt(thisTotal)} vs last month: ${_fmt(lastTotal)}. Watch your pace.`,
      })
    } else if (monthChange < -10) {
      insights.push({
        type: 'success',
        icon: '📉',
        title: `Spending down ${Math.abs(monthChange)}% vs last month`,
        body: `Great job! Down from ${_fmt(lastTotal)} to ${_fmt(thisTotal)} this month.`,
      })
    }
  }

  // Over-budget categories
  overBudgetCats.slice(0, 2).forEach((cat) => {
    insights.push({
      type: 'warning',
      icon: cat.icon,
      title: `${cat.name} over budget`,
      body: `${_fmt(cat.over)} over your ${_fmt(cat.budget)} budget this month.`,
    })
  })

  // ─── Suggestions ──────────────────────────────────────────────────────────
  if (remaining < 0 && salary > 0) {
    suggestions.push({
      icon: '🔴',
      title: 'Pause non-essential spending',
      body: `You're ${_fmt(Math.abs(remaining))} over budget. Skip discretionary purchases for the rest of the month.`,
    })
  }

  if (topCategory && topCategory.spent > 0) {
    const pctOfTotal = pct(topCategory.spent, thisTotal)
    if (pctOfTotal > 40 && topCategory.id !== 'cat_housing') {
      suggestions.push({
        icon: topCategory.icon,
        title: `Review ${topCategory.name} spending`,
        body: `It accounts for ${pctOfTotal}% of your total spend this month (${_fmt(topCategory.spent)}).`,
      })
    }
  }

  if (overBudgetCats.length > 0) {
    const biggest = overBudgetCats.sort((a, b) => b.over - a.over)[0]
    suggestions.push({
      icon: '✂️',
      title: `Cut ${biggest.name} by ${_fmt(biggest.over)}`,
      body: `Bringing ${biggest.name} back to budget would recover ${_fmt(biggest.over)} toward your savings goal.`,
    })
  }

  if (daysLeft <= 7 && remaining > 0) {
    suggestions.push({
      icon: '🏦',
      title: `Transfer ${_fmt(remaining)} to savings`,
      body: `${daysLeft} days left and you have ${_fmt(remaining)} unspent — move it to savings now!`,
    })
  }

  if (suggestions.length === 0 && projectedSavings >= savingsTarget) {
    suggestions.push({
      icon: '🌟',
      title: 'You\'re doing great!',
      body: 'Your spending habits are well-balanced. Consider boosting your savings goal next month.',
    })
  }

  return { insights, suggestions, thisTotal, lastTotal, projectedSpend, projectedSavings, remaining, budget, catTotals }
}

export function getMonthlyTrend(expenses, months = 6) {
  const now = new Date()
  const result = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    const total = sumExpenses(getMonthExpenses(expenses, year, month))
    result.push({ label, total, year, month })
  }
  return result
}
