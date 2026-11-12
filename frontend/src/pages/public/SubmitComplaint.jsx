import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../services/api'
import { ImageUpload } from '../../components/ImageUpload'
import { AlertTriangle, CheckCircle2, Copy, Check, ArrowRight, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

export const SubmitComplaint = () => {
  const [citizenName, setCitizenName] = useState('')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [roadLocation, setRoadLocation] = useState('')
  const [complaintType, setComplaintType] = useState('pothole')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!citizenName.trim() || !emailOrPhone.trim() || !roadLocation.trim() || !description.trim()) {
      toast.error('Please fill in all required complaint fields.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('citizen_name', citizenName.trim())
      formData.append('email_or_phone', emailOrPhone.trim())
      formData.append('road_location', roadLocation.trim())
      formData.append('complaint_type', complaintType)
      formData.append('description', description.trim())
      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const res = await publicAPI.submitComplaint(formData)
      setResult(res.data)
      toast.success('Complaint lodged successfully!')
    } catch (err) {
      console.error('Error submitting complaint:', err)
      toast.error(err.response?.data?.detail || 'Failed to submit complaint. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = () => {
    if (!result?.reference_number) return
    navigator.clipboard.writeText(result.reference_number)
    setCopied(true)
    toast.success('Reference number copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setCitizenName('')
    setEmailOrPhone('')
    setRoadLocation('')
    setComplaintType('pothole')
    setDescription('')
    setPhotoFile(null)
    setResult(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Citizen Road Redressal Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report Road Damage or Construction Problem
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Submit photo evidence of potholes, cracks, or hazardous road defects. Your grievance will be
          forwarded directly to government road engineers for priority triage and repair.
        </p>
      </div>

      {result ? (
        /* Submission Success Card */
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Complaint Registered Successfully</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please save your unique reference number below. You can use it to track real-time resolution status.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Reference Number</span>
              <span className="text-xl font-extrabold font-mono text-emerald-400 tracking-wider">
                {result.reference_number}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              to={`/track-complaint?ref=${result.reference_number}`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Track This Complaint Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              Report Another Problem
            </button>
          </div>
        </div>
      ) : (
        /* Submission Form */
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="e.g. Ramesh Krishnan"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address or Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="e.g. ramesh@gmail.com or 9876543210"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Road Location & Landmark <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={roadLocation}
                onChange={(e) => setRoadLocation(e.target.value)}
                placeholder="e.g. Velachery Main Road opposite Phoenix Mall"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Defect Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="pothole">Pothole (Hole or depression in road surface)</option>
                <option value="crack">Crack (Alligator, longitudinal, or structural cracks)</option>
                <option value="damaged_road">Damaged Road (Severe surface peeling / unpaved)</option>
                <option value="other">Other Road Hazard / Drainage blockage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Detailed Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the severity, depth, road width affected, or accidents caused..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Attach Defect Photograph (Optional but strongly recommended)
            </label>
            <ImageUpload
              onFileSelect={(file) => setPhotoFile(file)}
              label="Upload Road Defect Photo"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>{submitting ? 'Submitting Grievance...' : 'Submit Road Complaint'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default SubmitComplaint

