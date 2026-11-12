import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { FolderKanban, Plus, Eye, Trash2, Edit, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export const ManageProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    try {
      const res = await adminAPI.listProjects()
      setProjects(res.data)
    } catch (err) {
      console.error('Failed to load projects:', err)
      toast.error('Failed to load road projects.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleDelete = async (id, name, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to permanently delete project "${name}" and all associated data?`)) {
      return
    }

    try {
      await adminAPI.deleteProject(id)
      toast.success(`Project "${name}" deleted.`)
      setProjects(projects.filter((p) => p.id !== id))
    } catch (err) {
      toast.error('Failed to delete project.')
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Project Name',
      render: (val, row) => (
        <div>
          <Link
            to={`/admin/projects/${row.id}`}
            className="font-bold text-white hover:text-emerald-400 transition-colors"
          >
            {val}
          </Link>
          <p className="text-[11px] text-slate-400">{row.road_location}, {row.district}</p>
        </div>
      )
    },
    {
      key: 'contractor_name',
      label: 'Contractor',
      render: (val, row) => (
        <span className="text-slate-300 font-medium">
          {val || <span className="text-slate-500 italic">Unassigned</span>}
        </span>
      )
    },
    {
      key: 'estimated_cost',
      label: 'Budget',
      render: (val) => (
        <span className="font-mono text-emerald-400">
          ₹{(Number(val) / 100000).toFixed(2)} L
        </span>
      )
    },
    {
      key: 'calculated_progress',
      label: 'Verified Progress',
      render: (val, row) => (
        <div className="w-28">
          <ProgressBar progress={val} size="sm" color={row.status === 'completed' ? 'blue' : 'emerald'} />
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'verification_status',
      label: 'Audit Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/admin/projects/${row.id}`}
            className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
            title="View Full Dossier"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => handleDelete(row.id, row.name, e)}
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ]

  if (loading) return <Loader message="Fetching state road projects..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-emerald-400" />
            <span>Manage Road Projects</span>
          </h1>
          <p className="text-xs text-slate-400">
            Catalog of all highway, municipal, and regional road infrastructure works.
          </p>
        </div>
        <Link
          to="/admin/projects/new"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchKey="name"
        searchPlaceholder="Search projects by name or location..."
        rowKey="id"
      />
    </div>
  )
}

export default ManageProjects

