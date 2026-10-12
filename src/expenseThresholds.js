const TIME_UNITS = [
  { unit: 'year', seconds: 31557600 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
]

export const formatDuration = (seconds) => {
  const totalSeconds = Number.isFinite(seconds) ? Math.abs(seconds) : 0

  if (totalSeconds === 0) {
    return '0 seconds'
  }

  const matchedUnit = TIME_UNITS.find((unit) => totalSeconds >= unit.seconds) ?? TIME_UNITS[TIME_UNITS.length - 1]
  const amount = totalSeconds / matchedUnit.seconds

  if (amount < 1) {
    const rounded = Number(amount.toFixed(2))
    return `${rounded} ${matchedUnit.unit}${rounded === 1 ? '' : 's'}`
  }

  const rounded = Math.round(amount)
  return `${rounded} ${matchedUnit.unit}${rounded === 1 ? '' : 's'}`
}

export const SOCIAL_SECURITY_TAX_RATE = 0.124

export const getSocialSecurityTaxSavings = (totalEarned, wageCap) => {
  const cap = Number(wageCap) || 0
  const earningsAboveCap = Math.max(0, Number(totalEarned) - cap)
  return earningsAboveCap * SOCIAL_SECURITY_TAX_RATE
}

export const getTriggeredExpenses = (currentTotal, expenses, previousTotal = 0, payPerSecond = 1) => {
  if (!Array.isArray(expenses)) {
    return []
  }

  return expenses
    .filter(
      (expense) =>
        Number(expense?.value_usd) > previousTotal &&
        Number(expense?.value_usd) <= currentTotal,
    )
    .map((expense) => ({
      category: expense.category,
      source: expense.source,
      valueUsd: Number(expense.value_usd),
      elapsedSeconds: Number(expense.value_usd) / payPerSecond,
      elapsedLabel: formatDuration(Number(expense.value_usd) / payPerSecond),
    }))
}
