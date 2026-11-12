import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar, ComparisonProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  IndianRupee,
  Activity,
  ListOrdered,
  Camera,
  Send,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

export const ContractorProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await contractorAPI.getAssignedProject(id)
        setProject(res.data)
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access Forbidden: You are not assigned to this project.')
        } else {
          setError('Project details could not be loaded.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) return <Loader message="Loading assigned project details..." />
  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState title="Access Restricted" description={error || 'Project not found.'} />
        <div className="mt-4 text-center">
          <Link to="/contractor/projects" className="text-xs text-emerald-400 hover:underline">
            &larr; Back to My Assigned Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/contractor/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assigned Projects</span>
      </Link>

      {/* Main card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <StatusBadge status={project.verification_status} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{project.road_location}, {project.district}</span>
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right sm:min-w-[180px]">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimated Cost</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ₹{(project.estimated_cost / 100000).toFixed(2)} L
            </span>
          </div>
        </div>

        {/* Progress Comparison */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <ComparisonProgressBar
            reported={project.reported_progress}
            calculated={project.calculated_progress}
            threshold={project.alert_threshold}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Work Commencement Date</span>
            <span className="font-semibold text-slate-200">{project.start_date}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Expected Completion Target</span>
            <span className="font-semibold text-slate-200">{project.expected_end_date}</span>
          </div>
        </div>

        {/* Action Shortcuts */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-3">
          <Link
            to={`/contractor/milestones?project_id=${project.id}`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Update Construction Milestones</span>
          </Link>

          <Link
            to={`/contractor/upload?project_id=${project.id}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Upload Road Photos</span>
          </Link>

          <Link
            to={`/contractor/progress-report?project_id=${project.id}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-4 h-4 text-blue-400" />
            <span>Submit Progress Report</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ContractorProjectDetail

