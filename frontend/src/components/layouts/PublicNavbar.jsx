import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Menu, X, Lock, HardHat, UserPlus, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, role, logout } = useAuth()

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Search Projects', path: '/projects' },
    { label: 'Track Progress', path: '/track-progress' },
    { label: 'Submit Complaint', path: '/submit-complaint' },
    { label: 'Track Complaint', path: '/track-complaint' }
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                RoadWatch <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5 tracking-wide">
                Govt Road Work Transparency & Verification System
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Login Portals / Auth Actions */}
          <div className="hidden sm:flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                {role === 'contractor' && (
                  <Link
                    to="/contractor/dashboard"
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Contractor Portal</span>
                  </Link>
                )}
                {role === 'citizen' && (
                  <span className="text-xs text-slate-300 px-2 py-1 bg-slate-800 rounded-lg border border-slate-700">
                    Citizen: <span className="text-emerald-400 font-medium">{user?.email}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 rounded-lg text-xs transition-colors border border-slate-700"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/register"
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
                <Link
                  to="/admin/login"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Login</span>
                </Link>
                <Link
                  to="/contractor/login"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Contractor Portal</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                isActive(link.path)
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {role === 'admin' && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 rounded-lg text-xs font-medium text-slate-200"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                {role === 'contractor' && (
                  <Link
                    to="/contractor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                  >
                    <HardHat className="w-3.5 h-3.5" />
                    <span>Contractor Portal</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logout()
                  }}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-rose-950/40 text-rose-300 border border-rose-900/40 rounded-lg text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New Account</span>
                </Link>
                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 rounded-lg text-xs font-medium text-slate-200"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Portal Login</span>
                </Link>
                <Link
                  to="/contractor/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  <HardHat className="w-3.5 h-3.5" />
                  <span>Contractor Portal Login</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

export default PublicNavbar
