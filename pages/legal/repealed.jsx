import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Trash2, ChevronRight, Search, AlertTriangle } from 'lucide-react'
import { getRepealedLaws } from '../../lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RepealedLaws() {
  const [laws, setLaws] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getRepealedLaws()
      setLaws(res.data || [])
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const filteredLaws = laws.filter(law =>
    law.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    law.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <div className="p-3 bg-red-100 rounded-lg">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">กฎหมายที่ยกเลิก</h1>
              <p className="text-slate-600">แสดงกฎหมายที่หมดอายุหรือยกเลิกแล้ว</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหากฎหมายที่ยกเลิก..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
          <p className="text-sm text-red-600 font-medium mb-1">รวมกฎหมายที่ยกเลิก</p>
          <p className="text-2xl font-bold text-red-900">{filteredLaws.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <p className="text-sm text-orange-600 font-medium mb-1">มีผลใช้งานจนถึง</p>
          <p className="text-xl font-bold text-orange-900">สำรวจและบันทึกหลากหลาย</p>
        </div>
      </div>

      {/* Content */}
      {filteredLaws.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">ไม่มีกฎหมายที่ยกเลิก</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLaws.map((law) => (
            <div
              key={law.id}
              className="bg-white border border-red-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                      ยกเลิก
                    </span>
                    <span className="text-xs text-slate-500">{law.id}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{law.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">กระทรวง:</span> {law.ministry || '-'}
                    </div>
                    <div>
                      <span className="font-medium">ประกาศเมื่อ:</span> {law.announced_date || '-'}
                    </div>
                    <div>
                      <span className="font-medium">บังคับใช้:</span> {law.effective_date || '-'}
                    </div>
                  </div>
                  {law.remarks && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <span className="font-medium">หมายเหตุ:</span> {law.remarks}
                    </div>
                  )}
                </div>
                <Link
                  href={`/legal/${law.id}`}
                  className="ml-4 p-2 hover:bg-gray-100 rounded transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
