import Sidebar from './Sidebar'
import NotificationPanel from './NotificationPanel'
import { Toaster } from 'react-hot-toast'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Layout({ children }) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/legal?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'Sarabun, sans-serif', fontSize: '14px' }
      }} />

      <Sidebar />

      {/* Right column */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-slate-900 border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-4 px-6 h-14">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหากฎหมาย..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-slate-400 pl-9 pr-4 py-2 rounded-xl text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/15 transition-all"
                />
              </div>
            </form>

            <div className="flex-1" />

            {/* Notification Bell */}
            <NotificationPanel />

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow">
                จป
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-xs font-semibold leading-none">จป.วิชาชีพ</p>
                <p className="text-slate-400 text-[11px] leading-none mt-0.5">EHS Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
