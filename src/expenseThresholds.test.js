import test from 'node:test'
import assert from 'node:assert/strict'

import {
  formatDuration,
  getSocialSecurityTaxSavings,
  getTriggeredExpenses,
} from './expenseThresholds.js'

test('formatDuration chooses a readable unit', () => {
  assert.equal(formatDuration(10), '10 seconds')
  assert.equal(formatDuration(90), '2 minutes')
  assert.equal(formatDuration(3600), '1 hour')
  assert.equal(formatDuration(86400), '1 day')
  assert.equal(formatDuration(1209600), '2 weeks')
  assert.equal(formatDuration(2592000), '1 month')
})

test('getTriggeredExpenses returns thresholds crossed by a running total', () => {
  const expenses = [
    { category: 'Low cost', value_usd: 100 },
    { category: 'Medium cost', value_usd: 500 },
    { category: 'High cost', value_usd: 1500 },
  ]

  const triggered = getTriggeredExpenses(1000, expenses, 0, 50)
  assert.deepEqual(triggered.map((item) => item.category), ['Low cost', 'Medium cost'])
  assert.equal(triggered[1].elapsedSeconds, 10)
})

test('getSocialSecurityTaxSavings measures avoided payroll tax above the wage cap', () => {
  assert.equal(getSocialSecurityTaxSavings(200000, 176100), 2963.6)
  assert.equal(getSocialSecurityTaxSavings(100000, 176100), 0)
  assert.equal(getSocialSecurityTaxSavings(158359009867, 176100), 19636495387.108)
})
