import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('roadwatch_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('roadwatch_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('roadwatch_token')
      if (storedToken) {
        try {
          const res = await authAPI.getMe()
          setUser(res.data)
          localStorage.setItem('roadwatch_user', JSON.stringify(res.data))
        } catch (err) {
          console.warn('Session expired or invalid, resetting authentication')
          localStorage.removeItem('roadwatch_token')
          localStorage.removeItem('roadwatch_user')
          setUser(null)
          setToken(null)
        }
      }
      setLoading(false)
    }

    verifyAuth()
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { access_token, user: userData, role } = res.data
    localStorage.setItem('roadwatch_token', access_token)
    localStorage.setItem('roadwatch_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
    return { ...userData, role: role || userData.role }
  }

  const logout = () => {
    localStorage.removeItem('roadwatch_token')
    localStorage.removeItem('roadwatch_user')
    setUser(null)
    setToken(null)
    window.location.href = '/'
  }

  const role = user?.role || null
  const isAdmin = role === 'admin'
  const isContractor = role === 'contractor'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isContractor,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
