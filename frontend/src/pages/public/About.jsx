import React from 'react'
import { Shield, CheckCircle2, HardHat, FileSpreadsheet, Eye, Sparkles } from 'lucide-react'

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <Shield className="w-3.5 h-3.5" />
          <span>About RoadWatch AI Platform</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Government Road Work Transparency & Verification System
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
          An advanced e-governance framework engineering multi-portal accountability across public citizens,
          contractor builders, and state administrative oversight departments.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-200">Mathematical Progress Verification</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eliminates arbitrary progress reporting by requiring milestone weights to sum to exactly 100%.
            Whenever contractors record progress, the system dynamically calculates completion through:
          </p>
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400">
            Calculated Progress = &sum; (Weight<sub>i</sub> &times; Completion<sub>i</sub> / 100)
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            If a gap between claimed progress and verified completion exceeds the project threshold (default 10%),
            a neutral <strong>Verification Required</strong> alert is flagged for supervisory review.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-200">Ultralytics YOLOv8 Defect Scanning</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Incorporates real-time object detection models fine-tuned on road damage datasets.
            Surveillance and contractor site photos are automatically analyzed for surface anomalies:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong>Potholes:</strong> Cavities and road depressions with confidence grading.</li>
            <li><strong>Cracks:</strong> Longitudinal, transverse, and alligator fracture patterns.</li>
            <li><strong>OpenCV Fallback:</strong> Morphological computer vision contour analysis when offline.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Eye className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-200">Public Accountability & Safety</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Citizens can inspect project costs, schedules, and progress status in real-time without
            requiring user login credentials. Public records omit sensitive administrative internal data
            while guaranteeing open access to tax-dollar utilization metrics.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <HardHat className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-slate-200">Role-Isolated Contractor Workspace</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Licensed construction vendors manage strictly their assigned portfolios. Contractors can update
            milestone work, upload drone and inspection photography, submit periodic reports, and provide
            formal clarifications when quality checks demand supervisory review.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About

