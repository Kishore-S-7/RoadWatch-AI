import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  ScanSearch, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle, 
  Sliders, 
  Clock, 
  ImageIcon, 
  Eye, 
  Download,
  ShieldCheck,
  Tag
} from 'lucide-react'
import { projectsAPI, detectionAPI, formatImageUrl } from '../services/api'
import { useToast } from '../components/Toast'

export const Detection = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') || '')
  const [confidence, setConfidence] = useState(0.25)
  const [pastDetections, setPastDetections] = useState([])

  // Upload & Inference State
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isInferencing, setIsInferencing] = useState(false)
  const [inferenceResult, setInferenceResult] = useState(null)
  const [activeTab, setActiveTab] = useState('sideBySide') // 'sideBySide' | 'annotated' | 'original'

  const fileInputRef = useRef(null)
  const { addToast } = useToast()

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await projectsAPI.list()
        setProjects(res.data)
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(res.data[0].id)
        }
      } catch (err) {
        addToast('Failed to load project directory', 'error')
      }
    }
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      setSearchParams({ project: selectedProjectId })
      fetchPastDetections(selectedProjectId)
      // reset current scan view when changing project
      setInferenceResult(null)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }, [selectedProjectId])

  const fetchPastDetections = async (pid) => {
    try {
      const res = await detectionAPI.listByProject(pid)
      setPastDetections(res.data)
    } catch (err) {
      // background fetch
    }
  }

  const handleFileSelect = (file) => {
    if (!file) return

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!validTypes.includes(file.type)) {
      addToast('Invalid file format. Only JPG, JPEG, and PNG images are supported.', 'error')
      return
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      addToast('File exceeds maximum size of 10 MB.', 'error')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setInferenceResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleRunInference = async () => {
    if (!selectedFile || !selectedProjectId) {
      addToast('Please select a project and upload a road image.', 'error')
      return
    }

    setIsInferencing(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const res = await detectionAPI.uploadImage(selectedProjectId, formData, confidence)
      setInferenceResult(res.data)
      addToast(`Inference complete! ${res.data.detection.total_defects} road defects detected.`, 'success')
      fetchPastDetections(selectedProjectId)
    } catch (err) {
      addToast('Inference error: ' + (err.response?.data?.detail || err.message), 'error')
    } finally {
      setIsInferencing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Road Defect Detection</span>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500 text-slate-950 rounded">YOLOv8</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous computer vision pipeline for detecting structural cracks and potholes on road surfaces.
          </p>
        </div>

        {/* Project Selector */}
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

      {/* Upload & Settings Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Drag & Drop Upload Zone (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all
              ${selectedFile 
                ? 'border-amber-500/50 bg-amber-500/5' 
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
              }
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept="image/jpeg,image/png,image/jpg"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3 shadow-lg shadow-amber-500/10">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div>
                <span className="text-sm font-semibold text-white font-mono">{selectedFile.name}</span>
                <p className="text-xs text-slate-400 mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Neural Analysis
                </p>
                <span className="inline-block mt-2 text-[11px] text-amber-400 hover:underline">
                  Click or drag to replace image
                </span>
              </div>
            ) : (
              <div>
                <span className="text-sm font-semibold text-white">
                  Drop high-resolution road photograph here, or click to browse
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, JPEG, and PNG formats (up to 10 MB). Captures asphalt surface condition.
                </p>
              </div>
            )}
          </div>

          {/* Action Button & Threshold Setting */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-slate-200">
                  Confidence Threshold: <span className="font-mono text-amber-400">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-48 accent-amber-500 mt-1"
                />
              </div>
            </div>

            <button
              onClick={handleRunInference}
              disabled={!selectedFile || isInferencing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isInferencing ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  <span>Running Neural Inference...</span>
                </>
              ) : (
                <>
                  <ScanSearch className="w-4 h-4" />
                  <span>Execute Defect Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Defect Metrics & AI Status Card */}
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspection Telemetry</span>
            </h3>

            {inferenceResult ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-mono">Total Defects Found</span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                    {inferenceResult.detection.total_defects}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 uppercase font-mono mb-2 block">Defect Breakdown</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    {Object.entries(inferenceResult.defect_counts || {}).map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-slate-300 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            label.toLowerCase().includes('pothole') ? 'bg-red-500' : 'bg-amber-500'
                          }`}></span>
                          {label}
                        </span>
                        <span className="font-bold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                <ScanSearch className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p>Upload a surface photograph and click "Execute Defect Scan" to review AI bounding box detections.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Inspection Viewport: Side-by-Side Comparison */}
      {(previewUrl || inferenceResult) && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 mb-5 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Defect Visual Inspection
              </h3>
              <p className="text-xs text-slate-400">
                Side-by-side comparison between raw road photograph and YOLO annotated bounding boxes.
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('sideBySide')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'sideBySide' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setActiveTab('annotated')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'annotated' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Annotated
              </button>
              <button
                onClick={() => setActiveTab('original')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'original' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                Original
              </button>
            </div>
          </div>

          {/* Images Display */}
          <div className={`grid gap-6 ${
            activeTab === 'sideBySide' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* Original Image */}
            {(activeTab === 'sideBySide' || activeTab === 'original') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span>RAW PHOTOGRAPH</span>
                  <span>UNPROCESSED</span>
                </div>
                <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center">
                  <img
                    src={inferenceResult ? formatImageUrl(inferenceResult.image.original_url) : previewUrl}
                    alt="Original Road"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Annotated Image */}
            {(activeTab === 'sideBySide' || activeTab === 'annotated') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-amber-400 px-1 font-semibold">
                  <span>YOLO ANNOTATED DEFECTS</span>
                  <span>BOUNDING BOXES & CONFIDENCE</span>
                </div>
                <div className="bg-slate-950 rounded-xl overflow-hidden border border-amber-500/30 aspect-video flex items-center justify-center relative">
                  {isInferencing ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-3"></div>
                      <span className="text-xs font-mono text-slate-300 animate-pulse">Running Neural Inference...</span>
                    </div>
                  ) : inferenceResult ? (
                    <img
                      src={formatImageUrl(inferenceResult.image.annotated_url)}
                      alt="Annotated Defects"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs font-mono">
                      Click "Execute Defect Scan" to generate annotated visual
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Detections Breakdown Table */}
          {inferenceResult && inferenceResult.detection.detections.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
                Detected Defect Coordinates & Confidence Breakdown
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Defect Class</th>
                      <th className="py-2.5 px-3 text-center">Confidence Score</th>
                      <th className="py-2.5 px-3 text-right">Bounding Box [X1, Y1, X2, Y2]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inferenceResult.detection.detections.map((det, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1.5 font-bold ${
                            det.label.toLowerCase().includes('pothole') ? 'text-red-400' : 'text-amber-400'
                          }`}>
                            <Tag className="w-3 h-3" />
                            {det.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-200 font-bold">
                          {(det.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400 text-[11px]">
                          [{det.bbox.join(', ')}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Detections Gallery for Selected Project */}
      {pastDetections.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Project Scan History ({pastDetections.length} recorded scans)</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {pastDetections.map((det) => (
              <div 
                key={det.id}
                onClick={() => {
                  if (det.image) {
                    setInferenceResult({
                      detection: det,
                      image: det.image,
                      defect_counts: {}
                    })
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }
                }}
                className="group relative rounded-lg overflow-hidden border border-slate-800 hover:border-amber-500/40 bg-slate-950 cursor-pointer transition-all aspect-video"
              >
                {det.image?.annotated_url ? (
                  <img
                    src={formatImageUrl(det.image.annotated_url)}
                    alt="Past Detection"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Scan {det.id.substring(0, 4)}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    {det.total_defects} defects
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

