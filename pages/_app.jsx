import '../styles/globals.css'
import { AuthProvider } from '../contexts/AuthContext'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useRouter } from 'next/router'

const publicPages = ['/login']

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const isPublicPage = publicPages.includes(router.pathname)

  return (
    <AuthProvider>
      {isPublicPage ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      )}
    </AuthProvider>
  )
}
