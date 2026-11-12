import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import {
  FolderGit2,
  Activity,
  CheckCircle,
  ClockAlert,
  AlertTriangle,
  Send,
  Camera,
  ArrowRight
} from 'lucide-react'

export const ContractorDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await contractorAPI.getDashboardSummary()
        setData(res.data)
      } catch (err) {
        console.error('Failed to load contractor dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

  if (loading) return <Loader message="Loading contractor workspace..." />
  if (!data) return <EmptyState title="Portal Unavailable" description="Unable to load contractor summary." />

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contractor Operations Dashboard</h1>
          <p className="text-xs text-slate-400">
            Assigned government road projects, milestone execution tracking, and quality verification status.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/contractor/upload"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Upload Road Photo</span>
          </Link>
          <Link
            to="/contractor/progress-report"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Progress</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards (Assigned, Ongoing, Completed, Pending Updates, Verification Alerts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          title="Assigned Works"
          value={data.assigned_projects}
          subtext="Allocated road contracts"
          icon={FolderGit2}
          color="emerald"
        />
        <StatCard
          title="Ongoing"
          value={data.ongoing_projects}
          subtext="Active construction phase"
          icon={Activity}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={data.completed_projects}
          subtext="100% finished contracts"
          icon={CheckCircle}
          color="blue"
        />
        <StatCard
          title="Pending Updates"
          value={data.pending_updates}
          subtext="Milestones in progress"
          icon={ClockAlert}
          color="purple"
        />
        <StatCard
          title="Verification Alerts"
          value={data.verification_alerts}
          subtext="Discrepancies needing clarification"
          icon={AlertTriangle}
          color="rose"
          alert={data.verification_alerts > 0}
        />
      </div>

      {/* Assigned Projects With Progress Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">My Assigned Road Projects</h2>
          <Link to="/contractor/projects" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <span>View All Assigned</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {data.projects.length === 0 ? (
          <EmptyState title="No Projects Assigned" description="No road works currently assigned to your contractor account." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.projects.map((proj) => (
              <div
                key={proj.id}
                className="p-5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{proj.name}</h3>
                    <p className="text-xs text-slate-400">{proj.road_location}</p>
                  </div>
                  <StatusBadge status={proj.verification_status} />
                </div>

                <div className="space-y-1.5 pt-1">
                  <ProgressBar
                    progress={proj.calculated_progress}
                    label="Milestone Verified Completion"
                    color={proj.status === 'completed' ? 'blue' : 'emerald'}
                    size="sm"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Reported: {proj.reported_progress}%</span>
                    <span>Target: {proj.expected_end_date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <Link
                    to={`/contractor/milestones?project_id=${proj.id}`}
                    className="text-xs text-emerald-400 hover:underline font-semibold"
                  >
                    Update Milestones &rarr;
                  </Link>

                  <Link
                    to={`/contractor/projects/${proj.id}`}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    View Project Details
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

export default ContractorDashboard

