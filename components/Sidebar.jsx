import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  BookOpen, Brain, ClipboardList, Shield, Settings,
  Sparkles, LogOut, Trash2, FileText, MessageSquare,
  ChevronRight, ExternalLink, Book, Bot,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'

const menu = [
  {
    group: 'กฎหมาย',
    items: [
      { href: '/legal', label: 'ทะเบียนกฎหมาย', icon: BookOpen },
      { href: '/new-laws', label: 'กฎหมายใหม่ (ราชกิจจาฯ)', icon: Sparkles },
      { href: '/legal/repealed', label: 'กฎหมายที่ยกเลิก', icon: Trash2 },
      { href: '/legal/management-review', label: 'Management Review', icon: FileText },
    ]
  },
  {
    group: 'AI วิเคราะห์',
    items: [
      { href: '/ai-analysis', label: 'วิเคราะห์ด้วย AI', icon: Brain },
      { href: 'https://gemini.google.com', label: 'Google Gemini', icon: Sparkles, external: true },
      { href: 'https://notebooklm.google.com', label: 'NotebookLM', icon: Book, external: true },
      { href: 'https://chatgpt.com', label: 'ChatGPT', icon: Bot, external: true },
    ]
  },
  {
    group: 'การปฏิบัติตาม',
    items: [
      { href: '/tasks', label: 'มอบหมายงาน', icon: ClipboardList },
      { href: '/compliance', label: 'ผลการประเมิน (จป.)', icon: Shield },
      { href: '/communication-matrix', label: 'ตารางการสื่อสาร', icon: MessageSquare },
    ]
  },
  {
    group: 'ระบบ',
    items: [
      { href: '/settings', label: 'ตั้งค่า', icon: Settings },
    ]
  },
]

export default function Sidebar() {
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <div className="w-60 bg-slate-900 text-white flex flex-col h-screen shadow-2xl fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight text-white">Legal Registry</h1>
            <p className="text-slate-400 text-[11px] mt-0.5">ระบบทะเบียนกฎหมาย EHS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {menu.map((group) => (
          <div key={group.group}>
            <p className="px-3 py-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              {group.group}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                // active for exact match or sub-paths (except /legal/add etc.)
                const isActive = item.href !== '/' &&
                  (router.pathname === item.href ||
                    (item.href === '/legal' && router.pathname.startsWith('/legal') && !item.external))
                    && !item.external

                const className = clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow'
                    : item.external
                    ? 'text-slate-400 hover:text-white hover:bg-white/8'
                    : 'text-slate-300 hover:text-white hover:bg-white/8'
                )

                const content = (
                  <>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.external
                      ? <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                      : isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                  </>
                )

                return item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <Link key={item.href} href={item.href} className={className}>
                    {content}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/8">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
        <p className="text-slate-600 text-[10px] text-center mt-2">v2.0 © 2568</p>
      </div>
    </div>
  )
}
