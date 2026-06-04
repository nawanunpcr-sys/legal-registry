import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { BookOpen, ChevronDown, ChevronRight, Search, Plus, AlertCircle, Download, Trash2, FileText } from 'lucide-react'
import { getLaws, getCategories } from '../../lib/supabase'
import { isCompliantStatus, isNonCompliantStatus, normalizeComplianceStatus } from '../../lib/statusUtils'
import { exportToCsv, exportToExcel } from '../../lib/exportUtils'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LegalRegistry() {
  const [categories, setCategories] = useState([])
  const [laws, setLaws] = useState([])
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedYear, setExpandedYear] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [categoriesRes, lawsRes] = await Promise.all([
        getCategories(),
        getLaws()
      ])
      setCategories(categoriesRes.data || [])
      setLaws(lawsRes.data || [])
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const filteredLaws = laws.filter(law =>
    law.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    law.law_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const activeFilteredLaws = filteredLaws.filter(law => !law.is_cancelled)
  const compliantCount = activeFilteredLaws.filter(law => isCompliantStatus(law.compliance_status)).length
  const nonCompliantCount = activeFilteredLaws.filter(law => isNonCompliantStatus(law.compliance_status)).length
  const displayCategories = [
    ...categories,
    ...(filteredLaws.some(law => !law.category_id)
      ? [{ id: 'uncategorized', name: 'ไม่ระบุหมวดหมู่', color: '#64748B' }]
      : []),
  ]

  const extractYear = (law) => {
    if (law.effective_date) {
      const d = new Date(law.effective_date)
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear()
        return (year >= 2400 ? year : year + 543).toString()
      }
    }
    if (law.announced_date) {
      const d = new Date(law.announced_date)
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear()
        return (year >= 2400 ? year : year + 543).toString()
      }
    }
    const match = law.title?.match(/พ\.ศ\.\s*(\d{4})/)
    if (match) return match[1]
    return 'ไม่ระบุปี'
  }

  const getLawsByCategory = (categoryId) => {
    if (categoryId === 'uncategorized') {
      return activeFilteredLaws.filter(law => !law.category_id)
    }

    return activeFilteredLaws.filter(law => law.category_id === categoryId)
  }

  const complianceStats = (laws) => {
    if (!laws.length) return { compliant: 0, nonCompliant: 0, total: 0, percentage: 0 }
    const activeLaws = laws.filter(l => !l.is_cancelled)
    const compliant = activeLaws.filter(l => isCompliantStatus(l.compliance_status)).length
    return {
      compliant,
      nonCompliant: activeLaws.filter(l => isNonCompliantStatus(l.compliance_status)).length,
      total: activeLaws.length,
      percentage: activeLaws.length > 0
        ? Math.round((compliant / activeLaws.length) * 100)
        : 0
    }
  }

  const exportColumns = [
    { label: 'รหัสกฎหมาย', value: (law) => law.law_code },
    { label: 'ชื่อกฎหมาย', value: (law) => law.title },
    { label: 'หมวดหมู่', value: (law) => law.law_categories?.name },
    { label: 'สถานะ', value: (law) => law.compliance_status },
    { label: 'ความสำคัญ', value: (law) => law.priority },
    { label: 'ผู้รับผิดชอบ', value: (law) => law.responsible_person },
    { label: 'วันที่บังคับใช้', value: (law) => law.effective_date },
    { label: 'ความถี่ตรวจติดตาม', value: (law) => law.review_frequency },
    {
      label: 'แผนกที่เกี่ยวข้อง',
      value: (law) => law.law_department_mapping?.map((item) => item.departments?.name).filter(Boolean),
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ทะเบียนกฎหมาย</h1>
              <p className="text-slate-600">จัดการและติดตามการสอดคล้องกฎหมาย</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Link
              href="/legal/repealed"
              className="flex items-center gap-2 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 font-medium transition"
            >
              <Trash2 className="w-4 h-4" />
              กฎหมายที่ยกเลิก
            </Link>
            <Link
              href="/legal/management-review"
              className="flex items-center gap-2 bg-purple-100 border border-purple-300 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 font-medium transition"
            >
              <FileText className="w-4 h-4" />
              Management Review
            </Link>
            <button
              type="button"
              onClick={() => exportToCsv(filteredLaws, exportColumns, 'legal-registry.csv')}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium transition"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportToExcel(filteredLaws, exportColumns, 'legal-registry.xls')}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium transition"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <Link
              href="/legal/add"
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
            >
              <Plus className="w-5 h-5" />
              เพิ่มกฎหมาย
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหากฎหมาย..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium mb-1">รวมกฎหมายทั้งหมด</p>
          <p className="text-2xl font-bold text-blue-900">{activeFilteredLaws.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium mb-1">สอดคล้องแล้ว</p>
          <p className="text-2xl font-bold text-green-900">
            {compliantCount}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium mb-1">ไม่สอดคล้อง</p>
          <p className="text-2xl font-bold text-red-900">
            {nonCompliantCount}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
          <p className="text-sm text-amber-600 font-medium mb-1">อัตราสอดคล้อง</p>
          <p className="text-2xl font-bold text-amber-900">
            {activeFilteredLaws.length > 0
              ? Math.round((compliantCount / activeFilteredLaws.length) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Categories and Laws */}
      <div className="bg-white rounded-lg shadow">
        {displayCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ไม่มีหมวดหมู่กฎหมาย</p>
          </div>
        ) : (
          <div className="divide-y">
            {displayCategories.map((category) => {
              const categoryLaws = getLawsByCategory(category.id)
              const stats = complianceStats(categoryLaws)
              const isExpanded = expandedCategory === category.id

              return (
                <div key={category.id}>
                  {/* Category Header */}
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category.id)
                    }
                    className="w-full px-6 py-4 hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              category.color || '#3B82F6'
                          }}
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {category.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {stats.total} กฎหมาย •{' '}
                            <span className="text-green-600">
                              สอดคล้อง {stats.compliant}
                            </span>{' '}
                            •{' '}
                            <span className="text-red-600">
                              ไม่สอดคล้อง {stats.nonCompliant}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-slate-900">
                        {stats.percentage}%
                      </p>
                      <p className="text-xs text-gray-500">สอดคล้อง</p>
                    </div>
                  </button>

                  {/* Years List */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t">
                      {categoryLaws.length === 0 ? (
                        <div className="px-6 py-4 text-center text-gray-500 text-sm">
                          ไม่มีกฎหมายในหมวดนี้
                        </div>
                      ) : (
                        <div className="divide-y border-t border-slate-200">
                          {(() => {
                            const byYear = categoryLaws.reduce((acc, law) => {
                              const year = extractYear(law)
                              if (!acc[year]) acc[year] = []
                              acc[year].push(law)
                              return acc
                            }, {})
                            
                            const sortedYears = Object.keys(byYear).sort((a, b) => {
                              if (a === 'ไม่ระบุปี') return 1
                              if (b === 'ไม่ระบุปี') return -1
                              return parseInt(b) - parseInt(a)
                            })

                            return sortedYears.map(year => {
                              const yearLaws = byYear[year]
                              const yearStats = complianceStats(yearLaws)
                              const isYearExpanded = expandedYear === `${category.id}-${year}`

                              return (
                                <div key={year} className="bg-white">
                                  <button
                                    onClick={() => setExpandedYear(isYearExpanded ? null : `${category.id}-${year}`)}
                                    className="w-full px-8 py-3 hover:bg-slate-50 transition flex items-center justify-between border-b border-slate-100"
                                  >
                                    <div className="flex items-center gap-3 text-left">
                                      {isYearExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-blue-500" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                      )}
                                      <div>
                                        <h4 className="font-semibold text-slate-800">ปี {year}</h4>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                      <div className="text-right text-xs text-slate-500">
                                        รวม {yearStats.total} ฉบับ
                                      </div>
                                      <div className="text-right flex items-center gap-2">
                                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                                          <div 
                                            className="bg-emerald-500 h-2 rounded-full" 
                                            style={{ width: `${yearStats.percentage}%` }}
                                          />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 w-12">{yearStats.percentage}%</span>
                                      </div>
                                    </div>
                                  </button>
                                  
                                  {isYearExpanded && (
                                    <div className="bg-slate-50/50">
                                      {yearLaws.map((law) => (
                                        <LawListItem key={law.id} law={law} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          })()}
                        </div>
                      )}
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

function LawListItem({ law }) {
  const status = normalizeComplianceStatus(law.compliance_status)
  const isCompliant = status === 'compliant'
  const isNonCompliant = status === 'non_compliant'

  return (
    <Link href={`/legal/${law.id}`}>
      <div className="px-6 py-4 hover:bg-blue-50 transition cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-slate-900 mb-1">
              {law.title}
            </h4>
            <p className="text-xs text-gray-600 mb-2">
              รหัส: {law.law_code || law.id}
            </p>
            {(law.description || law.review_frequency || law.responsible_person) && (
              <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                {law.description || `ตรวจติดตาม: ${law.review_frequency || '-'} • ผู้รับผิดชอบ: ${law.responsible_person || '-'}`}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isCompliant
                    ? 'bg-green-100 text-green-700'
                    : isNonCompliant
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isCompliant
                  ? 'สอดคล้อง'
                  : isNonCompliant
                  ? 'ไม่สอดคล้อง'
                  : 'รอตรวจสอบ'}
              </span>
              {law.priority && (
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    law.priority === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : law.priority === 'high'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {law.priority === 'critical'
                    ? 'วิกฤต'
                    : law.priority === 'high'
                    ? 'สูง'
                    : 'ปกติ'}
                </span>
              )}
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm font-medium text-gray-600">
              {law.last_updated
                ? new Date(law.last_updated).toLocaleDateString('th-TH')
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
