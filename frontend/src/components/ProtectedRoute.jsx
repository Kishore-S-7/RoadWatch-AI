import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, ShieldAlert } from 'lucide-react'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <ShieldCheck className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 font-mono text-sm tracking-wider uppercase text-slate-400 animate-pulse">
          Verifying Identity & Credentials...
        </p>
      </div>
    )
  }

  if (!isAuthenticated) {
    const loginTarget = allowedRoles && allowedRoles.includes('contractor') ? '/contractor/login' : '/admin/login'
    return <Navigate to={loginTarget} state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200 p-6">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
        <p className="mt-2 text-slate-400 max-w-md text-center">
          Your account role (<span className="text-amber-400 uppercase font-mono">{role}</span>) does not have authorization to view this interface.
        </p>
        <button
          onClick={() => {
            window.location.href = role === 'contractor' ? '/contractor/dashboard' : '/admin/dashboard'
          }}
          className="mt-6 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Return to My Dashboard
        </button>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
