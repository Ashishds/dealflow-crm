import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { opportunitiesApi, interactionsApi } from '../api'
import type { MonthStats, Interaction } from '../types'
import { formatCurrency, formatDate, formatRelative, isOverdue } from '../utils'
import {
  TrendingUp, DollarSign, MessageSquare, Phone, Mail,
  CheckCircle2, Circle, Calendar, AlertCircle
} from 'lucide-react'

const TYPE_ICON: Record<string, React.ReactNode> = {
  note: <MessageSquare size={14} />,
  call: <Phone size={14} />,
  email: <Mail size={14} />,
}
const TYPE_COLOR: Record<string, string> = {
  note: '#ecad0a',
  call: '#209dd7',
  email: '#753991',
}

// Custom tooltip for charts
function ChartTooltip({ active, payload, label, format }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">{format(payload[0].value)}</div>
    </div>
  )
}

export default function Home() {
  const [stats, setStats] = useState<MonthStats[]>([])
  const [recent, setRecent] = useState<Interaction[]>([])
  const [tasks, setTasks] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [s, r, t] = await Promise.all([
        opportunitiesApi.wonByMonth(),
        interactionsApi.recent(),
        interactionsApi.tasks(false),
      ])
      setStats(s)
      setRecent(r.slice(0, 12))
      setTasks(t)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleTask(int: Interaction) {
    setTogglingId(int.id)
    try {
      await interactionsApi.toggleDone(int.id, !int.done)
      load()
    } finally {
      setTogglingId(null)
    }
  }

  const totalRevenue = stats.reduce((s, m) => s + m.revenue, 0)
  const totalWon = stats.reduce((s, m) => s + m.count, 0)
  const overdueTasks = tasks.filter(t => !t.done && isOverdue(t.due_date))
  const upcomingTasks = tasks.filter(t => !t.done && !isOverdue(t.due_date))

  // Format month labels
  const chartData = stats.map(m => ({
    ...m,
    label: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }))

  if (loading) return <div className="page"><div className="empty-state"><span className="spinner" /></div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Your pipeline at a glance</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="home-stats-row">
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: '#ecad0a1a', color: '#ecad0a' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="home-stat-value">{totalWon}</div>
            <div className="home-stat-label">Deals Won (All Time)</div>
          </div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: '#209dd71a', color: '#209dd7' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="home-stat-value">{formatCurrency(totalRevenue)}</div>
            <div className="home-stat-label">Total Revenue (Won)</div>
          </div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: '#dc26261a', color: '#dc2626' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="home-stat-value">{overdueTasks.length}</div>
            <div className="home-stat-label">Overdue Tasks</div>
          </div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-icon" style={{ background: '#7539911a', color: '#753991' }}>
            <Calendar size={20} />
          </div>
          <div>
            <div className="home-stat-value">{upcomingTasks.length}</div>
            <div className="home-stat-label">Upcoming Tasks</div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="home-charts-row">
        {/* Won deal count chart */}
        <div className="card home-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Won Deals by Month</h3>
            <span className="chart-subtitle">Count of closed-won deals</span>
          </div>
          {chartData.length === 0 ? (
            <div className="empty-state-small">No won deals yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip format={(v: number) => `${v} deals`} />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="#ecad0a" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue chart */}
        <div className="card home-chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Revenue by Month</h3>
            <span className="chart-subtitle">Sum of won deal values</span>
          </div>
          {chartData.length === 0 ? (
            <div className="empty-state-small">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip format={formatCurrency} />} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="#209dd7" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row: recent feed + tasks */}
      <div className="home-bottom-row">
        {/* Recent interactions */}
        <div className="card home-feed-card">
          <div className="card-header-inner">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state-small">No interactions logged yet</div>
          ) : (
            <div className="feed-list">
              {recent.map(int => {
                const color = TYPE_COLOR[int.type] || '#64748b'
                return (
                  <div key={int.id} className="feed-item">
                    <div className="feed-icon" style={{ background: color + '1a', color }}>
                      {TYPE_ICON[int.type]}
                    </div>
                    <div className="feed-content">
                      <div className="feed-meta">
                        <span className="feed-type" style={{ color }}>{int.type}</span>
                        {int.person_name && (
                          <Link to={`/people/${int.person_id}`} className="feed-link">{int.person_name}</Link>
                        )}
                        {int.opportunity_name && (
                          <Link to={`/opportunities/${int.opportunity_id}`} className="feed-link">{int.opportunity_name}</Link>
                        )}
                        <span className="feed-date">{formatRelative(int.occurred_at)}</span>
                      </div>
                      <p className="feed-desc">{int.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="card home-tasks-card">
          <div className="card-header-inner">
            <h3 className="card-title">Tasks</h3>
            <span className="badge badge-neutral">{tasks.length}</span>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state-small">No pending tasks</div>
          ) : (
            <div className="task-list">
              {/* Overdue first */}
              {overdueTasks.map(t => (
                <div key={t.id} className="task-item task-item-overdue">
                  <button
                    className="task-toggle-btn"
                    onClick={() => toggleTask(t)}
                    disabled={togglingId === t.id}
                  >
                    <Circle size={16} style={{ color: '#dc2626' }} />
                  </button>
                  <div className="task-content">
                    <p className="task-desc">{t.description}</p>
                    <div className="task-meta">
                      {t.person_name && <span>{t.person_name}</span>}
                      {t.opportunity_name && <span>{t.opportunity_name}</span>}
                      <span className="text-danger">Overdue · {formatDate(t.due_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingTasks.map(t => (
                <div key={t.id} className="task-item">
                  <button
                    className="task-toggle-btn"
                    onClick={() => toggleTask(t)}
                    disabled={togglingId === t.id}
                  >
                    <Circle size={16} style={{ color: '#9ca3af' }} />
                  </button>
                  <div className="task-content">
                    <p className="task-desc">{t.description}</p>
                    <div className="task-meta">
                      {t.person_name && <span>{t.person_name}</span>}
                      {t.opportunity_name && <span>{t.opportunity_name}</span>}
                      <span>Due {formatDate(t.due_date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
