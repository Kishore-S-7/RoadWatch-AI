import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { Send, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export const SubmitProgressReport = () => {
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get('project_id') || ''
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
  const [reportedProgress, setReportedProgress] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reportResult, setReportResult] = useState(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await contractorAPI.listAssignedProjects()
        setProjects(res.data)
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(res.data[0].id)
        }
      } catch (err) {
        toast.error('Failed to load assigned projects.')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Auto-populate current reported progress when project is selected
  useEffect(() => {
    if (!selectedProjectId) return
    const p = projects.find((proj) => proj.id === selectedProjectId)
    if (p) {
      setReportedProgress(p.reported_progress || '')
    }
  }, [selectedProjectId, projects])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProjectId) {
      toast.error('Please select an assigned project.')
      return
    }
    if (reportedProgress === '' || isNaN(reportedProgress)) {
      toast.error('Please enter a valid reported completion %.')
      return
    }

    setSubmitting(true)
    try {
      const res = await contractorAPI.submitProgressReport(selectedProjectId, {
        reported_progress: Number(reportedProgress),
        description: description.trim(),
        supporting_images: []
      })
      setReportResult(res.data)
      toast.success('Progress report submitted and audited!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader message="Loading assigned contracts..." />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Send className="w-6 h-6 text-emerald-400" />
          <span>Submit Construction Progress Report</span>
        </h1>
        <p className="text-xs text-slate-400">
          Submitting a progress report automatically recalculates milestone progress and executes verification audit checks.
        </p>
      </div>

      {reportResult ? (
        /* Report Result Card */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">Progress Report Audited</h2>
            </div>
            <StatusBadge status={reportResult.verification_status} />
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Project:</span>
              <span className="font-bold text-white">{reportResult.project_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Reported Progress Claim:</span>
              <span className="text-blue-400 font-bold">{reportResult.reported_progress}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Calculated Milestone Completion:</span>
              <span className="text-emerald-400 font-bold">{reportResult.calculated_progress_at_submission}%</span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400">Discrepancy Gap:</span>
              <span className={`font-bold ${reportResult.difference > 10 ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
                {reportResult.difference}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setReportResult(null)
                setDescription('')
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
            >
              Submit Another Report
            </button>
            <button
              onClick={() => navigate('/contractor/verification-status')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <span>View Verification Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Report Form */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Assigned Road Project <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.road_location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Claimed Cumulative Progress Percentage (0-100%) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              max="100"
              step="0.5"
              value={reportedProgress}
              onChange={(e) => setReportedProgress(e.target.value)}
              placeholder="e.g. 75.0"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-emerald-500 font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Note: If this value diverges from weighted milestones by &gt; 10%, a Verification Required alert is created.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Progress Narrative & Execution Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail construction activities completed in this period: asphalt compaction, kerb construction, drainage works..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting & Auditing...' : 'Submit Progress Report'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SubmitProgressReport

