import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import {
  BookOpen, ChevronDown, ChevronRight, Search, Plus, AlertCircle,
  Download, Trash2, Filter, Calendar, X, RefreshCw,
  CheckCircle2, XCircle, Clock, ExternalLink, Layers,
  Scale, FileText, BookMarked, Building2, ScrollText,
  Gavel, ArrowUpRight, Sparkles, Database,
} from 'lucide-react'
import { getLaws, getCategories } from '../../lib/supabase'
import { normalizeComplianceStatus } from '../../lib/statusUtils'
import { exportToCsv, exportToExcel } from '../../lib/exportUtils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { HIERARCHY_ORDER } from '../../lib/royalGazette'

// ─── Legal hierarchy metadata ────────────────────────────────────────────────
const HIERARCHY_META = {
  'พระราชบัญญัติ': {
    abbr: 'พ.ร.บ.',
    icon: Gavel,
    color: 'indigo',
    bg: 'bg-indigo-600',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'กฎหมายสูงสุดของระดับพระราชบัญญัติ ออกโดยรัฐสภา',
    level: 1,
  },
  'พระราชกฤษฎีกา': {
    abbr: 'พ.ร.ฎ.',
    icon: ScrollText,
    color: 'violet',
    bg: 'bg-violet-600',
    light: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-800 border-violet-200',
    description: 'กฎหมายลำดับรองจาก พ.ร.บ. ออกโดยพระมหากษัตริย์ตามคำแนะนำ ครม.',
    level: 2,
  },
  'กฎกระทรวง': {
    abbr: 'กก.',
    icon: Building2,
    color: 'blue',
    bg: 'bg-blue-600',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'ออกโดยรัฐมนตรีตามอำนาจที่ได้รับมอบจาก พ.ร.บ.',
    level: 3,
  },
  'ประกาศกระทรวง': {
    abbr: 'ปก.',
    icon: FileText,
    color: 'cyan',
    bg: 'bg-cyan-600',
    light: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'ออกโดยกระทรวง เพื่อกำหนดรายละเอียดการปฏิบัติตามกฎกระทรวง',
    level: 4,
  },
  'ประกาศกรม': {
    abbr: 'ปกรม.',
    icon: BookMarked,
    color: 'teal',
    bg: 'bg-teal-600',
    light: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'ออกโดยกรม เพื่อกำหนดรายละเอียดปลีกย่อยในระดับปฏิบัติ',
    level: 5,
  },
  'ระเบียบ': {
    abbr: 'ระเบียบ',
    icon: Layers,
    color: 'amber',
    bg: 'bg-amber-600',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'ระเบียบปฏิบัติของหน่วยงานราชการ',
    level: 6,
  },
  'คำสั่ง': {
    abbr: 'คสก.',
    icon: Scale,
    color: 'rose',
    bg: 'bg-rose-600',
    light: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'คำสั่งเฉพาะของหน่วยงาน มีผลบังคับใช้ภายในหน่วยงาน',
    level: 7,
  },
}

const DEFAULT_META = {
  abbr: 'กม.',
  icon: BookOpen,
  color: 'slate',
  bg: 'bg-slate-600',
  light: 'bg-slate-50',
  border: 'border-slate-200',
  text: 'text-slate-700',
  badge: 'bg-slate-100 text-slate-800 border-slate-200',
  description: 'กฎหมายที่ไม่ระบุประเภท',
  level: 99,
}

// Map DB law_type → display lawType Thai
function getLawTypeDisplay(law) {
  if (law.law_type) {
    const map = {
      law: 'พระราชบัญญัติ',
      royal_decree: 'พระราชกฤษฎีกา',
      ministerial_regulation: 'กฎกระทรวง',
      ministerial_announcement: 'ประกาศกระทรวง',
      departmental_announcement: 'ประกาศกรม',
      regulation: 'ระเบียบ',
      order: 'คำสั่ง',
      announcement: 'ประกาศกระทรวง',
    }
    if (map[law.law_type]) return map[law.law_type]
  }
  // Infer from title
  const t = law.title || ''
  for (const type of HIERARCHY_ORDER) {
    if (t.includes(type)) return type
  }
  return 'ประกาศกระทรวง'
}

