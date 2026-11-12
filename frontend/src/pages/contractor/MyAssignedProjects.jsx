import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { contractorAPI } from '../../services/api'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { FolderGit2, Eye, ListOrdered, Camera, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export const MyAssignedProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await contractorAPI.listAssignedProjects()
        setProjects(res.data)
      } catch (err) {
        console.error('Failed to load assigned projects:', err)
        toast.error('Failed to load assigned projects.')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <Link
            to={`/contractor/projects/${row.id}`}
            className="font-bold text-white hover:text-emerald-400 transition-colors"
          >
            {val}
          </Link>
          <p className="text-[11px] text-slate-400">{row.road_location}, {row.district}</p>
        </div>
      )
    },
    {
      key: 'estimated_cost',
      label: 'Estimated Cost',
      render: (val) => (
        <span className="font-mono text-emerald-400 font-semibold">
          ₹{(Number(val) / 100000).toFixed(2)} Lakhs
        </span>
      )
    },
    {
      key: 'start_date',
      label: 'Start Date',
      render: (val) => <span className="font-mono text-slate-300">{val}</span>
    },
    {
      key: 'expected_end_date',
      label: 'Expected Completion',
      render: (val) => <span className="font-mono text-slate-300">{val}</span>
    },
    {
      key: 'reported_progress',
      label: 'Reported Progress',
      render: (val, row) => (
        <div className="w-28">
          <ProgressBar progress={val} size="sm" color="blue" />
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <Link
          to={`/contractor/projects/${row.id}`}
          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Project</span>
        </Link>
      )
    }
  ]

  if (loading) return <Loader message="Fetching your assigned contracts..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FolderGit2 className="w-6 h-6 text-emerald-400" />
          <span>My Assigned Road Projects</span>
        </h1>
        <p className="text-xs text-slate-400">
          Projects assigned to your contractor account for milestone updates, site photography, and progress reporting.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchKey="name"
        searchPlaceholder="Filter assigned projects by name..."
        rowKey="id"
      />
    </div>
  )
}

export default MyAssignedProjects

