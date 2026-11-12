import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderGit2,
  ListOrdered,
  Camera,
  Scan,
  Send,
  Scale,
  MessageSquareShare,
  LogOut,
  HardHat
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const ContractorSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation()
  const { logout, user } = useAuth()

  const links = [
    { label: 'Contractor Dashboard', path: '/contractor/dashboard', icon: LayoutDashboard },
    { label: 'My Assigned Projects', path: '/contractor/projects', icon: FolderGit2 },
    { label: 'Update Milestones', path: '/contractor/milestones', icon: ListOrdered },
    { label: 'Upload Road Photos', path: '/contractor/upload', icon: Camera },
    { label: 'AI Detection Results', path: '/contractor/detections', icon: Scan },
    { label: 'Submit Progress Report', path: '/contractor/progress-report', icon: Send },
    { label: 'Verification Status', path: '/contractor/verification-status', icon: Scale },
    { label: 'Submit Clarification', path: '/contractor/clarifications', icon: MessageSquareShare }
  ]

  const isActive = (path) => {
    if (path === '/contractor/projects') {
      return location.pathname === '/contractor/projects'
    }
    return location.pathname === path || (path !== '/contractor/dashboard' && location.pathname.startsWith(path))
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <Link to="/contractor/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">RoadWatch AI</span>
              <span className="text-[10px] text-emerald-400 font-mono block -mt-0.5 uppercase tracking-wider font-semibold">
                Contractor Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const active = isActive(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User bar & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.email}</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Role: Assigned Contractor</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default ContractorSidebar

