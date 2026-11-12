import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { CheckCircle2, Play, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export const ProgressVerification = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState(null)

  const fetchProjects = async () => {
    try {
      const res = await adminAPI.listProjects()
      setProjects(res.data)
    } catch (err) {
      console.error('Failed to load projects for verification:', err)
      toast.error('Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleRunVerify = async (projectId) => {
    setVerifyingId(projectId)
    try {
      const res = await adminAPI.verifyProject(projectId)
      toast.success(res.data.message || 'Verification audit complete!')
      fetchProjects()
    } catch (err) {
      toast.error('Verification failed.')
    } finally {
      setVerifyingId(null)
    }
  }

  if (loading) return <Loader message="Loading verification matrix..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span>Progress Verification & Audit Console</span>
          </h1>
          <p className="text-xs text-slate-400">
            Compare reported progress vs milestone progress, evaluate discrepancy gaps, and trigger verification audits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((proj) => {
          const rep = Number(proj.reported_progress) || 0
          const calc = Number(proj.calculated_progress) || 0
          const diff = Math.abs(rep - calc).toFixed(1)
          const thresh = Number(proj.alert_threshold) || 10
          const isOverThresh = diff > thresh

          return (
            <div
              key={proj.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-slate-700 transition-all shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{proj.name}</h3>
                  <p className="text-xs text-slate-400">{proj.road_location}, {proj.district}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={proj.verification_status} />
                  <button
                    onClick={() => handleRunVerify(proj.id)}
                    disabled={verifyingId === proj.id}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{verifyingId === proj.id ? 'Auditing...' : 'Run Verification'}</span>
                  </button>
                </div>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Reported (Contractor)</span>
                  <span className="text-xl font-bold text-blue-400">{rep}%</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Calculated (Milestones)</span>
                  <span className="text-xl font-bold text-emerald-400">{calc}%</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Discrepancy Gap</span>
                  <span className={`text-xl font-bold ${isOverThresh ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
                    {diff}%
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase block">Acceptable Threshold</span>
                  <span className="text-xl font-bold text-slate-300">±{thresh}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ProgressVerification