export default function LegalDashboard() {
  const router = useRouter()
  const [laws, setLaws] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedType, setExpandedType] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (router.query.search) setSearchTerm(router.query.search)
  }, [router.query.search])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getLaws()
      setLaws(res.data || [])
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed-laws', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        await fetchData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการดึงกฎหมาย')
    } finally {
      setSeeding(false)
    }
  }

  const activeLaws = useMemo(() => laws.filter(l => !l.is_cancelled), [laws])

  const filteredLaws = useMemo(() => {
    return activeLaws.filter(law => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        if (!law.title?.toLowerCase().includes(q) && !law.law_code?.toLowerCase().includes(q)) return false
      }
      if (statusFilter !== 'all') {
        const s = normalizeComplianceStatus(law.compliance_status)
        if (s !== statusFilter) return false
      }
      return true
    })
  }, [activeLaws, searchTerm, statusFilter])

  // Group by legal hierarchy
  const grouped = useMemo(() => {
    const map = {}
    for (const law of filteredLaws) {
      const type = getLawTypeDisplay(law)
      if (!map[type]) map[type] = []
      map[type].push(law)
    }
    // Sort by hierarchy order
    return HIERARCHY_ORDER
      .filter(t => map[t])
      .map(t => ({ type: t, laws: map[t], meta: HIERARCHY_META[t] || DEFAULT_META }))
      .concat(
        Object.keys(map)
          .filter(t => !HIERARCHY_ORDER.includes(t))
          .map(t => ({ type: t, laws: map[t], meta: DEFAULT_META }))
      )
  }, [filteredLaws])

  const totalLaws = activeLaws.length
  const activeFilters = [searchTerm, statusFilter !== 'all'].filter(Boolean).length

  const exportColumns = [
    { label: 'รหัสกฎหมาย', value: l => l.law_code },
    { label: 'ชื่อกฎหมาย', value: l => l.title },
    { label: 'ประเภท', value: l => getLawTypeDisplay(l) },
    { label: 'หมวดหมู่', value: l => l.law_categories?.name },
    { label: 'สถานะ', value: l => l.compliance_status },
    { label: 'วันที่บังคับใช้', value: l => l.effective_date },
    { label: 'ผู้รับผิดชอบ', value: l => l.responsible_person },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">กำลังโหลดทะเบียนกฎหมาย...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* ── Hero Header ────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 shadow-2xl">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-indigo-200 font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> ระบบทะเบียนกฎหมาย EHS
            </div>
            <h1 className="text-3xl font-bold text-white leading-tight mb-2">
              ทะเบียนกฎหมายและกฎระเบียบ
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              จัดระเบียบกฎหมาย EHS ตามลำดับชั้นทางกฎหมาย — พ.ร.บ. → พ.ร.ฎ. → กฎกระทรวง → ประกาศกระทรวง → ประกาศกรม
            </p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 lg:w-72 flex-shrink-0">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalLaws}</p>
              <p className="text-xs text-slate-400 mt-0.5">กฎหมายทั้งหมด</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{grouped.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">ลำดับชั้น</p>
            </div>
            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{filteredLaws.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">แสดงอยู่</p>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-white/10">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow"
          >
            <Database className={`w-4 h-4 ${seeding ? 'animate-pulse' : ''}`} />
            {seeding ? 'กำลังดึงกฎหมาย...' : 'ดึงกฎหมายทั้งหมด'}
          </button>
          <Link href="/legal/add" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> เพิ่มกฎหมาย
          </Link>
          <Link href="/new-laws" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
            <Sparkles className="w-4 h-4" /> ราชกิจจาฯ ใหม่
          </Link>
          <Link href="/legal/repealed" className="flex items-center gap-2 text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-all">
            <Trash2 className="w-4 h-4" /> กฎหมายที่ยกเลิก
          </Link>
          <div className="ml-auto flex gap-2">
            <button onClick={() => exportToCsv(filteredLaws, exportColumns, 'legal-registry.csv')} className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={() => exportToExcel(filteredLaws, exportColumns, 'legal-registry.xls')} className="flex items-center gap-1.5 text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl text-xs font-medium transition-all">
              <Download className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* ── Hierarchy Overview Chips ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {HIERARCHY_ORDER.map(type => {
          const meta = HIERARCHY_META[type] || DEFAULT_META
          const count = filteredLaws.filter(l => getLawTypeDisplay(l) === type).length
          if (count === 0) return null
          const Icon = meta.icon
          return (
            <button
              key={type}
              onClick={() => {
                setExpandedType(prev => prev === type ? null : type)
                setTimeout(() => document.getElementById(`hierarchy-${type}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                expandedType === type
                  ? `${meta.bg} text-white border-transparent shadow-lg`
                  : `${meta.light} ${meta.text} ${meta.border} hover:shadow`
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{meta.abbr}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${expandedType === type ? 'bg-white/20 text-white' : 'bg-white text-slate-700'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search + Filter ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center gap-3 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัสกฎหมาย..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}
          >
            <Filter className="w-4 h-4" />
            กรอง
            {activeFilters > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                {activeFilters}
              </span>
            )}
          </button>
          {activeFilters > 0 && (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all') }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 px-2 py-2 rounded-xl hover:bg-red-50 transition-all">
              <X className="w-3.5 h-3.5" /> ล้าง
            </button>
          )}
        </div>
        {showFilters && (
          <div className="border-t border-slate-100 px-4 py-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">สถานะการปฏิบัติตาม</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'compliant', label: 'สอดคล้อง' },
                { value: 'non_compliant', label: 'ไม่สอดคล้อง' },
                { value: 'pending', label: 'รอตรวจสอบ' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusFilter === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Hierarchy Groups ───────────────────────────────────────────────── */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 text-sm">ไม่พบกฎหมาย</p>
          <button onClick={handleSeed} disabled={seeding} className="mt-3 text-blue-600 text-xs hover:underline">
            {seeding ? 'กำลังดึง...' : 'ดึงกฎหมายจากราชกิจจาฯ'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ type, laws: typeLaws, meta }) => {
            const Icon = meta.icon
            const isOpen = expandedType === type

            return (
              <div
                key={type}
                id={`hierarchy-${type}`}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 ${meta.border} bg-white shadow-sm`}
              >
                {/* Group Header */}
                <button
                  onClick={() => setExpandedType(isOpen ? null : type)}
                  className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${isOpen ? meta.light : 'hover:bg-slate-50/80'}`}
                >
                  {/* Level badge */}
                  <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 shadow`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{type}</h3>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                        {meta.abbr}
                      </span>
                      <span className="text-xs text-slate-400">ชั้นที่ {meta.level}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{meta.description}</p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">{typeLaws.length}</p>
                      <p className="text-xs text-slate-400">ฉบับ</p>
                    </div>
                    {isOpen
                      ? <ChevronDown className={`w-5 h-5 ${meta.text}`} />
                      : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                </button>

                {/* Laws list */}
                {isOpen && (
                  <div className={`border-t ${meta.border} divide-y divide-slate-100`}>
                    {typeLaws.map(law => (
                      <LawCard key={law.id} law={law} meta={meta} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}

function LawCard({ law, meta }) {
  const status = normalizeComplianceStatus(law.compliance_status)
  const isCompliant = status === 'compliant'
  const isNonCompliant = status === 'non_compliant'

  return (
    <Link href={`/legal/${law.id}`}>
      <div className="group px-6 py-4 hover:bg-slate-50/70 transition-colors cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Status dot */}
          <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${isCompliant ? 'bg-emerald-500' : isNonCompliant ? 'bg-red-500' : 'bg-amber-400'}`} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors leading-snug">
              {law.title}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {law.law_code && (
                <span className="text-[11px] font-mono text-slate-400">{law.law_code}</span>
              )}
              {law.law_categories?.name && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: law.law_categories.color || '#94a3b8' }} />
                  {law.law_categories.name}
                </span>
              )}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${isCompliant ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isNonCompliant ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {isCompliant ? '✓ สอดคล้อง' : isNonCompliant ? '✗ ไม่สอดคล้อง' : '◷ รอตรวจสอบ'}
              </span>
              {law.review_frequency && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {law.review_frequency}
                </span>
              )}
            </div>
            {law.description && (
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{law.description}</p>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>
    </Link>
  )
}
