import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FolderKanban, 
  ScanSearch, 
  Calculator, 
  AlertTriangle, 
  ShieldCheck, 
  ChevronRight,
  Sliders,
  ExternalLink
} from 'lucide-react'
import { alertsAPI } from '../services/api'

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [openAlertsCount, setOpenAlertsCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await alertsAPI.list('open')
        setOpenAlertsCount(res.data.length)
      } catch (err) {
        // quiet error on background count
      }
    }
    fetchAlertCount()
    const interval = setInterval(fetchAlertCount, 15000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const navItems = [
    {
      name: 'Dashboard Overview',
      path: '/',
      icon: LayoutDashboard,
      badge: null
    },
    {
      name: 'Project Registry',
      path: '/projects',
      icon: FolderKanban,
      badge: null
    },
    {
      name: 'Road Defect Detection',
      path: '/detection',
      icon: ScanSearch,
      badge: 'YOLOv8'
    },
    {
      name: 'Milestone Progress',
      path: '/milestones',
      icon: Calculator,
      badge: null
    },
    {
      name: 'Verification & Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      badge: openAlertsCount > 0 ? openAlertsCount : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30'
    }
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800
        flex flex-col transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Brand / Government Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">RoadWatch</span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 rounded">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Govt Transparency Audit</p>
            </div>
          </div>
        </div>

        {/* Security Clearance Tag */}
        <div className="mx-4 my-3 px-3 py-2 rounded-md bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Admin Clearance
          </span>
          <span className="font-mono text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">RESTRICTED</span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </div>

              {item.badge !== null && (
                <span className={`px-2 py-0.5 text-xs font-mono rounded-full font-semibold ${
                  item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* System Specs Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">Core Neural Engine:</span>
            <span className="text-slate-300">YOLOv8</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Audit Protocol:</span>
            <span className="text-emerald-400 font-medium">Active (v1.0)</span>
          </div>
        </div>
      </aside>
    </>
  )
}

