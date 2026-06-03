import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { FileText, Calendar, CheckCircle, AlertCircle, Plus, Search } from 'lucide-react'
import { getManagementReviews, getNonCompliantLaws } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function ManagementReview() {
  const [reviews, setReviews] = useState([])
  const [nonCompliantLaws, setNonCompliantLaws] = useState([])
  const [activeTab, setActiveTab] = useState('summary') // summary, corrective, documents
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reviewsRes, nonCompliantRes] = await Promise.all([
        getManagementReviews(),
        getNonCompliantLaws()
      ])
      setReviews(reviewsRes.data || [])
      setNonCompliantLaws(nonCompliantRes.data || [])
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter(review =>
    review.laws?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.laws?.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSummaryStats = () => {
    return {
      total: nonCompliantLaws.length,
      pendingCorrection: nonCompliantLaws.length,
      resolved: reviews.filter(review =>
        Number(review.compliant_items || 0) > 0 &&
        Number(review.non_compliant_items || 0) === 0
      ).length
    }
  }

  const stats = getSummaryStats()

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
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Management Review</h1>
              <p className="text-slate-600">ติดตามการแก้ไขและการประเมินความสอดคล้อง</p>
            </div>
          </div>
          <Link
            href="/legal/add-corrective-action"
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium transition"
          >
            <Plus className="w-5 h-5" />
            เพิ่มการแก้ไข
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium mb-1">ไม่สอดคล้องทั้งหมด</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-yellow-600 font-medium mb-1">รอการแก้ไข</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pendingCorrection}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium mb-1">แก้ไขเรียบร้อย</p>
          <p className="text-2xl font-bold text-green-900">{stats.resolved}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'summary'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          สรุปการแก้ไข
        </button>
        <button
          onClick={() => setActiveTab('corrective')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'corrective'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          แผนแก้ไข ({nonCompliantLaws.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-3 font-medium transition ${
            activeTab === 'documents'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          เอกสารที่เกี่ยวข้อง
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">สรุปผลการประเมินล่าสุด</h3>
            {reviews.length === 0 ? (
              <p className="text-gray-500">ยังไม่มีการประเมิน</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0">
                    <Calendar className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">
                        {review.laws?.title || 'ไม่ระบุ'}
                      </p>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>
                          <span className="font-medium">ข้อที่สอดคล้อง:</span> {review.compliant_items || 0}
                        </p>
                        <p>
                          <span className="font-medium">ข้อที่ไม่สอดคล้อง:</span> {review.non_compliant_items || 0}
                        </p>
                        <p>
                          <span className="font-medium">ประเมินเมื่อ:</span> {new Date(review.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'corrective' && (
        <div className="space-y-3">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหากฎหมายที่ไม่สอดคล้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {nonCompliantLaws.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-slate-600">ดีที่สุด สอดคล้องกฎหมายทั้งหมดแล้ว</p>
            </div>
          ) : (
            nonCompliantLaws
              .filter(law =>
                law.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                law.id?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((law) => (
                <div
                  key={law.id}
                  className="bg-white border border-yellow-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-xs text-slate-500">{law.id}</span>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{law.title}</h3>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>
                          <span className="font-medium">สถานะ:</span> ไม่สอดคล้อง
                        </p>
                        <p>
                          <span className="font-medium">หน่วยรับผิดชอบ:</span> {law.responsible_unit || '-'}
                        </p>
                        {law.remarks && (
                          <p>
                            <span className="font-medium">หมายเหตุ:</span> {law.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/legal/${law.id}/edit-corrective`}
                      className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm font-medium transition"
                    >
                      แก้ไข
                    </Link>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">เอกสารที่เกี่ยวข้องกับการแก้ไข</h3>
          <div className="space-y-3">
            {nonCompliantLaws.map((law) => (
              law.related_documents && (
                <div key={law.id} className="p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="font-medium text-slate-900 mb-2">{law.title}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">เอกสาร:</span> {law.related_documents}
                  </p>
                </div>
              )
            ))}
            {nonCompliantLaws.filter(l => l.related_documents).length === 0 && (
              <p className="text-gray-500 text-center py-8">ไม่มีเอกสารที่เกี่ยวข้อง</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
