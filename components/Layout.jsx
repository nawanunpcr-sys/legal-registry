import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Sarabun, sans-serif', fontSize: '14px' }
      }} />
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}