import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import {
  BookOpen, ChevronDown, ChevronRight, Search, Plus,
  AlertCircle, Download, Trash2, FileText, Filter,
  Calendar, X, RefreshCw, CheckCircle2, XCircle, Clock,
  TrendingUp, BarChart3, Layers
} from 'lucide-react'
import { getLaws, getCategories } from '../../lib/supabase'
import { isCompliantStatus, isNonCompliantStatus, normalizeComplianceStatus } from '../../lib/statusUtils'
import { exportToCsv, exportToExcel } from '../../lib/exportUtils'
import Link from 'next/link'
import toast from 'react-hot-toast'

const CURRENT_YEAR_BE = new Date().getFullYear() + 543

function buildYearOptions() {
  const years = []
  for (let y = CURRENT_YEAR_BE; y >= CURRENT_YEAR_BE - 30; y--) {
    years.push(y.toString())
  }
  return years
}

export default function LegalRegistry() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [laws, setLaws] = useState([])
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedYear, setExpandedYear] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')  // all | compliant | non_compliant | pending
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Pick up ?search= from header global search
  useEffect(() => {
    if (router.query.search) {
      setSearchTerm(router.query.search)
    }
  }, [router.query.search])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [catRes, lawsRes] = await Promise.all([getCategories(), getLaws()])
      setCategories(catRes.data || [])
      setLaws(lawsRes.data || [])
    } catch {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const extractYearBE = (law) => {
    for (const dateField of ['effective_date', 'announced_date']) {
      if (law[dateField]) {
        const d = new Date(law[dateField])
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear()
          return y >= 2400 ? y : y + 543
        }
      }
    }
    const match = law.title?.match(/พ\.ศ\.\s*(\d{4})/)
    if (match) return parseInt(match[1])
    return null
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
        if (statusFilter === 'compliant' && s !== 'compliant') return false
        if (statusFilter === 'non_compliant' && s !== 'non_compliant') return false
        if (statusFilter === 'pending' && s !== 'pending') return false
      }
      if (categoryFilter !== 'all' && law.category_id !== categoryFilter) return false
      const yearBE = extractYearBE(law)
      if (yearFrom && yearBE && yearBE < parseInt(yearFrom)) return false
      if (yearTo && yearBE && yearBE > parseInt(yearTo)) return false
      return true
    })
  }, [activeLaws, searchTerm, statusFilter, categoryFilter, yearFrom, yearTo])

  const displayCategories = useMemo(() => [
    ...categories,
    ...(filteredLaws.some(l => !l.category_id)
      ? [{ id: 'uncategorized', name: 'ไม่ระบุหมวดหมู่', color: '#94a3b8' }]
      : []),
  ], [categories, filteredLaws])

  const getLawsByCategory = (catId) =>
    catId === 'uncategorized'
      ? filteredLaws.filter(l => !l.category_id)
      : filteredLaws.filter(l => l.category_id === catId)

  const complianceStats = (laws) => {
    const total = laws.length
    if (!total) return { compliant: 0, nonCompliant: 0, pending: 0, total: 0, pct: 0 }
    const compliant = laws.filter(l => isCompliantStatus(l.compliance_status)).length
    const nonCompliant = laws.filter(l => isNonCompliantStatus(l.compliance_status)).length
    return { compliant, nonCompliant, pending: total - compliant - nonCompliant, total, pct: Math.round((compliant / total) * 100) }
  }

  const globalStats = complianceStats(filteredLaws)

  const activeFiltersCount = [
    searchTerm, statusFilter !== 'all', categoryFilter !== 'all', yearFrom, yearTo
  ].filter(Boolean).length

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setYearFrom('')
    setYearTo('')
  }

  const exportColumns = [
    { label: 'รหัสกฎหมาย', value: l => l.law_code },
    { label: 'ชื่อกฎหมาย', value: l => l.title },
    { label: 'หมวดหมู่', value: l => l.law_categories?.name },
    { label: 'สถานะ', value: l => l.compliance_status },
    { label: 'ความสำคัญ', value: l => l.priority },
    { label: 'ผู้รับผิดชอบ', value: l => l.responsible_person },
    { label: 'วันที่บังคับใช้', value: l => l.effective_date },
    { label: 'ความถี่ตรวจติดตาม', value: l => l.review_frequency },
  ]

  const yearOptions = buildYearOptions()

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">ทะเบียนกฎหมาย</h1>
          </div>
          <p className="text-slate-500 text-sm ml-14">ติดตามและจัดการความสอดคล้องด้าน EHS ครบวงจร</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => exportToCsv(filteredLaws, exportColumns, 'legal-registry.csv')}
            className="btn-secondary text-xs px-3 py-2"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => exportToExcel(filteredLaws, exportColumns, 'legal-registry.xls')}
            className="btn-success text-xs px-3 py-2"
          >
            <Download className="w-3.5 h-3.5" /> Excel
          </button>
          <Link href="/legal/add" className="btn-primary text-xs px-4 py-2">
            <Plus className="w-4 h-4" /> เพิ่มกฎหมาย
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<Layers className="w-5 h-5" />} label="กฎหมายทั้งหมด" value={globalStats.total} color="blue" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="สอดคล้องแล้ว" value={globalStats.compliant} color="emerald" />
        <StatCard icon={<XCircle className="w-5 h-5" />} label="ไม่สอดคล้อง" value={globalStats.nonCompliant} color="red" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="อัตราสอดคล้อง" value={`${globalStats.pct}%`} color="violet" />
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-4">
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
            {activeFiltersCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${showFilters ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 px-2 py-2 rounded-xl hover:bg-red-50 transition-all">
              <X className="w-3.5 h-3.5" /> ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="border-t border-slate-100 px-4 py-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">สถานะ</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="select-field py-2 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="compliant">สอดคล้อง</option>
                <option value="non_compliant">ไม่สอดคล้อง</option>
                <option value="pending">รอตรวจสอบ</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">หมวดหมู่</label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="select-field py-2 text-sm"
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Year From */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> ปี พ.ศ. ตั้งแต่
              </label>
              <select
                value={yearFrom}
                onChange={e => setYearFrom(e.target.value)}
                className="select-field py-2 text-sm"
              >
                <option value="">ทุกปี</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Year To */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> ถึงปี พ.ศ.
              </label>
              <select
                value={yearTo}
                onChange={e => setYearTo(e.target.value)}
                className="select-field py-2 text-sm"
              >
                <option value="">ทุกปี</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-2 mb-4">
        <Link href="/legal/repealed" className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-all font-medium">
          <Trash2 className="w-3.5 h-3.5" /> กฎหมายที่ยกเลิก
        </Link>
        <Link href="/legal/management-review" className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition-all font-medium">
          <FileText className="w-3.5 h-3.5" /> Management Review
        </Link>
        <Link href="/new-laws" className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-all font-medium">
          <RefreshCw className="w-3.5 h-3.5" /> ตรวจสอบจากราชกิจจาฯ
        </Link>
      </div>

      {/* Category Tree */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {displayCategories.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">ไม่พบกฎหมายที่ตรงกับตัวกรอง</p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="mt-2 text-blue-600 text-xs hover:underline">ล้างตัวกรอง</button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayCategories.map((cat) => {
              const catLaws = getLawsByCategory(cat.id)
              if (catLaws.length === 0) return null
              const stats = complianceStats(catLaws)
              const isExpanded = expandedCategory === cat.id

              return (
                <div key={cat.id}>
                  {/* Category Row */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="w-full px-5 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#3B82F6' }} />
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-slate-800 text-sm">{cat.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500">{stats.total} ฉบับ</span>
                        <span className="text-xs text-emerald-600 font-medium">✓ {stats.compliant}</span>
                        {stats.nonCompliant > 0 && <span className="text-xs text-red-500 font-medium">✗ {stats.nonCompliant}</span>}
                        {stats.pending > 0 && <span className="text-xs text-amber-500 font-medium">◷ {stats.pending}</span>}
                      </div>
                    </div>
                    {/* Mini progress bar */}
                    <div className="flex items-center gap-2 w-36">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-9 text-right">{stats.pct}%</span>
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>

                  {/* Year Groups */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 border-t border-slate-100">
                      {(() => {
                        const byYear = catLaws.reduce((acc, law) => {
                          const y = extractYearBE(law)
                          const key = y ? y.toString() : 'ไม่ระบุปี'
                          if (!acc[key]) acc[key] = []
                          acc[key].push(law)
                          return acc
                        }, {})
                        const sortedYears = Object.keys(byYear).sort((a, b) => {
                          if (a === 'ไม่ระบุปี') return 1
                          if (b === 'ไม่ระบุปี') return -1
                          return parseInt(b) - parseInt(a)
                        })
                        return sortedYears.map(year => {
                          const yearLaws = byYear[year]
                          const ys = complianceStats(yearLaws)
                          const yKey = `${cat.id}-${year}`
                          const isYearExpanded = expandedYear === yKey
                          return (
                            <div key={year} className="border-b border-slate-100 last:border-0">
                              <button
                                onClick={() => setExpandedYear(isYearExpanded ? null : yKey)}
                                className="w-full px-8 py-3 hover:bg-white/70 transition-colors flex items-center gap-3"
                              >
                                {isYearExpanded
                                  ? <ChevronDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
                                <span className="font-semibold text-slate-700 text-sm flex-1 text-left">ปี {year}</span>
                                <span className="text-xs text-slate-500">{ys.total} ฉบับ</span>
                                <div className="flex items-center gap-1.5 w-28">
                                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${ys.pct}%` }} />
                                  </div>
                                  <span className="text-xs font-bold text-slate-600 w-9 text-right">{ys.pct}%</span>
                                </div>
                              </button>
                              {isYearExpanded && (
                                <div className="bg-white border-t border-slate-100 divide-y divide-slate-50">
                                  {yearLaws.map(law => <LawRow key={law.id} law={law} />)}
                                </div>
                              )}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  }
  const textColors = {
    blue: 'text-blue-900',
    emerald: 'text-emerald-900',
    red: 'text-red-900',
    violet: 'text-violet-900',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 border ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${textColors[color]}`}>{value}</p>
    </div>
  )
}

function LawRow({ law }) {
  const status = normalizeComplianceStatus(law.compliance_status)
  const isCompliant = status === 'compliant'
  const isNonCompliant = status === 'non_compliant'

  return (
    <Link href={`/legal/${law.id}`}>
      <div className="px-8 py-3.5 hover:bg-blue-50/50 transition-colors cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Status indicator */}
          <div className="mt-1 flex-shrink-0">
            {isCompliant
              ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              : isNonCompliant
              ? <XCircle className="w-4 h-4 text-red-500" />
              : <Clock className="w-4 h-4 text-amber-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
              {law.title}
            </p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {law.law_code && (
                <span className="text-xs text-slate-400 font-mono">{law.law_code}</span>
              )}
              <span className={`badge text-[10px] ${isCompliant ? 'badge-low' : isNonCompliant ? 'badge-critical' : 'badge-medium'}`}>
                {isCompliant ? 'สอดคล้อง' : isNonCompliant ? 'ไม่สอดคล้อง' : 'รอตรวจสอบ'}
              </span>
              {law.priority && (
                <span className={`badge text-[10px] ${law.priority === 'critical' ? 'badge-critical' : law.priority === 'high' ? 'badge-high' : 'badge-low'}`}>
                  {law.priority === 'critical' ? 'วิกฤต' : law.priority === 'high' ? 'สูง' : 'ปกติ'}
                </span>
              )}
              {law.review_frequency && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {law.review_frequency}
                </span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 text-right">
            {law.responsible_person && (
              <p className="text-xs text-slate-500">{law.responsible_person}</p>
            )}
            {law.effective_date && (
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(law.effective_date).toLocaleDateString('th-TH')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
