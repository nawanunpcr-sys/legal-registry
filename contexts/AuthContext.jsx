import { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    // Hardcoded credentials
    if (username === '12345' && password === '12345') {
      const userData = {
        id: 'user_1',
        username: username,
        loginTime: new Date().toISOString()
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
