import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  formatDuration,
  getSocialSecurityTaxSavings,
  getTriggeredExpenses,
} from './expenseThresholds.js'

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
const ELON_MUSK = 'Elon Musk'
const MEDIAN_WORKER_CATEGORY = 'Median US worker salary in 2025'
const MEDIAN_WORKER_SALARY_FALLBACK = 62608
const SOCIAL_SECURITY_WAGE_MAX_FALLBACK = 176100

const getMedianWorkerSalary = (expenseData) =>
  expenseData?.expenses.find((item) => item.category === MEDIAN_WORKER_CATEGORY)?.value_usd ??
  MEDIAN_WORKER_SALARY_FALLBACK

const formatCurrency = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value)

const formatExpenseCurrency = (value) =>
  formatCurrency(value, Number.isInteger(value) ? 0 : 2)

const formatSlowTickerCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
    minimumFractionDigits: 4,
  }).format(value)

const toNotifications = (items) =>
  items.map((item) => ({
    id: `${item.category}-${item.valueUsd}`,
    ...item,
  }))

const sourceHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Source'
  }
}

const formatMilestoneTitle = (category) => {
  const trimmed = String(category ?? '')
    .replace(/^The cost of\s+/i, '')
    .replace(/^The\s+/i, '')
  if (!trimmed) return category
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function ExpenseFeed({ eyebrow, emptyMessage, notifications }) {
  const ordered = [...notifications].sort((left, right) => right.valueUsd - left.valueUsd)

  return (
    <div className="expense-notifications" aria-live="polite">
      <div className="expense-header">
        <p className="eyebrow">{eyebrow}</p>
      </div>

      {ordered.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        <div className="expense-feed">
          {ordered.map((notification) => (
            <article className="expense-alert" key={notification.id}>
              <header className="alert-heading">
                <h3 className="alert-title">{formatMilestoneTitle(notification.category)}</h3>
                <p className="alert-value">{formatExpenseCurrency(notification.valueUsd)}</p>
              </header>

              <dl className="alert-times">
                <div>
                  <dt>Reached in</dt>
                  <dd>{notification.elapsedLabel}</dd>
                </div>
                {notification.workerElapsedLabel && (
                  <div>
                    <dt>Median worker</dt>
                    <dd>{notification.workerElapsedLabel}</dd>
                  </div>
                )}
              </dl>

              {notification.source && (
                <a
                  className="alert-source"
                  href={notification.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Source: ${sourceHost(notification.source)} (opens in new tab)`}
                >
                  {sourceHost(notification.source)}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function DashboardPage({
  expenseData,
  activeExecutive,
  totalEarned,
  notifications,
  payPerSecond,
  workerTotalEarned,
  workerNotifications,
}) {
  const socialSecurityThreshold =
    expenseData.expenses.find((item) => item.category === 'Social Security wage max')?.value_usd ??
    SOCIAL_SECURITY_WAGE_MAX_FALLBACK
  const socialSecurityTaxSavings = getSocialSecurityTaxSavings(totalEarned, socialSecurityThreshold)
  const socialSecurityElapsedLabel = formatDuration(socialSecurityThreshold / payPerSecond)
  const hasPassedSocialSecurityThreshold = totalEarned >= socialSecurityThreshold
  const workerAnnualPay = getMedianWorkerSalary(expenseData)
  const workerPayPerSecond = workerAnnualPay / SECONDS_PER_YEAR

  return (
    <div className="comparison">
      <section className="panel panel--executive">
        <div className="payments-header">
          <div>
            <h2>{activeExecutive.ceo}</h2>
            <dl className="pay-stats">
              <div>
                <dt>Total compensation:</dt>
                <dd>{formatCurrency(activeExecutive.ceo_pay_usd)}</dd>
              </div>
              <div>
                <dt>Earnings per second:</dt>
                <dd>{formatCurrency(payPerSecond, 2)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="payment-content">
          <div className="total-earned-block">
            <span className="stat-label">Total earned</span>
            <strong>{formatCurrency(totalEarned)}</strong>
          </div>

          {hasPassedSocialSecurityThreshold && (
            <div
              className="total-earned-block total-earned-block--secondary"
              aria-label="Social Security tax avoided"
            >
              <span className="stat-label">Social security tax avoided</span>
              <strong>{formatCurrency(socialSecurityTaxSavings)}</strong>
              <p className="stat-note">
                Social Security payroll tax only applies to wages up to the 2025 ceiling of{' '}
                {formatCurrency(socialSecurityThreshold)} a year. He passed that cap in{' '}
                {socialSecurityElapsedLabel}, and every dollar after that avoids the 12.4% tax.
              </p>
            </div>
          )}
        </div>

        <ExpenseFeed
          eyebrow={`${activeExecutive.ceo} has earned`}
          emptyMessage={`Accumulating wealth...`}
          notifications={notifications}
        />
      </section>

      <section className="panel panel--worker">
        <div className="payments-header">
          <div>
            <h2>Median US worker</h2>
            <dl className="pay-stats">
              <div>
                <dt>Total compensation:</dt>
                <dd>{formatCurrency(workerAnnualPay)}</dd>
              </div>
              <div>
                <dt>Earnings per second:</dt>
                <dd>{formatCurrency(workerPayPerSecond, 4)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="payment-content">
          <div className="total-earned-block">
            <span className="stat-label">Total earned</span>
            <strong>{formatSlowTickerCurrency(workerTotalEarned)}</strong>
          </div>

          {hasPassedSocialSecurityThreshold && (
            <div
              className="total-earned-block total-earned-block--secondary"
              aria-label="Social Security tax avoided"
            >
              <span className="stat-label">Social security tax avoided</span>
              <strong>{formatCurrency(0)}</strong>
              <p className="stat-note">
                The median worker never reaches the 2025 Social Security wage ceiling of{' '}
                {formatCurrency(socialSecurityThreshold)}. They pay into the system throughout their
                working life.
              </p>
            </div>
          )}
        </div>

        <ExpenseFeed
          eyebrow="The median US worker has earned"
          emptyMessage="Accumulating wealth..."
          notifications={workerNotifications}
        />
      </section>
    </div>
  )
}

function App() {
  const [ceoData, setCeoData] = useState(null)
  const [expenseData, setExpenseData] = useState(null)
  const [totalEarned, setTotalEarned] = useState(0)
  const [workerTotalEarned, setWorkerTotalEarned] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [workerNotifications, setWorkerNotifications] = useState([])
  const totalEarnedRef = useRef(0)
  const workerTotalEarnedRef = useRef(0)

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}highest_paid_ceos_top100.json`).then((response) =>
        response.json(),
      ),
      fetch(`${import.meta.env.BASE_URL}expenses_2025.json`).then((response) => response.json()),
    ])
      .then(([ceoPayload, expensePayload]) => {
        setCeoData(ceoPayload)
        setExpenseData(expensePayload)
      })
      .catch((error) => console.error('Failed to load pay data:', error))
  }, [])

  const activeExecutive =
    ceoData?.ceos.find((person) => person.ceo === ELON_MUSK) ?? ceoData?.ceos[0] ?? null
  const medianWorkerSalary = getMedianWorkerSalary(expenseData)

  useEffect(() => {
    if (!activeExecutive || !expenseData) return

    let frameId
    let lastTimestamp = performance.now()
    const payPerSecond = activeExecutive.ceo_pay_usd / SECONDS_PER_YEAR
    const workerPayPerSecond = medianWorkerSalary / SECONDS_PER_YEAR
    const workerExpenses = expenseData.expenses.filter(
      (item) => item.category !== MEDIAN_WORKER_CATEGORY,
    )

    const tick = (timestamp) => {
      const deltaSeconds = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp

      const previousTotal = totalEarnedRef.current
      const nextTotal = previousTotal + payPerSecond * deltaSeconds
      totalEarnedRef.current = nextTotal
      setTotalEarned(nextTotal)

      const previousWorkerTotal = workerTotalEarnedRef.current
      const nextWorkerTotal = previousWorkerTotal + workerPayPerSecond * deltaSeconds
      workerTotalEarnedRef.current = nextWorkerTotal
      setWorkerTotalEarned(nextWorkerTotal)

      const triggered = getTriggeredExpenses(
        nextTotal,
        expenseData.expenses,
        previousTotal,
        payPerSecond,
      )
      if (triggered.length > 0) {
        setNotifications((existing) => [
          ...toNotifications(
            triggered.map((item) => ({
              ...item,
              workerElapsedLabel: formatDuration(item.valueUsd / workerPayPerSecond),
            })),
          ),
          ...existing,
        ])
      }

      const workerTriggered = getTriggeredExpenses(
        nextWorkerTotal,
        workerExpenses,
        previousWorkerTotal,
        workerPayPerSecond,
      )
      if (workerTriggered.length > 0) {
        setWorkerNotifications((existing) => [...toNotifications(workerTriggered), ...existing])
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [activeExecutive, expenseData, medianWorkerSalary])

  if (!ceoData || !activeExecutive || !expenseData) {
    return (
      <main className="app-shell">
        <div className="loading-message">Loading pay data…</div>
      </main>
    )
  }

  const payPerSecond = activeExecutive.ceo_pay_usd / SECONDS_PER_YEAR

  return (
    <main className="app-shell">
      <header className="page-header">
        <h1 className="page-header-title">
          Weal<span className="kern-lt">t</span>h watch
        </h1>
        <img
          className="page-header-figure"
          src={`${import.meta.env.BASE_URL}elon-nazi.png`}
          alt=""
          aria-hidden="true"
        />
      </header>

      <div className="page-lede">
        <p className="page-description">
          In 2025 Elon Musk received a compensation package worth $158,359,009,867 from Tesla.
        </p>
        <p className="page-description">
          Watch how that compares to the median salary of a US worker.
        </p>
      </div>

      <DashboardPage
        expenseData={expenseData}
        activeExecutive={activeExecutive}
        totalEarned={totalEarned}
        notifications={notifications}
        payPerSecond={payPerSecond}
        workerTotalEarned={workerTotalEarned}
        workerNotifications={workerNotifications}
      />
    </main>
  )
}

export default App
