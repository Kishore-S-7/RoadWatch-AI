import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FolderKanban, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ScanSearch, 
  TrendingUp, 
  ArrowUpRight,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import { dashboardAPI, alertsAPI } from '../services/api'
import { StatCard } from '../components/StatCard'
import { useToast } from '../components/Toast'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'

export const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resolvingId, setResolvingId] = useState(null)
  const { addToast } = useToast()

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await dashboardAPI.getSummary()
      setData(res.data)
    } catch (err) {
      addToast('Failed to load dashboard metrics: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId)
    try {
      await alertsAPI.resolve(alertId)
      addToast('Discrepancy alert marked as resolved.', 'success')
      await fetchSummary()
    } catch (err) {
      addToast('Error resolving alert: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setResolvingId(null)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-slate-400 uppercase tracking-wider">Loading Executive Audit Summary...</p>
      </div>
    )
  }

  const chartData = data?.project_charts?.map(item => ({
    name: item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name,
    'Reported Progress': item.reported_progress,
    'Verified Milestones': item.calculated_progress,
    difference: item.difference,
    hasDiscrepancy: item.has_discrepancy
  })) || []

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Executive Audit Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized monitoring for government road infrastructure projects & automated discrepancy tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Data</span>
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Projects"
          value={data?.total_projects || 0}
          subtext="Under national audit"
          icon={FolderKanban}
          color="blue"
        />
        <StatCard
          title="Ongoing Work"
          value={data?.ongoing_projects || 0}
          subtext="Active construction"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={data?.completed_projects || 0}
          subtext="Verified road works"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Open Alerts"
          value={data?.open_alerts || 0}
          subtext="Unresolved discrepancies"
          icon={AlertTriangle}
          color="red"
          alert={(data?.open_alerts || 0) > 0}
        />
        <StatCard
          title="Road Defects"
          value={data?.total_defects_detected || 0}
          subtext="Potholes & cracks via YOLO"
          icon={ScanSearch}
          color="amber"
        />
        <StatCard
          title="Avg Progress"
          value={`${data?.average_progress || 0}%`}
          subtext="Verified milestone mean"
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      {/* Middle Section: Recharts Progress Comparison */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Construction Progress Audit Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Admin-Reported Progress (%) vs Verified Weighted Milestone Progress (%)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-3 rounded-sm bg-blue-500"></span> Reported
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Verified Milestones
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            No projects registered for chart analysis.
          </div>
        ) : (
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={[0, 100]} 
                  unit="%" 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '8px', 
                    fontSize: '12px',
                    color: '#f8fafc' 
                  }}
                  itemStyle={{ padding: '2px 0' }}
                  formatter={(val, name) => [`${val}%`, name]}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                <Bar dataKey="Reported Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Verified Milestones" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom Section: Recent Discrepancy Alerts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts List (2 cols on lg) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
                Active Discrepancy Alerts
              </h3>
            </div>
            <Link 
              to="/alerts" 
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>View All Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {(!data?.recent_alerts || data.recent_alerts.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              <p>No active discrepancy alerts. All project reports match milestone calculations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recent_alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-3.5 rounded-lg border text-xs transition-all ${
                    alert.status === 'open' 
                      ? 'bg-red-500/5 border-red-500/20' 
                      : 'bg-slate-800/40 border-slate-700/50 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="font-semibold text-slate-200">
                      {alert.project_name || 'Project Alert'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        alert.status === 'open' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {alert.status}
                      </span>
                      {alert.status === 'open' && (
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolvingId === alert.id}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          {resolvingId === alert.id ? 'Resolving...' : 'Resolve'}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-300 font-mono text-[11px] leading-relaxed mb-2">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                    <span>Reported: <strong className="text-blue-400">{alert.reported_progress}%</strong></span>
                    <span>Milestones: <strong className="text-emerald-400">{alert.calculated_progress}%</strong></span>
                    <span>Gap: <strong className="text-red-400">{alert.difference}%</strong> (Threshold: {alert.threshold}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Launch & System Guidance */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase mb-3">
              Quick Audit Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/detection"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <ScanSearch className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Upload & Scan Road Image</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/projects"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Register Infrastructure Project</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/milestones"
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-200 hover:text-white transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Milestone Weight & Progress Engine</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Transparency Threshold</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              When the difference between admin-reported progress and calculated milestone progress exceeds the project's alert threshold (default 10%), an official audit alert is raised automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

