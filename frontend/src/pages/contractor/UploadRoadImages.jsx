import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { ImageUpload } from '../../components/ImageUpload'
import { Loader } from '../../components/Loader'
import { Camera, Scan, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const UploadRoadImages = () => {
  const [searchParams] = useSearchParams()
  const initialProjectId = searchParams.get('project_id') || ''
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId)
  const [stageName, setStageName] = useState('Asphalt Laying Stage')
  const [description, setDescription] = useState('')
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().substring(0, 10))
  const [photoFile, setPhotoFile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProjectId) {
      toast.error('Please select an assigned project.')
      return
    }
    if (!photoFile) {
      toast.error('Please attach a road photograph for AI scanning.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', photoFile)
      formData.append('stage_name', stageName)
      formData.append('description', description)

      const res = await contractorAPI.uploadImage(selectedProjectId, formData)
      setUploadResult(res.data)
      toast.success('Image scanned and defects analyzed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Image upload or AI scanning failed.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Loader message="Loading assigned contracts..." />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Camera className="w-6 h-6 text-emerald-400" />
          <span>Upload Construction Road Photographs</span>
        </h1>
        <p className="text-xs text-slate-400">
          Upload high-resolution surveillance, drone, or smartphone site photos. The YOLO AI model will automatically detect cracks and potholes.
        </p>
      </div>

      {uploadResult ? (
        /* Result Preview Card */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-white">AI Surface Scan Complete</h2>
            </div>
            <span className="px-3 py-1 bg-slate-800 text-emerald-400 rounded-full font-mono text-xs font-semibold">
              {uploadResult.detection?.total_defects || 0} Defects Identified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Cracks Detected</span>
              <span className="text-xl font-bold text-amber-400">{uploadResult.defect_counts?.Crack || 0}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Potholes Detected</span>
              <span className="text-xl font-bold text-rose-400">{uploadResult.defect_counts?.Pothole || 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setUploadResult(null)
                setPhotoFile(null)
                setDescription('')
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
            >
              Upload Another Photo
            </button>

            <button
              onClick={() => navigate('/contractor/detections')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <span>View Detection Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form */
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Construction Stage Name
              </label>
              <input
                type="text"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="e.g. Sub-base Compaction, Bitumen Top Layer"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Photograph Capture Date
              </label>
              <input
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Field Description & Chainage Reference
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Northbound carriageway Km 12/4 after roller compaction..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Road Surface Photograph <span className="text-rose-400">*</span>
            </label>
            <ImageUpload
              onFileSelect={(file) => setPhotoFile(file)}
              label="Select Road Pavement Image (Max 10MB)"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Scan className="w-4 h-4" />
              <span>{uploading ? 'Processing with YOLO AI Model...' : 'Upload Image & Run AI Scan'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default UploadRoadImages

