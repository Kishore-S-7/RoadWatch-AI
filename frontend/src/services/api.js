import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Attach JWT access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('roadwatch_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.startsWith('/public') && currentPath !== '/') {
        localStorage.removeItem('roadwatch_token')
        localStorage.removeItem('roadwatch_user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const formatImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${STATIC_BASE_URL}${cleanPath}`
}

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
}

export const adminAPI = {
  getDashboardSummary: () => api.get('/admin/dashboard/summary'),
  listProjects: (params) => api.get('/admin/projects', { params }),
  getProject: (id) => api.get(`/admin/projects/${id}`),
  createProject: (data) => api.post('/admin/projects', data),
  updateProject: (id, data) => api.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  uploadProjectImage: (id, formData) =>
    api.post(`/admin/projects/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  assignProject: (id, contractorId) =>
    api.put(`/admin/projects/${id}/assign`, { contractor_id: contractorId }),
  getMonitoringTable: () => api.get('/admin/monitoring'),
  getFullProjectDossier: (id) => api.get(`/admin/projects/${id}/full`),

  // Contractors
  listContractors: () => api.get('/admin/contractors'),
  getContractor: (id) => api.get(`/admin/contractors/${id}`),
  createContractor: (data) => api.post('/admin/contractors', data),
  updateContractor: (id, data) => api.put(`/admin/contractors/${id}`, data),
  updateContractorStatus: (id, status) =>
    api.put(`/admin/contractors/${id}/status`, { account_status: status }),
  getContractorProjects: (id) => api.get(`/admin/contractors/${id}/projects`),

  // Milestones
  listMilestones: (projectId) => api.get(`/admin/projects/${projectId}/milestones`),
  createMilestone: (projectId, data) => api.post(`/admin/projects/${projectId}/milestones`, data),
  updateMilestone: (id, data) => api.put(`/admin/milestones/${id}`, data),
  deleteMilestone: (id) => api.delete(`/admin/milestones/${id}`),

  // Detections & Verification
  listDetections: (projectId) =>
    api.get('/admin/detections', { params: projectId ? { project_id: projectId } : {} }),
  verifyProject: (id) => api.post(`/admin/projects/${id}/verify`),

  // Alerts
  listAlerts: (status) =>
    api.get('/admin/alerts', { params: status ? { status } : {} }),
  getAlert: (id) => api.get(`/admin/alerts/${id}`),
  requestClarification: (id, data) => api.post(`/admin/alerts/${id}/clarification`, data),
  recordInspection: (id, data) => api.post(`/admin/alerts/${id}/inspection`, data),
  resolveAlert: (id) => api.put(`/admin/alerts/${id}/resolve`),

  // Complaints
  listComplaints: (params) => api.get('/admin/complaints', { params }),
  getComplaint: (id) => api.get(`/admin/complaints/${id}`),
  updateComplaintStatus: (id, data) => api.put(`/admin/complaints/${id}/status`, data),

  // Reports
  getReports: (format = 'json') =>
    api.get('/admin/reports', {
      params: { format },
      responseType: format === 'csv' ? 'blob' : 'json'
    })
}

export const contractorAPI = {
  getDashboardSummary: () => api.get('/contractor/dashboard/summary'),
  listAssignedProjects: () => api.get('/contractor/projects'),
  getAssignedProject: (id) => api.get(`/contractor/projects/${id}`),
  getMilestones: (projectId) => api.get(`/contractor/projects/${projectId}/milestones`),
  updateMilestones: (projectId, milestones) =>
    api.put(`/contractor/projects/${projectId}/milestones`, { milestones }),
  uploadImage: (projectId, formData) =>
    api.post(`/contractor/projects/${projectId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  listDetections: () => api.get('/contractor/detections'),
  submitProgressReport: (projectId, data) =>
    api.post(`/contractor/projects/${projectId}/progress-report`, data),
  getVerificationStatus: () => api.get('/contractor/verification-status'),
  getAlert: (id) => api.get(`/contractor/alerts/${id}`),
  submitClarification: (id, data) => api.post(`/contractor/alerts/${id}/clarification`, data)
}

export const publicAPI = {
  getStats: () => api.get('/public/stats'),
  searchProjects: (params) => api.get('/public/projects', { params }),
  getProject: (id) => api.get(`/public/projects/${id}`),
  getProjectProgress: (id) => api.get(`/public/projects/${id}/progress`),
  submitComplaint: (formData) =>
    api.post('/public/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  trackComplaint: (referenceNumber) => api.get(`/public/complaints/${referenceNumber}`)
}

// Backward-compatible exports
export const projectsAPI = adminAPI
export const milestonesAPI = {
  listByProject: adminAPI.listMilestones,
  create: adminAPI.createMilestone,
  update: adminAPI.updateMilestone,
  delete: adminAPI.deleteMilestone
}
export const verificationAPI = {
  getProgress: (id) => api.get(`/projects/${id}/progress`),
  updateReportedProgress: (id, reportedProgress) =>
    api.put(`/projects/${id}/reported-progress`, { reported_progress: reportedProgress }),
  verify: adminAPI.verifyProject
}
export const detectionAPI = {
  uploadImage: (projectId, formData, confidence) => {
    const url = confidence !== undefined
      ? `/projects/${projectId}/images?confidence=${confidence}`
      : `/projects/${projectId}/images`
    return api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  listByProject: adminAPI.listDetections
}
export const alertsAPI = {
  list: adminAPI.listAlerts,
  resolve: adminAPI.resolveAlert
}
export const dashboardAPI = {
  getSummary: adminAPI.getDashboardSummary
}

export default api
