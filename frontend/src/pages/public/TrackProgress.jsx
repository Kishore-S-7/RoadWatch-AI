import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publicAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ComparisonProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { Activity, Search, AlertCircle, CheckCircle2, MapPin } from 'lucide-react'

export const TrackProgress = () => {
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get('project_id') || ''

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
  const [progressData, setProgressData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    const fetchProjectsList = async () => {
      try {
        const res = await publicAPI.searchProjects({})
        setProjects(res.data)
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load projects list:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjectsList()
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return
    const fetchProgress = async () => {
      setLoadingDetail(true)
      try {
        const res = await publicAPI.getProjectProgress(selectedProjectId)
        setProgressData(res.data)
      } catch (err) {
        console.error('Failed to load progress details:', err)
      } finally {
        setLoadingDetail(false)
      }
    }
    fetchProgress()
  }, [selectedProjectId])

  if (loading) return <Loader message="Initializing public progress tracker..." />

  const diff = progressData
    ? Math.abs(progressData.reported_progress - progressData.calculated_progress).toFixed(1)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <span>Track Construction Progress & Verification Status</span>
        </h1>
        <p className="text-xs text-slate-400">
          Transparently compare contractor progress claims against verified milestone calculations.
        </p>
      </div>

      {/* Project Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
        <label className="block text-xs font-semibold uppercase font-mono text-slate-300">
          Select Government Road Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.road_location}, {p.district})
            </option>
          ))}
        </select>
      </div>

      {/* Progress Card */}
      {loadingDetail ? (
        <Loader message="Recalculating real-time progress metrics..." />
      ) : !progressData ? (
        <EmptyState title="No Project Selected" description="Please choose a project above to inspect progress metrics." />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-bold text-white">{progressData.project_name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Automated Discrepancy & Verification Engine</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={progressData.verification_status} />
              {progressData.is_delayed && <StatusBadge status="delayed" />}
            </div>
          </div>

          {/* Big Comparison Bars */}
          <div className="space-y-6">
            <ComparisonProgressBar
              reported={progressData.reported_progress}
              calculated={progressData.calculated_progress}
              threshold={10}
            />

            {/* Explanatory Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">1. Contractor Reported</span>
                <p className="text-3xl font-extrabold font-mono text-blue-400">
                  {progressData.reported_progress}%
                </p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  Claimed completion percentage submitted by the assigned contractor in periodic reports.
                </p>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">2. System Calculated</span>
                <p className="text-3xl font-extrabold font-mono text-emerald-400">
                  {progressData.calculated_progress}%
                </p>
                <p className="text-xs text-slate-400 leading-relaxed pt-1">
                  Mathematically aggregated progress derived strictly from weighted construction stages.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Status Insight */}
          <div className={`p-4 rounded-xl border ${
            progressData.verification_status === 'verification_required'
              ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
              : progressData.verification_status === 'completed'
              ? 'bg-blue-950/30 border-blue-800/60 text-blue-300'
              : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
          }`}>
            <div className="flex items-start space-x-3">
              {progressData.verification_status === 'verification_required' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider">
                  Audit Verdict: {progressData.verification_status === 'verification_required'
                    ? 'Supervisory Verification Required'
                    : progressData.verification_status === 'completed'
                    ? 'Certified 100% Completed Work'
                    : 'Milestone Progress Verified & Matching'}
                </p>
                <p className="text-xs opacity-90 leading-relaxed">
                  {progressData.verification_status === 'verification_required'
                    ? `A discrepancy gap of ${diff}% exists between contractor claims (${progressData.reported_progress}%) and milestone indicators (${progressData.calculated_progress}%). Supervisory field verification is currently pending.`
                    : `Reported progress and milestone completion align within standard engineering tolerance (threshold 10%).`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackProgress

