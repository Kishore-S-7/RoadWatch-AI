import React, { useState, useEffect } from 'react'
import { contractorAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { MessageSquareShare, Send, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

export const ContractorClarification = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [loading, setLoading] = useState(true)

  const [explanation, setExplanation] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const dRes = await contractorAPI.getDashboardSummary()
      setDashboardData(dRes.data)

      // Fetch projects that have active alerts
      const alertProjects = (dRes.data.projects || []).filter(
        (p) => p.verification_status === 'verification_required' || p.has_alert
      )

      // For each alert project, find alerts via verification status
      const vRes = await contractorAPI.getVerificationStatus()
      const flagged = (vRes.data || []).filter((v) => v.verification_status === 'verification_required')
      setAlerts(flagged)

      if (flagged.length > 0) {
        // Load alert details for the first one
        fetchAlertDetails(flagged[0].project_id)
      }
    } catch (err) {
      console.error('Failed to load clarification data:', err)
      toast.error('Failed to load alerts for clarification.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAlertDetails = async (projectId) => {
    try {
      // Find open alert for project by querying contractor alert
      // We can query assigned project alerts
      const res = await contractorAPI.getAssignedProject(projectId)
      setSelectedAlert({
        id: projectId,
        project_name: res.data.name,
        reported_progress: res.data.reported_progress,
        calculated_progress: res.data.calculated_progress,
        difference: res.data.difference,
        verification_status: res.data.verification_status,
        clarifications: []
      })
    } catch (err) {
      console.error('Failed to load alert detail:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmitClarification = async (e) => {
    e.preventDefault()
    if (!explanation.trim()) {
      toast.error('Please enter your engineering clarification.')
      return
    }

    setSubmitting(true)
    try {
      // Post clarification to open alert
      await contractorAPI.submitClarification(selectedAlert.id, {
        message: explanation.trim(),
        supporting_images: []
      })
      toast.success('Clarification submitted to government engineers!')
      setExplanation('')
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit clarification.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader message="Loading contractor discrepancy notices..." />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquareShare className="w-6 h-6 text-emerald-400" />
          <span>Submit Engineering Clarification</span>
        </h1>
        <p className="text-xs text-slate-400">
          Respond to supervisory verification discrepancies with engineering justifications, site photographs, or milestone explanations.
        </p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Pending Clarifications"
          description="None of your assigned contracts currently have open verification discrepancy alerts."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects with alerts column */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase text-slate-400">Flagged Contracts</h3>
            {alerts.map((item) => (
              <div
                key={item.project_id}
                onClick={() => fetchAlertDetails(item.project_id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAlert?.id === item.project_id
                    ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{item.project_name}</h4>
                  <StatusBadge status="verification_required" />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                  <span>Reported: {item.reported_progress}%</span>
                  <span className="text-rose-400 font-bold">Gap: {item.difference}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Clarification Action Column */}
          {selectedAlert && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Selected Road</span>
                    <h3 className="text-base font-bold text-white">{selectedAlert.project_name}</h3>
                  </div>
                  <StatusBadge status="verification_required" />
                </div>

                <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-xl text-xs space-y-1">
                  <div className="flex items-center space-x-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Discrepancy Gap Notice:</span>
                  </div>
                  <p className="text-rose-200 text-xs leading-relaxed">
                    Reported claimed progress ({selectedAlert.reported_progress}%) diverges from verified milestones ({selectedAlert.calculated_progress}%) by a gap of {selectedAlert.difference}%.
                  </p>
                </div>

                {/* Clarification Form */}
                <form onSubmit={handleSubmitClarification} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Formal Contractor Engineering Explanation
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="Explain physical site conditions, pending milestone certifications, or reason for progress variance..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Submitting Explanation...' : 'Submit Clarification'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ContractorClarification

