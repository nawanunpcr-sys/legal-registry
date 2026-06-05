import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import {
  Zap, ExternalLink, Calendar, AlertCircle, Search,
  Filter, Brain, ArrowRight, RefreshCw, Bell, CheckCircle2,
  Download, BookOpen, X
} from 'lucide-react'
import { fetchLatestLaws } from '../lib/royalGazette'
import { useNotifications } from '../hooks/useNotifications'
import toast from 'react-hot-toast'
import Link from 'next/link'

const LAW_TYPES = ['พระราชบัญญัติ', 'พระราชกฤษฎีกา', 'กฎกระทรวง', 'ประกาศกระทรวง', 'ประกาศกรม']
const CATEGORIES = [
  'ความปลอดภัยทั่วไป',
  'เครื่องจักร / อุปกรณ์ / เครื่องมือ',
  'ไฟฟ้าและอัคคีภัย',
  'สารเคมีและวัตถุอันตราย',
  'สิ่งแวดล้อมในการทำงาน',
  'การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย',
  'การก่อสร้าง',
  'สวัสดิการและแรงงาน',
]

export default function NewLaws() {
  const [laws, setLaws] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLawType, setSelectedLawType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)
  const { checkGazette, checking, addNotification } = useNotifications()

  useEffect(() => { loadLaws() }, [])

  const loadLaws = async () => {
    setLoading(true)
    try {
      const result = await fetchLatestLaws({ limit: 20 })
      if (result.success) {
        setLaws(result.data)
        setLastUpdated(result.lastUpdated)
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลจากราชกิจจานุเบกษา')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleForceCheck = async () => {
    const result = await checkGazette(true)
    if (result.newCount > 0) {
      toast.success(`พบกฎหมายใหม่ ${result.newCount} ฉบับ!`)
    } else if (!result.error) {
      toast('ไม่พบกฎหมายใหม่ในขณะนี้', { icon: '✓' })
    }
    await loadLaws()
  }

  const filteredLaws = laws.filter(law => {
    const q = searchTerm.toLowerCase()
    const matchSearch = !searchTerm || law.title.toLowerCase().includes(q) || law.summary.toLowerCase().includes(q)
    const matchType = selectedLawType === 'all' || law.lawType === selectedLawType
    const matchCat = selectedCategory === 'all' || law.safetyCategory === selectedCategory
    return matchSearch && matchType && matchCat
  })

  const lawTypeColors = {
    'พระราชบัญญัติ': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'พระราชกฤษฎีกา': 'bg-purple-50 text-purple-700 border-purple-200',
    'กฎกระทรวง': 'bg-blue-50 text-blue-700 border-blue-200',
    'ประกาศกระทรวง': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'ประกาศกรม': 'bg-teal-50 text-teal-700 border-teal-200',
  }

  const categoryColors = {
    'ความปลอดภัยทั่วไป': 'bg-slate-50 text-slate-700 border-slate-200',
    'เครื่องจักร / อุปกรณ์ / เครื่องมือ': 'bg-orange-50 text-orange-700 border-orange-200',
    'ไฟฟ้าและอัคคีภัย': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'สารเคมีและวัตถุอันตราย': 'bg-red-50 text-red-700 border-red-200',
    'สิ่งแวดล้อมในการทำงาน': 'bg-green-50 text-green-700 border-green-200',
    'การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย': 'bg-amber-50 text-amber-700 border-amber-200',
    'การก่อสร้าง': 'bg-stone-50 text-stone-700 border-stone-200',
    'สวัสดิการและแรงงาน': 'bg-pink-50 text-pink-700 border-pink-200',
  }

  const activeFilterCount = [searchTerm, selectedLawType !== 'all', selectedCategory !== 'all'].filter(Boolean).length

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">กฎหมายใหม่จากราชกิจจานุเบกษา</h1>
          </div>
          <p className="text-slate-500 text-sm ml-14">
            ติดตามประกาศกฎหมาย EHS, ความปลอดภัย และสวัสดิการแรงงานล่าสุด
            {lastUpdated && (
              <span className="ml-2 text-slate-400">
                • ตรวจสอบล่าสุด {new Date(lastUpdated).toLocaleString('th-TH')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleForceCheck}
            disabled={checking || loading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            ตรวจสอบใหม่
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 text-sm text-amber-800">
        <Bell className="w-4 h-4 flex-shrink-0 text-amber-600" />
        <span>ระบบตรวจสอบกฎหมายใหม่โดยอัตโนมัติตามความถี่ที่ตั้งค่า และแจ้งเตือนเมื่อพบฉบับใหม่</span>
        <Link href="/settings#notifications" className="ml-auto text-amber-700 hover:text-amber-900 font-semibold whitespace-nowrap">
          ตั้งค่า →
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center gap-3 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกฎหมายหรือเนื้อหา..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          <select
            value={selectedLawType}
            onChange={e => setSelectedLawType(e.target.value)}
            className="select-field py-2 text-sm w-44"
          >
            <option value="all">ทุกประเภท</option>
            {LAW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="select-field py-2 text-sm w-52"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setSearchTerm(''); setSelectedLawType('all'); setSelectedCategory('all') }}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 px-2 py-2 rounded-xl hover:bg-red-50 transition-all"
            >
              <X className="w-3.5 h-3.5" /> ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-slate-500 mb-4">
          แสดง <span className="font-semibold text-slate-700">{filteredLaws.length}</span> จาก {laws.length} รายการ
        </p>
      )}

      {/* Law Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-72">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">กำลังโหลดข้อมูลจากราชกิจจานุเบกษา...</p>
          </div>
        </div>
      ) : filteredLaws.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm">ไม่พบกฎหมายที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLaws.map((law) => (
            <div
              key={law.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all duration-200 p-5"
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${lawTypeColors[law.lawType] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {law.lawType}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${categoryColors[law.safetyCategory] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                  {law.safetyCategory}
                </span>
                <span className="ml-auto text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  เผยแพร่ {new Date(law.publishedDate).toLocaleDateString('th-TH')}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">{law.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{law.summary}</p>

              {/* Meta + Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>บังคับใช้ {new Date(law.effectiveDate).toLocaleDateString('th-TH')}</span>
                </div>
                <div className="text-xs text-slate-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl text-blue-700 font-medium">
                  ทบทวน: {law.reviewFrequency}
                </div>
                <div className="flex gap-2 ml-auto">
                  <a
                    href={law.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> ต้นฉบับ
                  </a>
                  <Link
                    href={`/ai-analysis?title=${encodeURIComponent(law.title)}&text=${encodeURIComponent(law.summary)}&url=${encodeURIComponent(law.link)}`}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm"
                  >
                    <Brain className="w-3.5 h-3.5" /> วิเคราะห์ด้วย AI
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
