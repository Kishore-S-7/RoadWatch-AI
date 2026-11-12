import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'

// Layouts
import { PublicLayout } from './components/layouts/PublicLayout'
import { AdminLayout } from './components/layouts/AdminLayout'
import { ContractorLayout } from './components/layouts/ContractorLayout'

// Public Pages
import { Home } from './pages/public/Home'
import { About } from './pages/public/About'
import { SearchProjects } from './pages/public/SearchProjects'
import { ProjectDetail } from './pages/public/ProjectDetail'
import { TrackProgress } from './pages/public/TrackProgress'
import { SubmitComplaint } from './pages/public/SubmitComplaint'
import { TrackComplaint } from './pages/public/TrackComplaint'
import { PublicLogin } from './pages/public/PublicLogin'
import { ForgotPassword } from './pages/public/ForgotPassword'

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AddProject } from './pages/admin/AddProject'
import { ManageProjects } from './pages/admin/ManageProjects'
import { FullProjectDossier } from './pages/admin/FullProjectDossier'
import { ContractorManagement } from './pages/admin/ContractorManagement'
import { AssignProjects } from './pages/admin/AssignProjects'
import { ProjectMonitoring } from './pages/admin/ProjectMonitoring'
import { DefectDetection } from './pages/admin/DefectDetection'
import { ProgressVerification } from './pages/admin/ProgressVerification'
import { VerificationAlerts } from './pages/admin/VerificationAlerts'
import { ComplaintManagement } from './pages/admin/ComplaintManagement'
import { Reports } from './pages/admin/Reports'

// Contractor Pages
import { ContractorDashboard } from './pages/contractor/ContractorDashboard'
import { MyAssignedProjects } from './pages/contractor/MyAssignedProjects'
import { ContractorProjectDetail } from './pages/contractor/ContractorProjectDetail'
import { UpdateMilestones } from './pages/contractor/UpdateMilestones'
import { UploadRoadImages } from './pages/contractor/UploadRoadImages'
import { ContractorDetectionResults } from './pages/contractor/ContractorDetectionResults'
import { SubmitProgressReport } from './pages/contractor/SubmitProgressReport'
import { ContractorVerificationStatus } from './pages/contractor/ContractorVerificationStatus'
import { ContractorClarification } from './pages/contractor/ContractorClarification'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              fontSize: '13px'
            }
          }}
        />
        <Routes>
          {/* ================= PUBLIC PORTAL ================= */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<SearchProjects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/track-progress" element={<TrackProgress />} />
            <Route path="/submit-complaint" element={<SubmitComplaint />} />
            <Route path="/track-complaint" element={<TrackComplaint />} />
            <Route path="/login" element={<PublicLogin />} />
            <Route path="/admin/login" element={<PublicLogin initialRole="admin" />} />
            <Route path="/contractor/login" element={<PublicLogin initialRole="contractor" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>

          {/* ================= ADMIN PORTAL (ROLE: admin) ================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/projects/new" element={<AddProject />} />
            <Route path="/admin/projects" element={<ManageProjects />} />
            <Route path="/admin/projects/:id" element={<FullProjectDossier />} />
            <Route path="/admin/contractors" element={<ContractorManagement />} />
            <Route path="/admin/assign" element={<AssignProjects />} />
            <Route path="/admin/monitoring" element={<ProjectMonitoring />} />
            <Route path="/admin/detections" element={<DefectDetection />} />
            <Route path="/admin/verification" element={<ProgressVerification />} />
            <Route path="/admin/alerts" element={<VerificationAlerts />} />
            <Route path="/admin/alerts/:id" element={<VerificationAlerts />} />
            <Route path="/admin/complaints" element={<ComplaintManagement />} />
            <Route path="/admin/complaints/:id" element={<ComplaintManagement />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Route>

          {/* ================= CONTRACTOR PORTAL (ROLE: contractor) ================= */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['contractor']}>
                <ContractorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
            <Route path="/contractor/projects" element={<MyAssignedProjects />} />
            <Route path="/contractor/projects/:id" element={<ContractorProjectDetail />} />
            <Route path="/contractor/milestones" element={<UpdateMilestones />} />
            <Route path="/contractor/upload" element={<UploadRoadImages />} />
            <Route path="/contractor/detections" element={<ContractorDetectionResults />} />
            <Route path="/contractor/progress-report" element={<SubmitProgressReport />} />
            <Route path="/contractor/verification-status" element={<ContractorVerificationStatus />} />
            <Route path="/contractor/clarifications" element={<ContractorClarification />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
