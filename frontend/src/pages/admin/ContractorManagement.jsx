import React, { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { Loader } from '../../components/Loader'
import { Users, Plus, ShieldCheck, ShieldAlert, Edit2, X, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export const ContractorManagement = () => {
  const [contractors, setContractors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [contractorName, setContractorName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('Contractor@123')

  const fetchContractors = async () => {
    try {
      const res = await adminAPI.listContractors()
      setContractors(res.data)
    } catch (err) {
      console.error('Failed to load contractors:', err)
      toast.error('Failed to load contractor directory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContractors()
  }, [])

  const handleToggleStatus = async (contractor) => {
    const newStatus = contractor.account_status === 'active' ? 'inactive' : 'active'
    try {
      await adminAPI.updateContractorStatus(contractor.id, newStatus)
      toast.success(`Account status updated to ${newStatus}.`)
      setContractors(
        contractors.map((c) => (c.id === contractor.id ? { ...c, account_status: newStatus } : c))
      )
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const handleCreateContractor = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        contractor_name: contractorName.trim(),
        company_name: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password || 'Contractor@123',
        account_status: 'active'
      }
      const res = await adminAPI.createContractor(payload)
      toast.success(`Contractor "${res.data.contractor_name}" registered!`)
      setContractors([res.data, ...contractors])
      setModalOpen(false)
      // Reset form
      setContractorName('')
      setCompanyName('')
      setEmail('')
      setPhone('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create contractor.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'contractor_name',
      label: 'Contractor Name',
      render: (val, row) => (
        <div>
          <span className="font-bold text-white block">{val}</span>
          <span className="text-[11px] text-slate-400">{row.company_name}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Contact Info',
      render: (val, row) => (
        <div className="space-y-0.5 text-[11px]">
          <span className="text-slate-300 flex items-center gap-1 font-mono">
            <Mail className="w-3 h-3 text-slate-400" />
            <span>{val}</span>
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{row.phone}</span>
          </span>
        </div>
      )
    },
    {
      key: 'assigned_projects_count',
      label: 'Assigned Works',
      render: (val) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-xs font-mono font-semibold">
          {val || 0} Projects
        </span>
      )
    },
    {
      key: 'account_status',
      label: 'Account Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: 'actions',
      label: 'Access Toggle',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
            row.account_status === 'active'
              ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80'
              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80'
          }`}
        >
          {row.account_status === 'active' ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Deactivate</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Activate</span>
            </>
          )}
        </button>
      )
    }
  ]

  if (loading) return <Loader message="Fetching authorized contractor directory..." />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Contractor Directory & Management</span>
          </h1>
          <p className="text-xs text-slate-400">
            Maintain authorized civil contractors, onboard new construction vendors, and toggle credentials.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Contractor</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={contractors}
        searchKey="contractor_name"
        searchPlaceholder="Search contractors by name or company..."
        rowKey="id"
      />

      {/* Add Contractor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Authorized Contractor</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContractor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contractor / Contact Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  placeholder="e.g. ABC Infrastructure Ltd"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Organization Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. ABC Highway Projects Pvt Ltd"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Official Email (Login User ID) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@abcinfra.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Login Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Default password: Contractor@123</p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  {saving ? 'Creating Account...' : 'Register Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContractorManagement

