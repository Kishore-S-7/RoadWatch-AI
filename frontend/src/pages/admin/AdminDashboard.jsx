import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import {
  FolderKanban,
  Activity,
  CheckCircle,
  ClockAlert,
  AlertTriangle,
  MessageSquareWarning,
  ArrowRight,
  TrendingUp,
  ScanEye
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

export const AdminDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await adminAPI.getDashboardSummary()
        setData(res.data)
      } catch (err) {
        console.error('Failed to load admin dashboard summary:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) return <Loader message="Loading state executive monitoring data..." />
  if (!data) return <EmptyState title="Dashboard Unavailable" description="Unable to load administrative summary." />

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Road Infrastructure Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time multi-district project surveillance, quality verification, and citizen redressal metrics.
          </p>
        </div>
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>+ Add New Road Project</span>
        </Link>
      </div>

      {/* 6 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Total Projects"
          value={data.total_projects}
          subtext="Sanctioned highways & roads"
          icon={FolderKanban}
          color="emerald"
        />
        <StatCard
          title="Ongoing Works"
          value={data.ongoing_projects}
          subtext="Active construction in progress"
          icon={Activity}
          color="amber"
        />
        <StatCard
          title="Completed Roads"
          value={data.completed_projects}
          subtext="Certified 100% finished"
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Delayed Projects"
          value={data.delayed_projects}
          subtext="Exceeded expected end date"
          icon={ClockAlert}
          color="rose"
          alert={data.delayed_projects > 0}
        />
        <StatCard
          title="Pending Verification"
          value={data.pending_verification}
          subtext="Open discrepancy alerts"
          icon={AlertTriangle}
          color="amber"
          alert={data.pending_verification > 0}
        />
        <StatCard
          title="Citizen Complaints"
          value={data.citizen_complaints}
          subtext="Total grievances filed"
          icon={MessageSquareWarning}
          color="purple"
        />
      </div>

      {/* Progress Comparison Chart (Recharts) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Project Progress Comparison (Claimed vs Verified)</h2>
            <p className="text-xs text-slate-400">Comparing contractor reported progress against milestone calculated completion</p>
          </div>
          <Link to="/admin/monitoring" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <span>Open Monitoring Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {data.project_charts && data.project_charts.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.project_charts} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="reported_progress" name="Contractor Reported (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calculated_progress" name="Milestone Verified (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No Chart Data" description="No active road progress data to plot." />
        )}
      </div>

      {/* Two Column Grid: Verification Alerts & Recent Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Alerts Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Active Verification Alerts</h3>
              </div>
              <Link to="/admin/alerts" className="text-xs text-emerald-400 hover:underline">
                View All Alerts &rarr;
              </Link>
            </div>

            {(!data.recent_alerts || data.recent_alerts.length === 0) ? (
              <EmptyState title="All Projects Verified" description="No active progress discrepancies require verification." />
            ) : (
              <div className="space-y-2.5">
                {data.recent_alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-white truncate">{alert.project_name}</span>
                      <StatusBadge status="verification_required" />
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Threshold: {alert.threshold}%</span>
                      <Link to={`/admin/alerts/${alert.id}`} className="text-emerald-400 hover:underline">
                        Review & Clarify &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Citizen Complaints Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquareWarning className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Recent Citizen Road Complaints</h3>
              </div>
              <Link to="/admin/complaints" className="text-xs text-emerald-400 hover:underline">
                Triage Complaints &rarr;
              </Link>
            </div>

            {(!data.recent_complaints || data.recent_complaints.length === 0) ? (
              <EmptyState title="No Grievances" description="No citizen complaints currently logged." />
            ) : (
              <div className="space-y-2.5">
                {data.recent_complaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold font-mono text-emerald-400">{c.reference_number}</span>
                        <p className="text-[11px] text-slate-300 truncate">{c.road_location}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{c.description}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="capitalize">Type: {c.complaint_type}</span>
                      <Link to={`/admin/complaints/${c.id}`} className="text-emerald-400 hover:underline">
                        Review Grievance &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

