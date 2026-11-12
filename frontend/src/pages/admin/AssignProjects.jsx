import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { UserCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export const AssignProjects = () => {
  const [projects, setProjects] = useState([])
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedContractorId, setSelectedContractorId] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        adminAPI.listProjects(),
        adminAPI.listContractors()
      ])
      setProjects(pRes.data)
      setContractors(cRes.data)
      if (pRes.data.length > 0) setSelectedProjectId(pRes.data[0].id)
      if (cRes.data.length > 0) setSelectedContractorId(cRes.data[0].id)
    } catch (err) {
      console.error('Failed to load projects/contractors:', err)
      toast.error('Failed to load project allocation data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedProjectId || !selectedContractorId) {
      toast.error('Please select both a road project and a contractor.')
      return
    }

    setSaving(true)
    try {
      const res = await adminAPI.assignProject(selectedProjectId, selectedContractorId)
      toast.success(`Project assigned to ${res.data.contractor_name || 'contractor'}!`)
      // Refresh project list to reflect update
      const pRes = await adminAPI.listProjects()
      setProjects(pRes.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign contractor.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader message="Loading assignment console..." />

  const currentProject = projects.find((p) => p.id === selectedProjectId)
  const currentContractor = contractors.find((c) => c.id === selectedContractorId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-emerald-400" />
          <span>Assign & Reallocate Construction Projects</span>
        </h1>
        <p className="text-xs text-slate-400">
          Authorize civil contractors to execute road milestones and upload site evidence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Form Card */}
        <form onSubmit={handleAssign} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Allocation Controls</h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Road Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — Current: {p.contractor_name || 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assign to Contractor
            </label>
            <select
              value={selectedContractorId}
              onChange={(e) => setSelectedContractorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractor_name} ({c.company_name})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Reassigning...' : 'Confirm Assignment'}</span>
            </button>
          </div>
        </form>

        {/* Selected Project Dossier Preview */}
        {currentProject && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Project Allocation Status</h2>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Project Title</span>
                <p className="text-sm font-bold text-white">{currentProject.name}</p>
                <p className="text-xs text-slate-400">{currentProject.road_location}, {currentProject.district}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Contractor</span>
                  <p className="text-xs font-bold text-emerald-400">
                    {currentProject.contractor_name || 'Currently Unassigned'}
                  </p>
                </div>
                <StatusBadge status={currentProject.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Sanctioned Cost</span>
                  <span className="font-bold text-slate-200">₹{(currentProject.estimated_cost / 100000).toFixed(2)} Lakhs</span>
                </div>

                <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">Target Completion</span>
                  <span className="font-bold text-slate-200">{currentProject.expected_end_date}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignProjects

