import React from 'react'

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null

  const s = String(status).toLowerCase().trim()

  let style = 'bg-slate-800 text-slate-300 border-slate-700'
  let label = status

  switch (s) {
    case 'verification_required':
      style = 'bg-rose-950/70 text-rose-300 border-rose-800/80 animate-pulse'
      label = 'Verification Required'
      break
    case 'matching':
    case 'verified':
      style = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
      label = 'Matching'
      break
    case 'completed':
      style = 'bg-blue-950/70 text-blue-300 border-blue-800/80'
      label = 'Completed'
      break
    case 'ongoing':
      style = 'bg-amber-950/70 text-amber-300 border-amber-800/80'
      label = 'Ongoing'
      break
    case 'planned':
      style = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80'
      label = 'Planned'
      break
    case 'pending':
      style = 'bg-amber-950/60 text-amber-300 border-amber-800/60'
      label = 'Pending'
      break
    case 'under_review':
      style = 'bg-purple-950/70 text-purple-300 border-purple-800/80'
      label = 'Under Review'
      break
    case 'resolved':
      style = 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
      label = 'Resolved'
      break
    case 'rejected':
      style = 'bg-slate-800 text-slate-400 border-slate-700'
      label = 'Rejected'
      break
    case 'active':
      style = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
      label = 'Active'
      break
    case 'inactive':
      style = 'bg-rose-950/60 text-rose-400 border-rose-800/60'
      label = 'Inactive'
      break
    case 'delayed':
      style = 'bg-rose-950/80 text-rose-200 border-rose-700 font-semibold'
      label = 'Delayed'
      break
    default:
      label = status
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {label}
    </span>
  )
}

export default StatusBadge

