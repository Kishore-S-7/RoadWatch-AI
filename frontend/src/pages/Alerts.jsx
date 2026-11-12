import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  ArrowRight,
  Filter,
  Layers,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { alertsAPI, projectsAPI, verificationAPI } from '../services/api'
import { useToast } from '../components/Toast'

export const Alerts = () => {
  const [projects, setProjects] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('open') // 'open' | 'resolved' | 'all'
  const [verifyingId, setVerifyingId] = useState(null)
  const [resolvingId, setResolvingId] = useState(null)

  const { addToast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      const [projRes, alertRes] = await Promise.all([
        projectsAPI.list(),
        alertsAPI.list(statusFilter === 'all' ? null : statusFilter)
      ])
      setProjects(projRes.data)
      setAlerts(alertRes.data)
    } catch (err) {
      addToast('Error loading verification & alerts data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleRunVerification = async (projectId) => {
    setVerifyingId(projectId)
    try {
      const res = await verificationAPI.verify(projectId)
      const { has_discrepancy, alert_triggered, difference, threshold } = res.data
      if (has_discrepancy) {
        addToast(`Discrepancy Alert Triggered: Gap of ${difference}% exceeds threshold of ${threshold}%.`, 'error')
      } else {
        addToast(`Project verified successfully: Gap of ${difference}% is within ${threshold}%.`, 'success')
      }
      loadData()
    } catch (err) {
      addToast('Verification error: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleBatchVerifyAll = async () => {
    setVerifyingId('all')
    try {
      for (const p of projects) {
        await verificationAPI.verify(p.id)
      }
      addToast('Audit verification completed across all registered projects.', 'success')
      loadData()
    } catch (err) {
      addToast('Batch verification error.', 'error')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleResolveAlert = async (alertId) => {
    setResolvingId(alertId)
    try {
      await alertsAPI.resolve(alertId)
      addToast('Discrepancy audit alert resolved.', 'success')
      loadData()
    } catch (err) {
      addToast('Failed to resolve alert: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Discrepancy & Verification Alerts</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated government transparency audit: Compares reported construction progress vs verified milestone calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchVerifyAll}
            disabled={verifyingId !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === 'all' ? 'animate-spin' : ''}`} />
            <span>Audit Verify All Projects</span>
          </button>
        </div>
      </div>

      {/* Projects Audit Telemetry Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
              Project Verification Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Rule: Alert triggered when <code className="text-amber-400">|Reported - Calculated| &gt; Threshold</code>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-center">Admin Reported %</th>
                <th className="py-3 px-4 text-center">Milestones Calc %</th>
                <th className="py-3 px-4 text-center">Difference</th>
                <th className="py-3 px-4 text-center">Tolerance Threshold</th>
                <th className="py-3 px-4 text-center">Audit Status</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projects.map((p) => {
                const diff = (p.discrepancy || 0).toFixed(1)
                const threshold = p.alert_threshold || 10
                const isDiscrepant = parseFloat(diff) > threshold

                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{p.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.contractor}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-blue-400">
                      {p.reported_progress}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {p.calculated_progress !== undefined ? `${p.calculated_progress}%` : '--'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={isDiscrepant ? 'text-red-400' : 'text-slate-300'}>
                        {diff}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      ±{threshold}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isDiscrepant ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Discrepancy
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRunVerification(p.id)}
                        disabled={verifyingId === p.id}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer border border-slate-700 disabled:opacity-50"
                      >
                        {verifyingId === p.id ? 'Auditing...' : 'Run Verification'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Feed Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-5 gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Official Discrepancy Alerts
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            {['open', 'resolved', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize font-mono text-[11px] transition-colors ${
                  statusFilter === st
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            <p>No {statusFilter === 'all' ? '' : statusFilter} discrepancy alerts on file.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.status === 'open'
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200">
                      {alert.project_name || 'Project Alert'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      alert.status === 'open'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {alert.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>

                    {alert.status === 'open' && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={resolvingId === alert.id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{resolvingId === alert.id ? 'Resolving...' : 'Mark Resolved'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-3">
                  {alert.message}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-3 border-t border-slate-800/80">
                  <span className="text-slate-400">
                    Reported: <strong className="text-blue-400 font-bold">{alert.reported_progress}%</strong>
                  </span>
                  <span className="text-slate-400">
                    Milestones: <strong className="text-emerald-400 font-bold">{alert.calculated_progress}%</strong>
                  </span>
                  <span className="text-slate-400">
                    Gap: <strong className="text-red-400 font-bold">{alert.difference}%</strong>
                  </span>
                  <span className="text-slate-400">
                    Threshold: <strong>{alert.threshold}%</strong>
                  </span>
                  <Link
                    to={`/milestones?project=${alert.project_id}`}
                    className="ml-auto text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-sans font-medium"
                  >
                    <span>Inspect Milestones</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

