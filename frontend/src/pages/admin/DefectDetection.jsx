import React, { useState, useEffect } from 'react'
import { adminAPI, formatImageUrl } from '../../services/api'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { ScanEye, Calendar, CheckCircle2, ShieldAlert, Layers } from 'lucide-react'

export const DefectDetection = () => {
  const [detections, setDetections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDetection, setSelectedDetection] = useState(null)

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const res = await adminAPI.listDetections()
        setDetections(res.data)
        if (res.data.length > 0) setSelectedDetection(res.data[0])
      } catch (err) {
        console.error('Failed to load detections:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDetections()
  }, [])

  if (loading) return <Loader message="Loading AI defect analysis stream..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ScanEye className="w-6 h-6 text-emerald-400" />
          <span>AI Defect Detection Results (YOLOv8 & OpenCV)</span>
        </h1>
        <p className="text-xs text-slate-400">
          Surface distress scanning results across highway and road construction stages.
        </p>
      </div>

      {detections.length === 0 ? (
        <EmptyState title="No Scans Available" description="Upload site photographs to trigger automated crack and pothole inference." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scans List Column */}
          <div className="space-y-3 lg:col-span-1 max-h-[750px] overflow-y-auto pr-1">
            {detections.map((det) => (
              <div
                key={det.id}
                onClick={() => setSelectedDetection(det)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDetection?.id === det.id
                    ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-950'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate">{det.project_name || 'Road Project'}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 font-mono text-[10px] text-emerald-400 font-semibold shrink-0">
                    {det.total_defects} Defects
                  </span>
                </div>

                <div className="flex items-center text-[10px] text-slate-400 gap-1.5 mt-1 font-mono">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{det.created_at?.substring(0, 10)}</span>
                  <span>&bull;</span>
                  <span className="text-amber-400 font-semibold">{det.crack_count || 0} Cracks</span>
                  <span>&bull;</span>
                  <span className="text-rose-400 font-semibold">{det.pothole_count || 0} Potholes</span>
                </div>
              </div>
            ))}
          </div>

          {/* Side-by-Side Detailed Preview Column */}
          {selectedDetection && (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Project Associated</span>
                  <h3 className="text-lg font-bold text-white">{selectedDetection.project_name}</h3>
                </div>
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800">
                    Cracks: {selectedDetection.crack_count || 0}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800">
                    Potholes: {selectedDetection.pothole_count || 0}
                  </span>
                </div>
              </div>

              {/* Side by side images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Photo */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase font-mono text-slate-400 block">
                    1. Original Field Photograph
                  </span>
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={formatImageUrl(selectedDetection.image?.original_path)}
                      alt="Original"
                      className="w-full h-64 object-contain"
                    />
                  </div>
                </div>

                {/* YOLO Annotated Photo */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase font-mono text-emerald-400 block">
                    2. YOLO Bounding Box Overlay
                  </span>
                  <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-950">
                    <img
                      src={formatImageUrl(selectedDetection.image?.annotated_path)}
                      alt="Annotated"
                      className="w-full h-64 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Defects breakdown table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Individual Detected Anomalies Breakdown
                </h4>
                {(!selectedDetection.detections || selectedDetection.detections.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No defects identified by the AI model on this road surface.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-800 text-slate-400 uppercase">
                        <tr>
                          <th className="px-3 py-2">Defect Type</th>
                          <th className="px-3 py-2">Confidence Score</th>
                          <th className="px-3 py-2">Bounding Box [x1, y1, x2, y2]</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {selectedDetection.detections.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-bold text-white capitalize">{item.label}</td>
                            <td className="px-3 py-2 text-emerald-400">{(item.confidence * 100).toFixed(1)}%</td>
                            <td className="px-3 py-2 text-slate-400">[{item.bbox?.map(c => Math.round(c)).join(', ')}]</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DefectDetection

