import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, KeyRound } from 'lucide-react'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      addToast('Secure Admin clearance verified. Welcome to RoadWatch AI.', 'success')
      navigate(from, { replace: true })
    } catch (err) {
      let msg
      if (!err.response) {
        msg = 'Cannot connect to backend API at http://localhost:8000. Please ensure the backend server is running (run_backend.bat).'
      } else if (err.response.status === 401) {
        msg = err.response.data?.detail || 'Incorrect email or password. Use admin@roadwatch.com / Admin@123'
      } else {
        msg = err.response.data?.detail || `Authentication error (${err.response.status}). Please try again.`
      }
      setErrorMessage(msg)
      addToast(msg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreFill = () => {
    setEmail('admin@roadwatch.com')
    setPassword('Admin@123')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent pointer-events-none blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Emblem & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-2xl shadow-amber-500/10 mb-4 ring-1 ring-amber-500/20">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>RoadWatch</span>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500 text-slate-950 rounded">AI</span>
          </h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-slate-400 font-mono font-semibold">
            Government Road Work Transparency & Verification System
          </p>
        </div>

        {/* Login Box */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80">
            <div className="mb-6 pb-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Admin Clearance Portal</h3>
                <p className="text-xs text-slate-400">Sign in with authorized administrator credentials</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                256-BIT SSL
              </span>
            </div>

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@roadwatch.com"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                  Security Passkey
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Authorize Access</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Fill Pill */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center">
              <button
                type="button"
                onClick={handlePreFill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-slate-700/60 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Fill Default Admin Credentials</span>
              </button>
              <p className="mt-2 text-[11px] text-slate-400">
                Authorized for designated government audit personnel only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

