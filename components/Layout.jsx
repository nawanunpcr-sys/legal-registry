import Sidebar from './Sidebar'
import { Toaster } from 'react-hot-toast'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_22%),_radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_24%)]">
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Sarabun, sans-serif', fontSize: '14px' }
      }} />
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen overflow-auto pt-6 pb-10">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
