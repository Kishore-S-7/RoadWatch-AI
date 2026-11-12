import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { FileSpreadsheet, Download, FileText, CheckCircle2, AlertTriangle, ScanEye, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

export const Reports = () => {
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchReports = async () => {
    try {
      const res = await adminAPI.getReports('json')
      setReports(res.data)
    } catch (err) {
      console.error('Failed to load reports summary:', err)
      toast.error('Failed to load report data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleDownloadCSV = async () => {
    setExporting(true)
    try {
      const res = await adminAPI.getReports('csv')
      // Create blob download
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `roadwatch_executive_report_${new Date().toISOString().substring(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('CSV Report downloaded successfully!')
    } catch (err) {
      toast.error('Failed to export CSV report.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <Loader message="Compiling executive administrative reports..." />
  if (!reports) return <EmptyState title="Reports Unavailable" description="Could not load summary metrics." />

  const { project_summary, verification_summary, complaint_summary, defect_summary } = reports

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>State Infrastructure & Audit Reports</span>
          </h1>
          <p className="text-xs text-slate-400">
            Consolidated project status, verification audits, citizen grievances, and AI defect summaries.
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          disabled={exporting}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{exporting ? 'Exporting...' : 'Export Consolidated CSV'}</span>
        </button>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Audited Road Works</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">{project_summary.length} Projects</p>
          <p className="text-[11px] text-slate-400">Total sanctioned civil infrastructure works</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Verification Discrepancies</span>
          <p className="text-2xl font-bold font-mono text-amber-400">{verification_summary.length} Alerts</p>
          <p className="text-[11px] text-slate-400">Gaps exceeding project audit limits</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Citizen Grievances</span>
          <p className="text-2xl font-bold font-mono text-purple-400">{complaint_summary.length} Lodged</p>
          <p className="text-[11px] text-slate-400">Public reported road damages & potholes</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">AI Detected Defects</span>
          <p className="text-2xl font-bold font-mono text-blue-400">{defect_summary.total_defects_detected} Defects</p>
          <p className="text-[11px] text-slate-400">
            {defect_summary.total_cracks_detected} Cracks &bull; {defect_summary.total_potholes_detected} Potholes
          </p>
        </div>
      </div>

      {/* Projects Table Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Road Projects Portfolio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-400 uppercase font-mono border-b border-slate-700">
              <tr>
                <th className="px-3 py-2.5">Project</th>
                <th className="px-3 py-2.5">District</th>
                <th className="px-3 py-2.5">Contractor</th>
                <th className="px-3 py-2.5">Reported</th>
                <th className="px-3 py-2.5">Calculated</th>
                <th className="px-3 py-2.5">Gap</th>
                <th className="px-3 py-2.5">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {project_summary.map((p) => (
                <tr key={p.project_id}>
                  <td className="px-3 py-2.5 font-bold text-white">{p.name}</td>
                  <td className="px-3 py-2.5">{p.district}</td>
                  <td className="px-3 py-2.5">{p.contractor}</td>
                  <td className="px-3 py-2.5 font-mono text-blue-400">{p.reported_progress}%</td>
                  <td className="px-3 py-2.5 font-mono text-emerald-400">{p.calculated_progress}%</td>
                  <td className="px-3 py-2.5 font-mono text-rose-400">{p.difference}%</td>
                  <td className="px-3 py-2.5 font-mono capitalize">{p.verification_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports

