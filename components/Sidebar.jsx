import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, BookOpen, Brain, ClipboardList,
  CheckSquare, Shield, Settings, ChevronRight,
  Building2, ExternalLink, Sparkles, LogOut, Book, Bot
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
      { href: '/legal/add', label: 'เพิ่มกฎหมาย', icon: BookOpen },
    ]
  },
  {
    group: 'AI วิเคราะห์',
    items: [
      { href: '/ai-analysis', label: 'วิเคราะห์ด้วย AI', icon: Brain },
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
    group: 'ตั้งค่า',
    items: [
      { href: '/settings', label: 'ตั้งค่าระบบ', icon: Settings },
    ]
  },
]

const aiLinks = [
  {
    label: 'Google Gemini',
    url: 'https://gemini.google.com',
    color: 'text-blue-400',
    icon: Sparkles
  },
  {
    label: 'NotebookLM',
    url: 'https://notebooklm.google.com',
    color: 'text-emerald-400',
    icon: Book
  },
  {
    label: 'ChatGPT',
    url: 'https://chat.openai.com',
    color: 'text-gray-400',
    icon: Bot
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

      {/* AI Quick Links */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-blue-400 text-xs font-semibold mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI Tools
        </p>
        <div className="flex gap-2">
          {aiLinks.map((ai) => {
            const Icon = ai.icon
            return (
              <a
                key={ai.label}
                href={ai.url}
                target="_blank"
                rel="noopener noreferrer"
                title={ai.label}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2 py-2 text-center text-xs text-slate-100 hover:bg-slate-800 transition-colors flex flex-col items-center gap-1"
              >
                <Icon className={`w-4 h-4 ${ai.color}`} />
                <span className="font-medium leading-tight">
                  {ai.label.split(' ')[0]}
                </span>
              </a>
            )
          })}
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm transition-all mb-0.5',
                    isActive
                      ? 'bg-white text-slate-900 font-semibold shadow-lg'
                      : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3" />}
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
