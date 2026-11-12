import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { ListOrdered, Save, CheckCircle2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

export const UpdateMilestones = () => {
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get('project_id') || ''

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
  const [milestones, setMilestones] = useState([])
  const [calculatedProgress, setCalculatedProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMilestones, setLoadingMilestones] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch assigned projects list
  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await contractorAPI.listAssignedProjects()
        setProjects(res.data)
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load assigned projects:', err)
        toast.error('Failed to load projects.')
      } finally {
        setLoading(false)
      }
    }
    fetchAssigned()
  }, [])

  // Fetch milestones when selected project changes
  const fetchMilestones = async () => {
    if (!selectedProjectId) return
    setLoadingMilestones(true)
    try {
      const res = await contractorAPI.getMilestones(selectedProjectId)
      setMilestones(res.data.milestones || [])
      setCalculatedProgress(res.data.calculated_progress || 0)
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Access Forbidden: You are not assigned to this project.')
      } else {
        toast.error('Failed to load milestones.')
      }
    } finally {
      setLoadingMilestones(false)
    }
  }

  useEffect(() => {
    fetchMilestones()
  }, [selectedProjectId])

  const handleCompletionChange = (index, value) => {
    const num = Math.min(100, Math.max(0, Number(value) || 0))
    const updated = [...milestones]
    updated[index].completion = num
    setMilestones(updated)

    // Recalculate live preview
    const liveProgress = updated.reduce(
      (sum, m) => sum + (Number(m.weight) * Number(m.completion)) / 100.0,
      0
    )
    setCalculatedProgress(round(liveProgress, 2))
  }

  const round = (val, dec) => Number(Math.round(val + 'e' + dec) + 'e-' + dec)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const items = milestones.map((m) => ({ id: m.id, completion: Number(m.completion) || 0 }))
      const res = await contractorAPI.updateMilestones(selectedProjectId, items)
      setCalculatedProgress(res.data.calculated_progress)
      toast.success('Construction milestone progress submitted & recalculated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update progress.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader message="Loading assigned contracts..." />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ListOrdered className="w-6 h-6 text-emerald-400" />
          <span>Update Construction Milestones</span>
        </h1>
        <p className="text-xs text-slate-400">
          Enter verified stage completions (0-100%). Weights are defined by government engineers and are strictly read-only.
        </p>
      </div>

      {/* Project Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
        <label className="block text-xs font-semibold uppercase font-mono text-slate-300">
          Select Assigned Project
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

      {loadingMilestones ? (
        <Loader message="Fetching engineering milestones..." />
      ) : milestones.length === 0 ? (
        <EmptyState title="No Milestones Defined" description="Contact government administrator to configure weighted milestones for this project." />
      ) : (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Progress Overview Header */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">Overall Milestone Progress:</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{calculatedProgress.toFixed(1)}%</span>
            </div>
            <ProgressBar progress={calculatedProgress} size="md" color="emerald" showPercent={false} />
          </div>

          {/* Milestones Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-mono border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Construction Stage</th>
                  <th className="px-4 py-3 w-36">Weight (Read-only)</th>
                  <th className="px-4 py-3 w-44">Completion %</th>
                  <th className="px-4 py-3 w-32 text-right">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {milestones.map((m, idx) => {
                  const contrib = (Number(m.weight) * Number(m.completion)) / 100.0
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white block">{m.name}</span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700 font-semibold">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>{m.weight}%</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={m.completion}
                            onChange={(e) => handleCompletionChange(idx, e.target.value)}
                            className="w-20 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500 font-bold"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-400 font-bold text-right">
                        {contrib.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              Formula: &sum; (Weight &times; Completion / 100)
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Submit Progress'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default UpdateMilestones

