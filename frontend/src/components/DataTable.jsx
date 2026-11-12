import React, { useState } from 'react'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

export const DataTable = ({
  columns = [],
  data = [],
  searchKey = '',
  searchPlaceholder = 'Search records...',
  rowKey = 'id',
  onRowClick = null,
  emptyMessage = 'No matching records found'
}) => {
  const [query, setQuery] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = data.filter((item) => {
    if (!query) return true
    if (searchKey) {
      return String(item[searchKey] || '')
        .toLowerCase()
        .includes(query.toLowerCase())
    }
    return Object.values(item).some((val) =>
      String(val || '').toLowerCase().includes(query.toLowerCase())
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0
    const valA = a[sortCol]
    const valB = b[sortCol]
    if (valA === valB) return 0
    if (valA === undefined || valA === null) return 1
    if (valB === undefined || valB === null) return -1
    return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
  })

  const handleSort = (key) => {
    if (sortCol === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(key)
      setSortAsc(true)
    }
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {searchKey && (
        <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-4 py-3 ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-200' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {sortCol === col.key && (
                      sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, idx) => (
                <tr
                  key={row[rowKey] || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors hover:bg-slate-800/40 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable

