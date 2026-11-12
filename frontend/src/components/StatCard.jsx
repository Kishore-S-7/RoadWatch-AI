import React from 'react'

export const StatCard = ({ title, value, subtext, icon: Icon, color = 'emerald', alert = false, onClick = null }) => {
  const colorStyles = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      text: 'text-amber-400'
    },
    red: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      text: 'text-rose-400'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      text: 'text-rose-400'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-400'
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      text: 'text-blue-400'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      text: 'text-purple-400'
    }
  }

  const currentStyle = colorStyles[color] || colorStyles.emerald

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden bg-slate-900/90 backdrop-blur-sm p-4 sm:p-5 rounded-xl border transition-all duration-200
        ${currentStyle.border} ${alert ? 'ring-1 ring-rose-500/40' : ''} ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${currentStyle.badge}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
          {value}
        </span>
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-400 font-medium">
          {subtext}
        </p>
      )}
    </div>
  )
}

export default StatCard
