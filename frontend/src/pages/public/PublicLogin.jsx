import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Lock, HardHat, ArrowRight, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export const PublicLogin = ({ initialRole = null }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, isAuthenticated, role } = useAuth()

  // Determine active portal tab based on path or prop
  const isContractorPath = location.pathname.includes('/contractor') || initialRole === 'contractor'
  const [activeTab, setActiveTab] = useState(isContractorPath ? 'contractor' : 'admin')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'contractor') navigate('/contractor/dashboard', { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'admin') {
      setEmail('admin@roadwatch.com')
      setPassword('Admin@123')
    } else {
      setEmail('abc@roadwatch.com')
      setPassword('Contractor@123')
    }
  }

  // Set default credentials on mount for ease of demo
  useEffect(() => {
    if (activeTab === 'admin') {
      setEmail('admin@roadwatch.com')
      setPassword('Admin@123')
    } else {
      setEmail('abc@roadwatch.com')
      setPassword('Contractor@123')
    }
  }, [activeTab])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userData = await login(email, password)
      toast.success(`Welcome back, ${userData.email}!`)

      if (userData.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (userData.role === 'contractor') {
        navigate('/contractor/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      console.error('Login error:', err)
      if (!err.response) {
        toast.error('Cannot connect to backend server. Please verify backend is running on port 8000.')
      } else {
        toast.error(err.response?.data?.detail || 'Authentication failed. Please check credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            {activeTab === 'contractor' ? <HardHat className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {activeTab === 'contractor' ? 'Contractor Portal Login' : 'Administrative Clearance Login'}
          </h1>
          <p className="text-xs text-slate-400">
            Government Road Work Transparency & Verification System
          </p>
        </div>

        {/* Portal Role Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabChange('admin')}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Administrator</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('contractor')}
            className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'contractor'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Contractor</span>
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5 shadow-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Registered Official Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@roadwatch.com"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{loading ? 'Authenticating...' : `Log In to ${activeTab === 'contractor' ? 'Contractor' : 'Admin'} Portal`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Quick Demo Credentials Info */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Test Credentials:</span>
            {activeTab === 'admin' ? (
              <p>Email: <span className="font-mono text-emerald-400">admin@roadwatch.com</span> | Password: <span className="font-mono text-emerald-400">Admin@123</span></p>
            ) : (
              <p>Email: <span className="font-mono text-emerald-400">abc@roadwatch.com</span> | Password: <span className="font-mono text-emerald-400">Contractor@123</span></p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default PublicLogin

