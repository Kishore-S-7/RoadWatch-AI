import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { ImageUpload } from '../../components/ImageUpload'
import { FolderPlus, ArrowLeft, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

export const AddProject = () => {
  const navigate = useNavigate()
  const [contractors, setContractors] = useState([])
  const [loadingContractors, setLoadingContractors] = useState(true)

  const [name, setName] = useState('')
  const [roadLocation, setRoadLocation] = useState('')
  const [district, setDistrict] = useState('Chennai')
  const [description, setDescription] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [contractorId, setContractorId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10))
  const [expectedEndDate, setExpectedEndDate] = useState('')
  const [alertThreshold, setAlertThreshold] = useState(10)
  const [status, setStatus] = useState('planned')
  const [projectImageFile, setProjectImageFile] = useState(null)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const res = await adminAPI.listContractors()
        setContractors(res.data)
        if (res.data.length > 0) {
          setContractorId(res.data[0].id)
        }
      } catch (err) {
        console.error('Failed to load contractors:', err)
      } finally {
        setLoadingContractors(false)
      }
    }
    fetchContractors()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim() || !roadLocation.trim() || !estimatedCost || !expectedEndDate) {
      toast.error('Please fill in all mandatory project specifications.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        road_location: roadLocation.trim(),
        district: district.trim(),
        description: description.trim(),
        estimated_cost: Number(estimatedCost),
        contractor_id: contractorId || null,
        start_date: startDate,
        expected_end_date: expectedEndDate,
        status: status,
        alert_threshold: Number(alertThreshold) || 10
      }

      const res = await adminAPI.createProject(payload)
      const newProjectId = res.data.id

      // Upload image if selected
      if (projectImageFile) {
        const formData = new FormData()
        formData.append('file', projectImageFile)
        await adminAPI.uploadProjectImage(newProjectId, formData)
      }

      toast.success('Road project created successfully!')
      navigate(`/admin/projects/${newProjectId}`)
    } catch (err) {
      console.error('Failed to create project:', err)
      toast.error(err.response?.data?.detail || 'Failed to create project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects Management</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderPlus className="w-6 h-6 text-emerald-400" />
            <span>Add New Road Project</span>
          </h1>
          <p className="text-xs text-slate-400">
            Define infrastructure specifications, assign contractors, and calibrate verification thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Project Name & Road Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Project Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OMR Highway Resurfacing & Widening"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Road Location / Stretch <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={roadLocation}
              onChange={(e) => setRoadLocation(e.target.value)}
              placeholder="e.g. Sholinganallur to Siruseri IT Park"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* District & Contractor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              District <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Chennai, Chengalpattu, Kanchipuram"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assign Authorized Contractor
            </label>
            <select
              value={contractorId}
              onChange={(e) => setContractorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">-- Leave Unassigned --</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractor_name} ({c.company_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost & Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Estimated Sanctioned Cost (INR ₹) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="1000"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="e.g. 35000000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Alert Gap Threshold (%)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Commencement Start Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Expected End Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Project Description & Scope
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details on carriage width, pavement layers, culverts, or target traffic capacity..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Project Photograph Upload */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Project Master Photograph
          </label>
          <ImageUpload
            onFileSelect={(file) => setProjectImageFile(file)}
            label="Upload Project Master Photo"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <Link
            to="/admin/projects"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Project...' : 'Save Road Project'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProject

