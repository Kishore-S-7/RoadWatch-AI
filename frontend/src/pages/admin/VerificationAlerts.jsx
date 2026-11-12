import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  ClipboardCheck,
  Send,
  Eye,
  X,
  FileCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

export const VerificationAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Clarification form
  const [clarificationMessage, setClarificationMessage] = useState('')
  const [sendingClarification, setSendingClarification] = useState(false)

  // Inspection form
  const [inspectorNotes, setInspectorNotes] = useState('')
  const [outcome, setOutcome] = useState('Physical measurement verifies milestone completion is accurate.')
  const [savingInspection, setSavingInspection] = useState(false)

  const fetchAlerts = async () => {
    try {
      const res = await adminAPI.listAlerts()
      setAlerts(res.data)
      if (res.data.length > 0 && !selectedAlert) {
        loadAlertDetails(res.data[0].id)
      }
    } catch (err) {
      console.error('Failed to load alerts:', err)
      toast.error('Failed to load verification alerts.')
    } finally {
      setLoading(false)
    }
  }

  const loadAlertDetails = async (alertId) => {
    setLoadingDetail(true)
    try {
      const res = await adminAPI.getAlert(alertId)
      setSelectedAlert(res.data)
    } catch (err) {
      toast.error('Failed to load alert details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const handleSendClarification = async (e) => {
    e.preventDefault()
    if (!clarificationMessage.trim() || !selectedAlert) return

    setSendingClarification(true)
    try {
      await adminAPI.requestClarification(selectedAlert.id, {
        message: clarificationMessage.trim(),
        supporting_images: []
      })
      toast.success('Clarification request sent to contractor!')
      setClarificationMessage('')
      loadAlertDetails(selectedAlert.id)
    } catch (err) {
      toast.error('Failed to send clarification request.')
    } finally {
      setSendingClarification(false)
    }
  }

  const handleRecordInspection = async (e) => {
    e.preventDefault()
    if (!inspectorNotes.trim() || !selectedAlert) return

    setSavingInspection(true)
    try {
      await adminAPI.recordInspection(selectedAlert.id, {
        inspector_notes: inspectorNotes.trim(),
        outcome: outcome.trim(),
        inspected_on: new Date().toISOString().substring(0, 10)
      })
      toast.success('Physical inspection report recorded!')
      setInspectorNotes('')
      loadAlertDetails(selectedAlert.id)
    } catch (err) {
      toast.error('Failed to record physical inspection.')
    } finally {
      setSavingInspection(false)
    }
  }

  const handleResolveAlert = async (alertId) => {
    if (!window.confirm('Mark this verification alert as Resolved?')) return

    try {
      await adminAPI.resolveAlert(alertId)
      toast.success('Verification alert marked as Resolved!')
      fetchAlerts()
      loadAlertDetails(alertId)
    } catch (err) {
      toast.error('Failed to resolve alert.')
    }
  }

  if (loading) return <Loader message="Fetching verification alerts..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span>Verification Alerts & Discrepancy Audits</span>
        </h1>
        <p className="text-xs text-slate-400">
          Neutral supervisory verification queue. An alert signifies a discrepancy gap requiring clarification or field inspection.
        </p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Open Discrepancy Alerts"
          description="All road projects are currently matching reported milestones within configured thresholds."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alerts List */}
          <div className="space-y-3 lg:col-span-1 max-h-[800px] overflow-y-auto pr-1">
            {alerts.map((al) => (
              <div
                key={al.id}
                onClick={() => loadAlertDetails(al.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAlert?.id === al.id
                    ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{al.project_name}</h4>
                  <StatusBadge status={al.status === 'open' ? 'verification_required' : 'resolved'} />
                </div>
                <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">{al.message}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 mt-2 font-mono">
                  <span>Contractor: {al.contractor_name || 'Assigned'}</span>
                  <span className="text-rose-400 font-bold">Diff: {al.difference}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Alert Detailed Action Panel */}
          {selectedAlert && (
            <div className="lg:col-span-2 space-y-6">
              {/* Header Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Project Associated</span>
                    <h3 className="text-lg font-bold text-white">{selectedAlert.project_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedAlert.status === 'open' ? 'verification_required' : 'resolved'} />
                    {selectedAlert.status === 'open' && (
                      <button
                        onClick={() => handleResolveAlert(selectedAlert.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl font-mono text-xs text-slate-200">
                  {selectedAlert.message}
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Reported:</span>
                    <span className="text-base font-bold text-blue-400">{selectedAlert.reported_progress}%</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Calculated:</span>
                    <span className="text-base font-bold text-emerald-400">{selectedAlert.calculated_progress}%</span>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Gap vs Limit:</span>
                    <span className="text-base font-bold text-rose-400">{selectedAlert.difference}% (Limit: {selectedAlert.threshold}%)</span>
                  </div>
                </div>
              </div>

              {/* Clarification Exchange Thread */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Formal Clarifications</h4>
                </div>

                {(!selectedAlert.clarifications || selectedAlert.clarifications.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No clarification messages exchanged yet.</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {selectedAlert.clarifications.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                          c.sender_role === 'admin'
                            ? 'bg-slate-950 border-slate-800 text-slate-300 ml-4'
                            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200 mr-4'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                          <span className="font-bold uppercase text-slate-300">
                            {c.sender_role === 'admin' ? 'Administrative Supervisor' : 'Assigned Contractor'}
                          </span>
                          <span>{c.created_at?.substring(0, 19).replace('T', ' ')}</span>
                        </div>
                        <p className="leading-relaxed">{c.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Send Clarification Input */}
                <form onSubmit={handleSendClarification} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    required
                    value={clarificationMessage}
                    onChange={(e) => setClarificationMessage(e.target.value)}
                    placeholder="Request specific milestone justification or explanation..."
                    className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingClarification}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request</span>
                  </button>
                </form>
              </div>

              {/* Physical Inspection Recording */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <ClipboardCheck className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Record Physical Inspection Result</h4>
                </div>

                {selectedAlert.inspections && selectedAlert.inspections.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Completed Physical Field Inspections:</span>
                    {selectedAlert.inspections.map((insp) => (
                      <div key={insp.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span className="text-emerald-400 font-semibold">Outcome: {insp.outcome}</span>
                          <span>Inspected on: {insp.inspected_on}</span>
                        </div>
                        <p className="text-slate-300">{insp.inspector_notes}</p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleRecordInspection} className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Field Inspector Official Notes
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={inspectorNotes}
                      onChange={(e) => setInspectorNotes(e.target.value)}
                      placeholder="Enter verified carriage measurements, core thickness, or material audit observations..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={outcome}
                      onChange={(e) => setOutcome(e.target.value)}
                      placeholder="Verification outcome verdict..."
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={savingInspection}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shrink-0"
                    >
                      {savingInspection ? 'Saving...' : 'Record Inspection'}
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

export default VerificationAlerts

