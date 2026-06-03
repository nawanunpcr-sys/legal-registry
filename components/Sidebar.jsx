import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, BookOpen, Brain, ClipboardList,
  Shield, Settings, ChevronRight,
  Building2, ExternalLink, Sparkles, LogOut, Book, Bot,
  Trash2, FileText, MessageSquare
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'

const menu = [
  {
    group: 'ภาพรวม',
    items: [
      { href: '/', label: 'Dashboard องค์กร', icon: LayoutDashboard },
      { href: '/dashboard-dept', label: 'Dashboard แผนก', icon: Building2 },
      { href: '/new-laws', label: 'กฎหมายที่เพิ่งเผยแพร่', icon: Sparkles },
    ]
  },
  {
    group: 'กฎหมาย',
    items: [
      { href: '/legal', label: 'รายการกฎหมาย', icon: BookOpen },
      { href: '/legal/repealed', label: 'กฎหมายที่ยกเลิก', icon: Trash2 },
      { href: '/legal/management-review', label: 'Management Review', icon: FileText },
      { href: '/legal/add', label: 'เพิ่มกฎหมาย', icon: BookOpen },
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
    group: 'งานและการส่ง',
    items: [
      { href: '/tasks', label: 'มอบหมายงาน / ส่งแผนก', icon: ClipboardList },
    ]
  },
  {
    group: 'ประเมินความสอดคล้อง',
    items: [
      { href: '/compliance', label: 'ผลการประเมิน (จป.)', icon: Shield },
    ]
  },
  {
    group: 'การสื่อสาร',
    items: [
      { href: '/communication-matrix', label: 'ตารางการสื่อสาร (ISD-86)', icon: MessageSquare },
    ]
  },
  {
    group: 'ตั้งค่า',
    items: [
      { href: '/settings', label: 'ตั้งค่าระบบ', icon: Settings },
    ]
  },
]

export default function Sidebar() {
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <div className="w-64 bg-slate-950 text-white flex flex-col h-screen shadow-2xl fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-700 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Legal Management System</h1>
            <p className="text-slate-400 text-xs">Legal Management System</p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
            จป
          </div>
          <div>
            <p className="text-sm font-semibold">จป.วิชาชีพ</p>
            <p className="text-slate-400 text-xs">ฝ่าย EHS • Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {menu.map((group) => (
          <div key={group.group} className="mb-3">
            <p className="px-4 py-1 text-blue-400/70 text-[10px] font-bold 
                          uppercase tracking-widest">
              {group.group}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = router.pathname === item.href
              const className = clsx(
                'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm transition-all mb-0.5',
                isActive
                  ? 'bg-white text-slate-900 font-semibold shadow-lg'
                  : item.external
                  ? 'text-indigo-100 hover:bg-indigo-500/15 hover:text-white'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              )

              const content = (
                <>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.external ? <ExternalLink className="w-3 h-3 opacity-70" /> : isActive && <ChevronRight className="w-3 h-3" />}
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
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-200 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </button>
        <p className="text-blue-400/60 text-xs text-center">v1.0 © 2567 Legal Management System</p>
      </div>
    </div>
  )
}
