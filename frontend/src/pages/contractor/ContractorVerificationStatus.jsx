import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { Scale, ArrowRight, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export const ContractorVerificationStatus = () => {
  const [statusList, setStatusList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await contractorAPI.getVerificationStatus()
        setStatusList(res.data)
      } catch (err) {
        console.error('Failed to load verification status:', err)
        toast.error('Failed to load verification records.')
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
  }, [])

  const columns = [
    {
      key: 'project_name',
      label: 'Assigned Project',
      render: (val, row) => (
        <span className="font-bold text-white block">{val}</span>
      )
    },
    {
      key: 'reported_progress',
      label: 'Reported Progress',
      render: (val) => (
        <span className="font-mono font-bold text-blue-400">{val}%</span>
      )
    },
    {
      key: 'calculated_progress',
      label: 'Milestone Progress',
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400">{val}%</span>
      )
    },
    {
      key: 'difference',
      label: 'Discrepancy Gap',
      render: (val, row) => {
        const gap = Number(val) || 0
        const isAlert = gap > (row.threshold || 10)
        return (
          <span className={`font-mono font-bold ${isAlert ? 'text-rose-400' : 'text-slate-300'}`}>
            {gap}%
          </span>
        )
      }
    },
    {
      key: 'threshold',
      label: 'Audit Limit',
      render: (val) => (
        <span className="font-mono text-slate-400">±{val}%</span>
      )
    },
    {
      key: 'verification_status',
      label: 'Audit Verdict',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Action',
      sortable: false,
      render: (_, row) => {
        if (row.verification_status === 'verification_required') {
          return (
            <Link
              to="/contractor/clarifications"
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 rounded-lg text-xs font-semibold border border-amber-800 transition-colors"
            >
              <span>Submit Clarification</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )
        }
        return (
          <Link
            to={`/contractor/projects/${row.project_id}`}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            View Dossier
          </Link>
        )
      }
    }
  ]

  if (loading) return <Loader message="Compiling contract verification audits..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Scale className="w-6 h-6 text-emerald-400" />
          <span>Contractor Verification Status Matrix</span>
        </h1>
        <p className="text-xs text-slate-400">
          Supervisory quality and progress audit results for your assigned road contracts.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={statusList}
        searchKey="project_name"
        searchPlaceholder="Filter by project title..."
        rowKey="project_id"
      />
    </div>
  )
}

export default ContractorVerificationStatus

