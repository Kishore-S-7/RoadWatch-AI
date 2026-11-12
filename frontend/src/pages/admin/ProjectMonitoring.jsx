import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { Activity, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const ProjectMonitoring = () => {
  const navigate = useNavigate()
  const [monitoringData, setMonitoringData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMonitoring = async () => {
    try {
      const res = await adminAPI.getMonitoringTable()
      setMonitoringData(res.data)
    } catch (err) {
      console.error('Failed to load monitoring table:', err)
      toast.error('Failed to load project monitoring metrics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoring()
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <span className="font-bold text-white block">{val}</span>
          {row.is_delayed && (
            <span className="text-[10px] text-rose-400 font-mono flex items-center gap-1 font-semibold">
              <ShieldAlert className="w-3 h-3" />
              <span>Timeline Delayed</span>
            </span>
          )}
        </div>
      )
    },
    {
      key: 'contractor_name',
      label: 'Contractor',
      render: (val, row) => (
        <div>
          <span className="text-slate-200 font-medium block">{val}</span>
          <span className="text-[10px] text-slate-400">{row.company_name}</span>
        </div>
      )
    },
    {
      key: 'reported_progress',
      label: 'Reported',
      render: (val) => (
        <span className="font-mono font-bold text-blue-400">{val}%</span>
      )
    },
    {
      key: 'calculated_progress',
      label: 'Calculated',
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400">{val}%</span>
      )
    },
    {
      key: 'difference',
      label: 'Gap (%)',
      render: (val, row) => {
        const gap = Number(val) || 0
        const isHigh = gap > 10
        return (
          <span className={`font-mono font-semibold ${isHigh ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            {gap}%
          </span>
        )
      }
    },
    {
      key: 'verification_status',
      label: 'Audit Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Dossier',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => navigate(`/admin/projects/${row.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
        >
          <span>Open Full View</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )
    }
  ]

  if (loading) return <Loader message="Compiling live construction monitoring matrix..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>State Road Work Monitoring Matrix</span>
          </h1>
          <p className="text-xs text-slate-400">
            Click any row to open the full project dossier including contractor records, photos, milestones, detections, and verification audit trail.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={monitoringData}
        searchKey="name"
        searchPlaceholder="Filter monitoring rows by project name..."
        rowKey="id"
        onRowClick={(row) => navigate(`/admin/projects/${row.id}`)}
      />
    </div>
  )
}

export default ProjectMonitoring

