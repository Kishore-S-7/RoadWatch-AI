import React from 'react'
import { Loader2 } from 'lucide-react'

export const Loader = ({ message = 'Loading data...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-slate-400 ${className}`}>
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
      <p className="text-xs font-mono tracking-wider uppercase text-slate-400">{message}</p>
    </div>
  )
}

export default Loader

