import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { BookOpen, ChevronDown, ChevronRight, Search, Plus, AlertCircle } from 'lucide-react'
import { getLaws, getCategories } from '../../lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LegalRegistry() {
  const [categories, setCategories] = useState([])
  const [laws, setLaws] = useState([])
  const [expandedCategory, setExpandedCategory] = useState(null)
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

  const getLawsByCategory = (categoryId) => {
    return filteredLaws.filter(law => law.category_id === categoryId)
  }

  const complianceStats = (laws) => {
    if (!laws.length) return { compliant: 0, nonCompliant: 0, total: 0 }
    const compliant = laws.filter(l => l.compliance_status === 'compliant').length
    return {
      compliant,
      nonCompliant: laws.length - compliant,
      total: laws.length,
      percentage: Math.round((compliant / laws.length) * 100)
    }
  }

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
          <Link
            href="/legal/add"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
          >
            <Plus className="w-5 h-5" />
            เพิ่มกฎหมาย
          </Link>
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
          <p className="text-2xl font-bold text-blue-900">{filteredLaws.length}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium mb-1">สอดคล้องแล้ว</p>
          <p className="text-2xl font-bold text-green-900">
            {filteredLaws.filter(l => l.compliance_status === 'compliant').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium mb-1">ไม่สอดคล้อง</p>
          <p className="text-2xl font-bold text-red-900">
            {filteredLaws.filter(l => l.compliance_status === 'non-compliant').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
          <p className="text-sm text-amber-600 font-medium mb-1">อัตราสอดคล้อง</p>
          <p className="text-2xl font-bold text-amber-900">
            {filteredLaws.length > 0
              ? Math.round(
                  (filteredLaws.filter(l => l.compliance_status === 'compliant').length /
                    filteredLaws.length) *
                    100
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Categories and Laws */}
      <div className="bg-white rounded-lg shadow">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ไม่มีหมวดหมู่กฎหมาย</p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map((category) => {
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

                  {/* Laws List */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t">
                      {categoryLaws.length === 0 ? (
                        <div className="px-6 py-4 text-center text-gray-500 text-sm">
                          ไม่มีกฎหมายในหมวดนี้
                        </div>
                      ) : (
                        <div className="divide-y">
                          {categoryLaws.map((law) => (
                            <Link
                              key={law.id}
                              href={`/legal/${law.id}`}
                            >
                              <div
                                className="px-6 py-4 hover:bg-blue-50 transition cursor-pointer"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 mb-1">
                                      {law.title}
                                    </h4>
                                    <p className="text-xs text-gray-600 mb-2">
                                      รหัส: {law.law_code}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                          law.compliance_status === 'compliant'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}
                                      >
                                        {law.compliance_status === 'compliant'
                                          ? '✓ สอดคล้อง'
                                          : '✗ ไม่สอดคล้อง'}
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
                          ))}
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
