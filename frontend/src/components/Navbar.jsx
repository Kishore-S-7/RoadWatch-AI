import React from 'react'
import { Menu, LogOut, User, Activity, Database, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const Navbar = ({ setMobileOpen }) => {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Mobile toggle button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(prev => !prev)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* System telemetry pills */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AI Node: Online</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Database className="w-3 h-3 text-amber-400" />
            <span>MongoDB: Active</span>
          </div>
        </div>
      </div>

      {/* Right side: User info & logout */}
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-200">
            {user?.email || 'admin@roadwatch.com'}
          </div>
          <div className="text-[10px] uppercase font-mono text-amber-400 font-semibold tracking-wider">
            {user?.role || 'System Admin'}
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-xs ring-2 ring-amber-500/20">
          <User className="w-4 h-4 text-slate-950" />
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

