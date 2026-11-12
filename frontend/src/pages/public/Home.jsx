import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { publicAPI } from '../../services/api'
import { StatCard } from '../../components/StatCard'
import {
  Shield,
  Search,
  Activity,
  AlertTriangle,
  FolderKanban,
  CheckCircle,
  HardHat,
  ArrowRight,
  TrendingUp,
  MapPin,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

export const Home = () => {
  const [stats, setStats] = useState({ total_projects: 0, ongoing_projects: 0, completed_projects: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicAPI.getStats()
        setStats(res.data)
      } catch (err) {
        console.error('Failed to fetch public stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/projects?road_name=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/projects')
    }
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 lg:p-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Transparency & Road Quality Verification Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Government Road Work <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Transparency & Verification System
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Public accountability meets computer vision AI. Track government road construction progress,
            inspect milestone-verified completion versus contractor reports, and submit road defect reports directly.
          </p>

          {/* Quick Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search road by name, district, or location..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Access Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to="/track-progress"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>View Construction Progress</span>
            </Link>

            <Link
              to="/submit-complaint"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Report Road Problems</span>
            </Link>

            <Link
              to="/admin/login"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Admin Portal
            </Link>

            <Link
              to="/contractor/login"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Contractor Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Real-time Project Statistics */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">State Infrastructure Metrics</h2>
            <p className="text-xs text-slate-400">Live counts verified across regional road administrative divisions</p>
          </div>
          <Link to="/projects" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
            <span>View All Projects</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Road Projects"
            value={loading ? '...' : stats.total_projects}
            subtext="Public highway & municipal roads cataloged"
            icon={FolderKanban}
            color="emerald"
          />
          <StatCard
            title="Ongoing Construction"
            value={loading ? '...' : stats.ongoing_projects}
            subtext="Active road works with milestone monitoring"
            icon={TrendingUp}
            color="amber"
          />
          <StatCard
            title="Completed & Certified"
            value={loading ? '...' : stats.completed_projects}
            subtext="Verified 100% completed infrastructure"
            icon={CheckCircle}
            color="blue"
          />
        </div>
      </section>

      {/* About the Project Highlight */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Milestone Mathematical Auditing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Project progress is calculated mathematically from strictly weighted engineering milestones (summing to 100%).
            Contractor claims are cross-checked automatically against field evidence.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">AI Computer Vision Defect Detection</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ultralytics YOLOv8 scanning pinpoints road surface defects including longitudinal cracks,
            alligator cracking, and potholes to maintain high engineering quality standards before sign-off.
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-100">Direct Citizen Redressal</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Citizens can report damaged roads with GPS location and photos. Every submission receives a tracking
            reference token with transparent resolution timelines and accountability.
          </p>
        </div>
      </section>
    </div>
  )
}

export default Home

