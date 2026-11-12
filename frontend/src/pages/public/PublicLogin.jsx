import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Shield, Lock, HardHat, User, UserPlus, ArrowRight, Building2, Phone, Mail, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const PublicLogin = ({ initialRole = null, defaultMode = 'signin' }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, register, isAuthenticated, role } = useAuth()

  // Detect mode from query param or prop (?mode=register or /register)
  const queryParams = new URLSearchParams(location.search)
  const isRegisterParam = queryParams.get('mode') === 'register' || location.pathname === '/register' || defaultMode === 'register'
  
  const [mode, setMode] = useState(isRegisterParam ? 'register' : 'signin')

  // In signin mode: 'admin' | 'contractor'
  const isContractorPath = location.pathname.includes('/contractor') || initialRole === 'contractor'
  const [activeTab, setActiveTab] = useState(isContractorPath ? 'contractor' : 'admin')

  // Signin fields
  const [loginEmail, setLoginEmail] = useState('admin@roadwatch.com')
  const [loginPassword, setLoginPassword] = useState('Admin@123')

  // Register fields
  const [regRole, setRegRole] = useState('citizen') // 'citizen' | 'contractor'
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regCompany, setRegCompany] = useState('')
  const [regPhone, setRegPhone] = useState('')

  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'contractor') navigate('/contractor/dashboard', { replace: true })
      else navigate('/projects', { replace: true })
    }
  }, [isAuthenticated, role, navigate])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'admin') {
      setLoginEmail('admin@roadwatch.com')
      setLoginPassword('Admin@123')
    } else {
      setLoginEmail('abc@roadwatch.com')
      setLoginPassword('Contractor@123')
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userData = await login(loginEmail, loginPassword)
      toast.success(`Welcome back, ${userData.email}!`)

      if (userData.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (userData.role === 'contractor') {
        navigate('/contractor/dashboard', { replace: true })
      } else {
        navigate('/projects', { replace: true })
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()

    if (!regEmail.trim()) {
      toast.error('Please enter a valid email address.')
      return
    }

    if (regPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (regRole === 'contractor' && !regCompany.trim()) {
      toast.error('Please enter your Contracting Company or Agency name.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: regName.trim() || undefined,
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: regRole,
        company_name: regRole === 'contractor' ? regCompany.trim() : undefined,
        phone: regRole === 'contractor' ? regPhone.trim() : undefined
      }

      const userData = await register(payload)
      toast.success(`Account registered successfully! Welcome ${userData.email}`)

      if (userData.role === 'contractor') {
        navigate('/contractor/dashboard', { replace: true })
      } else if (userData.role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/projects', { replace: true })
      }
    } catch (err) {
      console.error('Registration error:', err)
      if (!err.response) {
        toast.error('Cannot connect to backend server. Please verify backend is running on port 8000.')
      } else {
        toast.error(err.response?.data?.detail || 'Registration failed. Please check details.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            {mode === 'register' ? (
              <UserPlus className="w-6 h-6" />
            ) : activeTab === 'contractor' ? (
              <HardHat className="w-6 h-6" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'register'
              ? 'Create New Account'
              : activeTab === 'contractor'
              ? 'Contractor Portal Login'
              : 'Administrative Clearance Login'}
          </h1>
          <p className="text-xs text-slate-400">
            RoadWatch AI • Government Road Work Transparency & Verification System
          </p>
        </div>

        {/* Mode Switcher: Sign In vs Register */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signin'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New User Sign Up</span>
          </button>
        </div>

        {/* ==================== SIGN IN MODE ==================== */}
        {mode === 'signin' && (
          <div className="space-y-4">
            {/* Portal Role Switcher Tabs */}
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
            <form onSubmit={handleLoginSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5 shadow-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. name@roadwatch.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <span className="font-semibold text-slate-300 block">Quick Demo Credentials:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('admin')}
                    className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 transition-colors"
                  >
                    <div className="font-semibold text-emerald-400 text-[11px]">Admin Demo</div>
                    <div className="text-[10px] text-slate-400 truncate">admin@roadwatch.com</div>
                    <div className="text-[10px] text-slate-500">Admin@123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('contractor')}
                    className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 transition-colors"
                  >
                    <div className="font-semibold text-amber-400 text-[11px]">Contractor Demo</div>
                    <div className="text-[10px] text-slate-400 truncate">abc@roadwatch.com</div>
                    <div className="text-[10px] text-slate-500">Contractor@123</div>
                  </button>
                </div>
              </div>
            </form>

            <div className="text-center text-xs text-slate-400">
              Need a new account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Sign up as Citizen or Contractor
              </button>
            </div>
          </div>
        )}

        {/* ==================== REGISTER MODE ==================== */}
        {mode === 'register' && (
          <div className="space-y-4">
            {/* Account Role Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Select Account Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole('citizen')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'citizen'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold">Citizen / Public</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Monitor projects, lodge road defects, and track grievances
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('contractor')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    regRole === 'contractor'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <HardHat className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold">Contractor</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Update milestones, upload road images, and file progress
                  </p>
                </button>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegisterSubmit} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name / Contact Person
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Contractor Extra Fields */}
              {regRole === 'contractor' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Company / Agency Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={regCompany}
                        onChange={(e) => setRegCompany(e.target.value)}
                        placeholder="e.g. Apex Road Infrastructure Ltd"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Official Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password (min 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-2"
              >
                <span>{loading ? 'Creating Account...' : `Register as ${regRole === 'contractor' ? 'Contractor' : 'Citizen'}`}</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-center text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-emerald-400 font-semibold hover:underline"
              >
                Sign in to your account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicLogin
