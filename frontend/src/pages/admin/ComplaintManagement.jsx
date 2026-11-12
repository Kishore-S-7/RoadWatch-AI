import React, { useState, useEffect } from 'react'
import { adminAPI, formatImageUrl } from '../../services/api'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { MessageSquareWarning, Search, CheckCircle2, XCircle, Clock, Eye, X } from 'lucide-react'
import toast from 'react-hot-toast'

export const ComplaintManagement = () => {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [newStatus, setNewStatus] = useState('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)

  const fetchComplaints = async () => {
    try {
      const res = await adminAPI.listComplaints()
      setComplaints(res.data)
    } catch (err) {
      console.error('Failed to load complaints:', err)
      toast.error('Failed to load citizen complaints.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComplaints()
  }, [])

  const handleOpenModal = (complaint) => {
    setSelectedComplaint(complaint)
    setNewStatus(complaint.status)
    setRejectionReason(complaint.rejection_reason || '')
  }

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    if (!selectedComplaint) return

    if (newStatus === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      toast.error('Rejection reason is mandatory when status is set to Rejected.')
      return
    }

    setSavingStatus(true)
    try {
      await adminAPI.updateComplaintStatus(selectedComplaint.id, {
        status: newStatus,
        rejection_reason: newStatus === 'rejected' ? rejectionReason.trim() : null
      })
      toast.success('Complaint status updated successfully!')
      setSelectedComplaint(null)
      fetchComplaints()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status.')
    } finally {
      setSavingStatus(false)
    }
  }

  const columns = [
    {
      key: 'reference_number',
      label: 'Reference ID',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-emerald-400 block">{val}</span>
          <span className="text-[10px] text-slate-400">{row.created_at?.substring(0, 10)}</span>
        </div>
      )
    },
    {
      key: 'citizen_name',
      label: 'Citizen & Contact',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-200 block">{val}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.email_or_phone}</span>
        </div>
      )
    },
    {
      key: 'road_location',
      label: 'Road Location',
      render: (val, row) => (
        <div>
          <span className="text-slate-200 block">{val}</span>
          <span className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
            {row.complaint_type}
          </span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Grievance Description',
      render: (val) => (
        <p className="text-xs text-slate-400 line-clamp-2 max-w-xs">{val}</p>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Review',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => handleOpenModal(row)}
          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
        >
          Review & Triage
        </button>
      )
    }
  ]

  if (loading) return <Loader message="Fetching citizen road grievances..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquareWarning className="w-6 h-6 text-purple-400" />
          <span>Citizen Road Complaint Management</span>
        </h1>
        <p className="text-xs text-slate-400">
          Review lodged road defects, assess photo evidence, and update pipeline status with engineer justifications.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={complaints}
        searchKey="reference_number"
        searchPlaceholder="Filter by reference number, location, or citizen..."
        rowKey="id"
      />

      {/* Review Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Grievance Review</span>
                <h3 className="text-base font-bold text-emerald-400 font-mono">{selectedComplaint.reference_number}</h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-300"><strong>Citizen:</strong> {selectedComplaint.citizen_name} ({selectedComplaint.email_or_phone})</p>
                <p className="text-slate-300"><strong>Location:</strong> {selectedComplaint.road_location}</p>
                <p className="text-slate-300"><strong>Defect Type:</strong> <span className="capitalize">{selectedComplaint.complaint_type}</span></p>
                <p className="text-slate-400 pt-1 border-t border-slate-800/60 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.photo_path && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={formatImageUrl(selectedComplaint.photo_path)}
                    alt="Complaint Evidence"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Update Complaint Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                >
                  <option value="pending">Pending Review</option>
                  <option value="under_review">Under Review (Assigned to Field Engineer)</option>
                  <option value="resolved">Resolved (Patching / Construction Completed)</option>
                  <option value="rejected">Rejected (Requires Valid Official Reason)</option>
                </select>
              </div>

              {newStatus === 'rejected' && (
                <div>
                  <label className="block text-xs font-medium text-rose-300 mb-1">
                    Rejection Reason <span className="text-rose-400">* (Mandatory for rejection)</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="State reason: e.g. private layout, outside highway limits, duplicate report..."
                    className="w-full px-3 py-2 bg-slate-800 border border-rose-800 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  {savingStatus ? 'Updating...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplaintManagement

