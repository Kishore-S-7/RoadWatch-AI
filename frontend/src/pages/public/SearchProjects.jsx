import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { publicAPI } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import { Search, Filter, MapPin, IndianRupee, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'

export const SearchProjects = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const [district, setDistrict] = useState(searchParams.get('district') || '')
  const [area, setArea] = useState(searchParams.get('area') || '')
  const [roadName, setRoadName] = useState(searchParams.get('road_name') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const params = {}
      if (district) params.district = district
      if (area) params.area = area
      if (roadName) params.road_name = roadName
      if (status) params.status = status

      const res = await publicAPI.searchProjects(params)
      setProjects(res.data)
    } catch (err) {
      console.error('Failed to search projects:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const newParams = {}
    if (district) newParams.district = district
    if (area) newParams.area = area
    if (roadName) newParams.road_name = roadName
    if (status) newParams.status = status
    setSearchParams(newParams)
    fetchProjects()
  }

  const handleReset = () => {
    setDistrict('')
    setArea('')
    setRoadName('')
    setStatus('')
    setSearchParams({})
    setTimeout(() => {
      publicAPI.searchProjects({}).then((res) => setProjects(res.data))
    }, 0)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Search Road Projects</h1>
        <p className="text-xs text-slate-400">
          Filter and inspect public infrastructure projects across Tamil Nadu districts
        </p>
      </div>

      {/* Filter Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Chennai, Chengalpattu"
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Area / Locality</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Tambaram, GST Road"
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Road Name</label>
            <input
              type="text"
              value={roadName}
              onChange={(e) => setRoadName(e.target.value)}
              placeholder="e.g. Arterial, Avenue"
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Project Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
          >
            Reset Filters
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <Loader message="Searching public road projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No road projects matched your query"
          description="Try broadening your search criteria or resetting filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between p-5 space-y-4 shadow-sm transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white line-clamp-2">{proj.name}</h3>
                  <StatusBadge status={proj.status} />
                </div>

                <div className="flex items-center text-xs text-slate-400 gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{proj.road_location}, {proj.district}</span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {proj.description || 'Public government road construction & maintenance initiative.'}
                </p>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Contractor:</span>
                    <span className="font-medium text-slate-200">{proj.contractor_name || 'Assigned Vendor'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Sanctioned Cost:</span>
                    <span className="font-mono font-medium text-emerald-400">
                      ₹{(proj.estimated_cost / 100000).toFixed(2)} Lakhs
                    </span>
                  </div>
                </div>

                {/* Progress Mini Meter */}
                <div className="pt-1">
                  <ProgressBar
                    progress={proj.calculated_progress}
                    label="Verified Progress"
                    color={proj.status === 'completed' ? 'blue' : 'emerald'}
                    size="sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <StatusBadge status={proj.verification_status} />
                <Link
                  to={`/projects/${proj.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchProjects

