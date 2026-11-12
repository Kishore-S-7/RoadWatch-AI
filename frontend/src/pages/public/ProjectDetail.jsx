import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { publicAPI, formatImageUrl } from '../../services/api'
import { StatusBadge } from '../../components/StatusBadge'
import { ProgressBar, ComparisonProgressBar } from '../../components/ProgressBar'
import { Loader } from '../../components/Loader'
import { EmptyState } from '../../components/EmptyState'
import {
  MapPin,
  Calendar,
  IndianRupee,
  HardHat,
  ArrowLeft,
  ShieldCheck,
  Activity,
  Layers,
  Image as ImageIcon
} from 'lucide-react'

export const ProjectDetail = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await publicAPI.getProject(id)
        setProject(res.data)
      } catch (err) {
        setError('Failed to load project details.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  if (loading) return <Loader message="Fetching verified project dossier..." />
  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState title="Project Not Found" description={error || 'The requested project could not be found.'} />
        <div className="mt-4 text-center">
          <Link to="/projects" className="text-xs text-emerald-400 hover:underline">
            &larr; Back to Search Projects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Top back button */}
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Project Directory</span>
      </Link>

      {/* Main Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <StatusBadge status={project.verification_status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{project.name}</h1>
            <div className="flex items-center text-xs text-slate-400 gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{project.road_location}, {project.district}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-right sm:min-w-[180px]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Sanctioned Cost
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ₹{(project.estimated_cost / 100000).toFixed(2)} Lakhs
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              (₹{Number(project.estimated_cost).toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/80">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Project Scope & Description
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {project.description || 'Public road construction, resurfacing and widening project under state infrastructure works.'}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-3 p-3 bg-slate-800/40 rounded-lg">
            <HardHat className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-400">Authorized Contractor</p>
              <p className="text-xs font-semibold text-slate-200">{project.contractor_name || 'Assigned Contractor'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-800/40 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-400">Commencement Date</p>
              <p className="text-xs font-semibold text-slate-200">{project.start_date || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-slate-800/40 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-400">Expected Completion</p>
              <p className="text-xs font-semibold text-slate-200">{project.expected_end_date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Comparison Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Transparency Progress Comparison</h2>
          </div>
          <Link
            to={`/track-progress?project_id=${project.id}`}
            className="text-xs text-emerald-400 hover:underline"
          >
            Open Dedicated Tracker &rarr;
          </Link>
        </div>

        <ComparisonProgressBar
          reported={project.reported_progress}
          calculated={project.calculated_progress}
          threshold={10}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <p className="text-[11px] text-slate-400">Contractor Self-Reported Progress:</p>
            <p className="text-lg font-mono font-bold text-blue-400">{project.reported_progress}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Submitted via contractor portal milestone submission.</p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <p className="text-[11px] text-slate-400">System Verified Milestone Progress:</p>
            <p className="text-lg font-mono font-bold text-emerald-400">{project.calculated_progress}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Mathematically aggregated from audited milestone weights.</p>
          </div>
        </div>
      </div>

      {/* Public Photographs / Site Evidence */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">Public Site Photographs & Verification Images</h2>
        </div>

        {(!project.images || project.images.length === 0) ? (
          <EmptyState
            icon={ImageIcon}
            title="No photographs published yet"
            description="Photographs uploaded during ongoing construction stages will appear here after AI processing."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.images.map((imgUrl, idx) => (
              <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
                <img
                  src={formatImageUrl(imgUrl)}
                  alt={`Project ${idx + 1}`}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <span className="text-[11px] text-slate-300 font-medium">Site Observation Photo #{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetail

