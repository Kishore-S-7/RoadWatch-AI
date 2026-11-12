import React from 'react'
import { Outlet } from 'react-router-dom'
import { PublicNavbar } from './PublicNavbar'

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <p>RoadWatch AI: Government Road Work Transparency and Verification System &bull; State Infrastructure Oversight</p>
      </footer>
    </div>
  )
}

export default PublicLayout

