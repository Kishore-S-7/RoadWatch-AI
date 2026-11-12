import React from 'react'

export const ProgressBar = ({
  progress = 0,
  label,
  color = 'emerald',
  showPercent = true,
  size = 'md',
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, Number(progress) || 0))

  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    rose: 'bg-rose-500'
  }

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          {label && <span className="font-medium text-slate-300">{label}</span>}
          {showPercent && (
            <span className="font-mono text-slate-400 font-semibold">{clamped.toFixed(1)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heightClasses[size] || 'h-2.5'}`}>
        <div
          className={`${colorClasses[color] || 'bg-emerald-500'} h-full rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export const ComparisonProgressBar = ({
  reported = 0,
  calculated = 0,
  threshold = 10,
  className = ''
}) => {
  const rep = Math.min(100, Math.max(0, Number(reported) || 0))
  const calc = Math.min(100, Math.max(0, Number(calculated) || 0))
  const diff = Math.abs(rep - calc)
  const isAlert = diff > threshold

  return (
    <div className={`space-y-2 ${className}`}>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Reported (Contractor Claim):</span>
          <span className="font-mono font-semibold text-slate-200">{rep.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isAlert ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${rep}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Calculated (Verified Milestones):</span>
          <span className="font-mono font-semibold text-slate-200">{calc.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${calc}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default ProgressBar

