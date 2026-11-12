import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Calculator, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Percent, 
  Layers, 
  Edit2,
  Save,
  X
} from 'lucide-react'
import { projectsAPI, milestonesAPI, verificationAPI } from '../services/api'
import { useToast } from '../components/Toast'

export const Milestones = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') || '')
  const [projectData, setProjectData] = useState(null)
  const [milestonesData, setMilestonesData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  // New Milestone Form
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newWeight, setNewWeight] = useState('')
  const [newCompletion, setNewCompletion] = useState('')

  // Inline editing state
  const [editingId, setEditingId] = useState(null)
  const [editWeight, setEditWeight] = useState('')
  const [editCompletion, setEditCompletion] = useState('')

  const { addToast } = useToast()

  // Load all projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await projectsAPI.list()
        setProjects(res.data)
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(res.data[0].id)
        }
      } catch (err) {
        addToast('Failed to load projects list.', 'error')
      }
    }
    loadProjects()
  }, [])

  // Update query param
  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId })
      fetchMilestones(selectedProjectId)
    }
  }, [selectedProjectId])

  const fetchMilestones = async (pid) => {
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        milestonesAPI.listByProject(pid),
        projectsAPI.get(pid)
      ])
      setMilestonesData(mRes.data)
      setProjectData(pRes.data)
    } catch (err) {
      addToast('Error fetching project milestones: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMilestone = async (e) => {
    e.preventDefault()
    if (!selectedProjectId) return

    const weightNum = parseFloat(newWeight)
    const compNum = parseFloat(newCompletion || 0)

    try {
      await milestonesAPI.create(selectedProjectId, {
        name: newName,
        weight: weightNum,
        completion: compNum
      })
      addToast('Milestone stage added successfully.', 'success')
      setNewName('')
      setNewWeight('')
      setNewCompletion('')
      setIsAddOpen(false)
      fetchMilestones(selectedProjectId)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to add milestone.', 'error')
    }
  }

  const startEdit = (m) => {
    setEditingId(m.id)
    setEditWeight(m.weight)
    setEditCompletion(m.completion)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveEdit = async (mId) => {
    try {
      await milestonesAPI.update(mId, {
        weight: parseFloat(editWeight),
        completion: parseFloat(editCompletion)
      })
      addToast('Milestone metrics updated.', 'success')
      setEditingId(null)
      fetchMilestones(selectedProjectId)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update milestone.', 'error')
    }
  }

  const handleDelete = async (mId) => {
    try {
      await milestonesAPI.delete(mId)
      addToast('Milestone removed.', 'success')
      fetchMilestones(selectedProjectId)
    } catch (err) {
      addToast('Failed to delete milestone.', 'error')
    }
  }

  const handleUpdateReportedProgress = async (val) => {
    setIsUpdatingProgress(true)
    try {
      await verificationAPI.updateReportedProgress(selectedProjectId, parseFloat(val))
      addToast('Admin reported progress updated and verified.', 'success')
      fetchMilestones(selectedProjectId)
    } catch (err) {
      addToast('Error updating reported progress: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const totalWeight = milestonesData?.total_weight || 0
  const isWeightValid = totalWeight === 100.0
  const calculatedProgress = milestonesData?.calculated_progress || 0
  const reportedProgress = projectData?.reported_progress || 0
  const difference = Math.abs(reportedProgress - calculatedProgress).toFixed(2)
  const threshold = projectData?.alert_threshold || 10
  const hasDiscrepancy = parseFloat(difference) > threshold

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Milestone Progress Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Weighted milestone progress calculation: <code className="text-amber-400 font-mono">Progress = ∑(Weight × Completion / 100)</code>
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium uppercase font-mono">Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium max-w-xs"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Weight Validation Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calculated Progress Gauge Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex items-center gap-5">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.8"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-700 ease-out"
                strokeDasharray={`${calculatedProgress}, 100`}
                strokeWidth="3.8"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xl font-bold font-mono text-white">{calculatedProgress}%</span>
            </div>
          </div>
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Verified Progress</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">Calculated Milestone</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Derived from {milestonesData?.milestones?.length || 0} weighted construction stages
            </p>
          </div>
        </div>

        {/* Live Weight Sum Validation Meter */}
        <div className={`bg-slate-900/90 border rounded-xl p-5 shadow-xl flex flex-col justify-between ${
          isWeightValid ? 'border-emerald-500/30' : 'border-amber-500/30'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Total Milestone Weight</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                isWeightValid 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {totalWeight}% / 100%
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-300 ${
                  isWeightValid ? 'bg-emerald-500' : totalWeight > 100 ? 'bg-red-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, totalWeight)}%` }}
              ></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-normal flex items-start gap-1.5 mt-2">
            {isWeightValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Strict rule satisfied: Weights sum to exactly 100%.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Rule requirement: Total milestone weight must sum to exactly 100% (current: {totalWeight}%).
                </span>
              </>
            )}
          </p>
        </div>

        {/* Admin Reported Progress Comparison */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Admin Reported Progress</span>
              <span className="text-base font-bold font-mono text-blue-400">{reportedProgress}%</span>
            </div>
            <div className="text-[11px] text-slate-400 mb-2">
              Gap: <strong className={hasDiscrepancy ? 'text-red-400' : 'text-emerald-400'}>{difference}%</strong> (Threshold: {threshold}%)
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={reportedProgress}
              id="reportedProgressInput"
              className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={() => {
                const el = document.getElementById('reportedProgressInput')
                if (el) handleUpdateReportedProgress(el.value)
              }}
              disabled={isUpdatingProgress}
              className="flex-1 py-1 px-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUpdatingProgress ? 'Updating...' : 'Update & Audit'}
            </button>
          </div>
        </div>
      </div>

      {/* Milestones Table Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Construction Milestones Breakdown</span>
        </h3>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stage Milestone</span>
        </button>
      </div>

      {/* Milestones Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Milestone Stage</th>
              <th className="py-3 px-4 text-center">Allocated Weight (%)</th>
              <th className="py-3 px-4 text-center">Stage Completion (%)</th>
              <th className="py-3 px-4 text-center">Calculated Contribution</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400 font-mono">
                  Loading milestones...
                </td>
              </tr>
            ) : (!milestonesData?.milestones || milestonesData.milestones.length === 0) ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400">
                  No milestones configured for this project. Click "Add Stage Milestone" above.
                </td>
              </tr>
            ) : (
              milestonesData.milestones.map((m) => {
                const isEditing = editingId === m.id
                const contribution = ((m.weight * m.completion) / 100).toFixed(2)

                return (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {m.name}
                    </td>

                    {/* Weight Column */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="100"
                          value={editWeight}
                          onChange={(e) => setEditWeight(e.target.value)}
                          className="w-16 px-1.5 py-0.5 bg-slate-950 border border-amber-500/60 rounded text-center text-xs text-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-300">{m.weight}%</span>
                      )}
                    </td>

                    {/* Completion Column */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={editCompletion}
                          onChange={(e) => setEditCompletion(e.target.value)}
                          className="w-16 px-1.5 py-0.5 bg-slate-950 border border-amber-500/60 rounded text-center text-xs text-white"
                        />
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div 
                              className="bg-emerald-500 h-full"
                              style={{ width: `${m.completion}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-slate-200">{m.completion}%</span>
                        </div>
                      )}
                    </td>

                    {/* Calculated Contribution */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      +{contribution}%
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(m.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                              title="Save Changes"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(m)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Edit Metrics"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                              title="Remove Stage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Milestone Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Add Milestone Stage
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Stage Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asphalt Laying & Compaction"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Stage Weight (%) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={100 - totalWeight > 0 ? 100 - totalWeight : 100}
                    required
                    placeholder={`e.g. ${Math.max(1, 100 - totalWeight)}`}
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Remaining capacity: {Math.max(0, 100 - totalWeight)}%
                  </span>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Current Completion (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newCompletion}
                    onChange={(e) => setNewCompletion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors cursor-pointer"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

