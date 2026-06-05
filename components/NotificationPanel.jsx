import { useEffect, useRef, useState } from 'react'
import { Bell, BellRing, CheckCheck, ExternalLink, RefreshCw, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '../hooks/useNotifications'

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const { notifications, unreadCount, checking, markAllRead, markRead, clearAll, checkGazette } = useNotifications()

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const formatTime = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'เมื่อกี้'
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} วันที่แล้ว`
  }

  const iconForType = (type) => {
    if (type === 'new_laws') return '📋'
    if (type === 'review_due') return '⏰'
    return '🔔'
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
        title="การแจ้งเตือน"
      >
        {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-slate-800 text-sm">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => checkGazette(true)}
                disabled={checking}
                title="ตรวจสอบกฎหมายใหม่จากราชกิจจานุเบกษา"
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              </button>
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    title="ทำเครื่องหมายอ่านทั้งหมด"
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    title="ลบทั้งหมด"
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">ยังไม่มีการแจ้งเตือน</p>
                <button
                  onClick={() => checkGazette(true)}
                  disabled={checking}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                >
                  {checking ? 'กำลังตรวจสอบ...' : 'ตรวจสอบกฎหมายใหม่'}
                </button>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 flex-shrink-0">{iconForType(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                      </div>
                      {n.body && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-slate-400">{formatTime(n.createdAt)}</span>
                        {n.href && (
                          <Link
                            href={n.href}
                            onClick={() => setOpen(false)}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            ดูรายละเอียด <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <Link
              href="/settings#notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
            >
              ตั้งค่าการแจ้งเตือน →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
