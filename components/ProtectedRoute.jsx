import { useAuth } from '../hooks/useAuth'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return children
}
