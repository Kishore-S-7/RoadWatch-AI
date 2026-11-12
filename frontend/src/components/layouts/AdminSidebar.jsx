import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderPlus,
  FolderKanban,
  Users,
  UserCheck,
  Activity,
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  MessageSquareWarning,
  FileSpreadsheet,
  LogOut,
  ShieldAlert
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const AdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  const location = useLocation()
  const { logout, user } = useAuth()

  const links = [
    { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Add Road Project', path: '/admin/projects/new', icon: FolderPlus },
    { label: 'Manage Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Contractor Directory', path: '/admin/contractors', icon: Users },
    { label: 'Assign Projects', path: '/admin/assign', icon: UserCheck },
    { label: 'Project Monitoring', path: '/admin/monitoring', icon: Activity },
    { label: 'AI Defect Detection', path: '/admin/detections', icon: ScanEye },
    { label: 'Progress Verification', path: '/admin/verification', icon: CheckCircle2 },
    { label: 'Verification Alerts', path: '/admin/alerts', icon: AlertTriangle },
    { label: 'Citizen Complaints', path: '/admin/complaints', icon: MessageSquareWarning },
    { label: 'Reports & CSV Export', path: '/admin/reports', icon: FileSpreadsheet }
  ]

  const isActive = (path) => {
    if (path === '/admin/projects') {
      return location.pathname === '/admin/projects'
    }
    return location.pathname === path || (path !== '/admin/dashboard' && location.pathname.startsWith(path))
  }

  return (
    <>
      {/* Mobile backdrop */}
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
          <Link to="/admin/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">RoadWatch AI</span>
              <span className="text-[10px] text-amber-400 font-mono block -mt-0.5 uppercase tracking-wider font-semibold">
                Admin Portal
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
              <p className="text-xs font-medium text-slate-200 truncate">{user?.email || 'admin@roadwatch.com'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Role: Administrator</p>
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

export default AdminSidebar

