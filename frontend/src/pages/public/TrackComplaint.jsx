import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { publicAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { Search, MapPin, AlertTriangle, Calendar, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export const TrackComplaint = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const refParam = searchParams.get('ref') || ''

  const [referenceNumber, setReferenceNumber] = useState(refParam)
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const doSearch = async (ref) => {
    if (!ref.trim()) {
      toast.error('Please enter a valid complaint reference number.')
      return
    }

    setLoading(true)
    setHasSearched(true)
    try {
      const res = await publicAPI.trackComplaint(ref.trim())
      setComplaint(res.data)
    } catch (err) {
      setComplaint(null)
      toast.error(err.response?.data?.detail || 'No complaint found with this reference number.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (refParam) {
      doSearch(refParam)
    }
  }, [refParam])

  const handleSubmit = (e) => {
    e.preventDefault()
    setSearchParams({ ref: referenceNumber.trim() })
    doSearch(referenceNumber)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-emerald-400" />
          <span>Track Road Complaint Status</span>
        </h1>
        <p className="text-xs text-slate-400">
          Enter your unique reference token (e.g. RW-2026-000101) to view review progress and engineer decisions.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
        <label className="block text-xs font-semibold uppercase font-mono text-slate-300">
          Complaint Reference Number
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
            placeholder="e.g. RW-2026-000101"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Track Status</span>
          </button>
        </div>
      </form>

      {/* Result Card */}
      {loading ? (
        <Loader message="Querying state grievance records..." />
      ) : complaint ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Reference Number</span>
              <span className="text-xl font-bold font-mono text-emerald-400 tracking-wider">
                {complaint.reference_number}
              </span>
            </div>
            <div>
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Road Location</span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{complaint.road_location}</span>
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Defect Category</span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 capitalize">
                {complaint.complaint_type}
              </p>
            </div>
          </div>

          {/* Rejection notice if rejected */}
          {complaint.status === 'rejected' && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1.5 text-rose-200">
              <div className="flex items-center space-x-2 text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Engineer Rejection Notice</h4>
              </div>
              <p className="text-xs leading-relaxed text-rose-300">
                {complaint.rejection_reason || 'This complaint could not be accepted for administrative repair.'}
              </p>
            </div>
          )}

          {/* Status Timeline Guide */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase font-mono text-slate-400">
              Resolution Pipeline
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-lg border ${
                ['pending', 'under_review', 'resolved'].includes(complaint.status)
                  ? 'bg-slate-800 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}>
                <p className="font-semibold">1. Lodged</p>
                <p className="text-[10px] opacity-75">Received</p>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                ['under_review', 'resolved'].includes(complaint.status)
                  ? 'bg-slate-800 text-purple-300 border-purple-500/30'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}>
                <p className="font-semibold">2. Under Review</p>
                <p className="text-[10px] opacity-75">Engineer Assessed</p>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                complaint.status === 'resolved'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : complaint.status === 'rejected'
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}>
                <p className="font-semibold">{complaint.status === 'rejected' ? '3. Rejected' : '3. Resolved'}</p>
                <p className="text-[10px] opacity-75">{complaint.status === 'resolved' ? 'Work Completed' : 'Closed'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : hasSearched ? (
        <EmptyState
          title="No Complaint Found"
          description={`No record exists matching reference number '${referenceNumber}'. Please check for typos.`}
        />
      ) : null}
    </div>
  )
}

export default TrackComplaint

