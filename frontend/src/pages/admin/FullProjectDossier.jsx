import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminAPI, formatImageUrl } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar, ComparisonProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  HardHat,
  Activity,
  Layers,
  ScanEye,
  History,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

export const FullProjectDossier = () => {
  const { id } = useParams()
  const [dossier, setDossier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('milestones') // 'milestones', 'detections', 'photos', 'history'

  // Milestone edit states
  const [milestones, setMilestones] = useState([])
  const [newMilestoneName, setNewMilestoneName] = useState('')
  const [newMilestoneWeight, setNewMilestoneWeight] = useState('')
  const [savingMilestone, setSavingMilestone] = useState(false)

  const fetchDossier = async () => {
    try {
      const res = await adminAPI.getFullProjectDossier(id)
      setDossier(res.data)
      setMilestones(res.data.milestones || [])
    } catch (err) {
      console.error('Failed to load project dossier:', err)
      toast.error('Failed to load project dossier.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDossier()
  }, [id])

  // Live weight sum calculation
  const totalWeight = milestones.reduce((sum, m) => sum + (Number(m.weight) || 0), 0)
  const isWeightValid = Math.abs(totalWeight - 100.0) < 0.01

  // Handle milestone change locally
  const handleMilestoneChange = (index, field, value) => {
    const updated = [...milestones]
    updated[index][field] = Number(value) || 0
    setMilestones(updated)
  }

  // Save all milestone changes to backend
  const handleSaveMilestones = async () => {
    if (!isWeightValid) {
      toast.error(`Total milestone weights must equal exactly 100%. Currently: ${totalWeight.toFixed(1)}%`)
      return
    }

    setSavingMilestone(true)
    try {
      // Save each updated milestone
      for (const m of milestones) {
        await adminAPI.updateMilestone(m.id, {
          name: m.name,
          weight: m.weight,
          completion: m.completion
        })
      }
      toast.success('Milestones updated and progress recalculated!')
      fetchDossier()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update milestones.')
    } finally {
      setSavingMilestone(false)
    }
  }

  // Add new milestone
  const handleAddMilestone = async (e) => {
    e.preventDefault()
    if (!newMilestoneName.trim() || !newMilestoneWeight) return

    const weightNum = Number(newMilestoneWeight)
    if (totalWeight + weightNum > 100.01) {
      toast.error(`Adding ${weightNum}% would exceed 100% total limit (Current: ${totalWeight}%).`)
      return
    }

    try {
      await adminAPI.createMilestone(id, {
        name: newMilestoneName.trim(),
        weight: weightNum,
        completion: 0.0
      })
      toast.success('Milestone added!')
      setNewMilestoneName('')
      setNewMilestoneWeight('')
      fetchDossier()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add milestone.')
    }
  }

  const handleDeleteMilestone = async (mId) => {
    if (!window.confirm('Delete this milestone?')) return
    try {
      await adminAPI.deleteMilestone(mId)
      toast.success('Milestone deleted.')
      fetchDossier()
    } catch (err) {
      toast.error('Failed to delete milestone.')
    }
  }

  const handleTriggerVerify = async () => {
    try {
      const res = await adminAPI.verifyProject(id)
      toast.success(`Verification complete: ${res.data.verification_status}`)
      fetchDossier()
    } catch (err) {
      toast.error('Verification failed.')
    }
  }

  if (loading) return <Loader message="Compiling complete administrative dossier..." />
  if (!dossier) return <EmptyState title="Dossier Not Found" description="Could not load project records." />

  const { project, calculated_progress, images, detections, verification_history, open_alert } = dossier

  return (
    <div className="space-y-6">
      {/* Top back nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/monitoring"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Monitoring Matrix</span>
        </Link>
        <button
          onClick={handleTriggerVerify}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Run Progress Verification</span>
        </button>
      </div>

      {/* Project Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <StatusBadge status={project.verification_status} />
              {project.is_delayed && <StatusBadge status="delayed" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{project.name}</h1>
            <div className="flex items-center text-xs text-slate-400 gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{project.road_location}, {project.district}</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right sm:min-w-[190px]">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Sanctioned Cost</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ₹{(project.estimated_cost / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: ±{project.alert_threshold}%</span>
          </div>
        </div>

        {/* Progress Comparison */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <ComparisonProgressBar
            reported={project.reported_progress}
            calculated={calculated_progress}
            threshold={project.alert_threshold}
          />
        </div>

        {/* Contractor & Schedule Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center space-x-3">
            <HardHat className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Contractor</span>
              <span className="font-semibold text-slate-200">{project.contractor_name || 'Unassigned'}</span>
              <p className="text-[10px] text-slate-400">{project.company_name}</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Commencement</span>
              <span className="font-semibold text-slate-200">{project.start_date}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Expected Target</span>
              <span className="font-semibold text-slate-200">{project.expected_end_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'milestones'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Milestones Engine ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('detections')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'detections'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ScanEye className="w-4 h-4" />
          <span>AI Detections ({detections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Verification Audit Trail ({verification_history.length})</span>
        </button>
      </div>

      {/* Tab 1: Milestone Engine */}
      {activeTab === 'milestones' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Engineering Weighted Milestones</h3>
              <p className="text-xs text-slate-400">
                Rule: Weights of all milestones in a project must sum to EXACTLY 100%. Only Admin can modify weights.
              </p>
            </div>

            {/* Live Weight Sum Validation Pill */}
            <div className={`px-4 py-2 rounded-xl border flex items-center space-x-2 ${
              isWeightValid
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/50 border-rose-500/50 text-rose-300 animate-pulse'
            }`}>
              {isWeightValid ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span className="text-xs font-mono font-semibold">
                Weight Sum: {totalWeight.toFixed(1)}% / 100% {isWeightValid ? '(Valid)' : '(Must Equal 100%)'}
              </span>
            </div>
          </div>

          {/* Milestones Editor Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono border-b border-slate-700">
                <tr>
                  <th className="px-4 py-2.5">Milestone Name</th>
                  <th className="px-4 py-2.5 w-32">Weight (%)</th>
                  <th className="px-4 py-2.5 w-32">Completion (%)</th>
                  <th className="px-4 py-2.5 w-32">Progress Contrib.</th>
                  <th className="px-4 py-2.5 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {milestones.map((m, idx) => {
                  const contrib = ((Number(m.weight) || 0) * (Number(m.completion) || 0)) / 100.0
                  return (
                    <tr key={m.id || idx}>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={m.name}
                          onChange={(e) => handleMilestoneChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={m.weight}
                          onChange={(e) => handleMilestoneChange(idx, 'weight', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={m.completion}
                          onChange={(e) => handleMilestoneChange(idx, 'completion', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-emerald-400 font-semibold">
                        {contrib.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={handleSaveMilestones}
              disabled={savingMilestone || !isWeightValid}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{savingMilestone ? 'Updating...' : 'Save Milestone Weights & Progress'}</span>
            </button>
          </div>

          {/* Add Milestone Sub-form */}
          <form onSubmit={handleAddMilestone} className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-semibold uppercase text-slate-300">+ Add New Engineering Milestone</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Milestone stage title..."
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  placeholder="Weight %"
                  value={newMilestoneWeight}
                  onChange={(e) => setNewMilestoneWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: AI Detections */}
      {activeTab === 'detections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">YOLO Defect Detections for this Project</h3>
          {detections.length === 0 ? (
            <EmptyState title="No Defect Scans" description="No road images have been uploaded or processed for defects yet." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detections.map((det) => (
                <div key={det.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-400">{det.created_at?.substring(0, 10)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-semibold">
                      {det.total_defects} Total Defects
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Cracks:</span>
                      <span className="text-amber-400 font-bold">{det.crack_count || 0}</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Potholes:</span>
                      <span className="text-rose-400 font-bold">{det.pothole_count || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Verification History & Audit Trail</h3>
          {verification_history.length === 0 ? (
            <EmptyState title="No History Recorded" description="Verification runs and alert actions will appear here." />
          ) : (
            <div className="space-y-3">
              {verification_history.map((h) => (
                <div key={h.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white uppercase font-mono">{h.event}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400 font-mono">Actor: {h.actor}</span>
                    </div>
                    <p className="text-slate-400">
                      Reported: {h.reported_progress}% &bull; Calculated: {h.calculated_progress}% &bull; Diff: {h.difference}%
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={h.status} />
                    <p className="text-[10px] text-slate-500 font-mono mt-1">{h.created_at?.substring(0, 19).replace('T', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FullProjectDossier

