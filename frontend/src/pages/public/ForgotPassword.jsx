import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { KeyRound, ArrowLeft, CheckCircle2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export const ForgotPassword = () => {
  const [searchParams] = useSearchParams()
  const tokenParam = searchParams.get('token') || ''

  const [email, setEmail] = useState('')
  const [token, setToken] = useState(tokenParam)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetGenerated, setResetGenerated] = useState(null)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleRequestToken = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword({ email: email.trim() })
      setResetGenerated(res.data.reset_token || 'TOKEN_LOGGED_TO_BACKEND_CONSOLE')
      if (res.data.reset_token) {
        setToken(res.data.reset_token)
      }
      toast.success('Reset token generated! (Logged in backend console)')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to request reset token.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await authAPI.resetPassword({ token: token.trim(), new_password: newPassword })
      setResetSuccess(true)
      toast.success('Password updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid or expired reset token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Password Recovery</h1>
          <p className="text-xs text-slate-400">
            Generate dev reset token or update your account password
          </p>
        </div>

        {resetSuccess ? (
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Password Reset Complete</h2>
            <p className="text-xs text-slate-400">
              Your password has been securely updated. You can now sign in with your new credentials.
            </p>
            <Link
              to="/login"
              className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              Go to Login
            </Link>
          </div>
        ) : !token ? (
          /* Step 1: Request Token */
          <form onSubmit={handleRequestToken} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Enter your registered official email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@roadwatch.com"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {loading ? 'Generating Token...' : 'Generate Reset Token'}
            </button>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <strong>Dev Mode Notice:</strong> In development, the reset link and token are logged to the backend console.
            </div>
          </form>
        ) : (
          /* Step 2: Set New Password */
          <form onSubmit={handleResetPassword} className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reset Token
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Token string..."
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Password (Min 6 characters)
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              {loading ? 'Updating Password...' : 'Confirm New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword

