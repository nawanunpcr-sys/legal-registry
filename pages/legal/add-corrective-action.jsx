import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Plus, ChevronLeft, CheckCircle } from 'lucide-react'
import { supabase, getLaws } from '../../lib/supabase'
import { isNonCompliantStatus } from '../../lib/statusUtils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

export default function AddCorrectiveAction() {
  const [laws, setLaws] = useState([])
  const [formData, setFormData] = useState({
    law_id: '',
    notes: '',
    timeline: '',
    responsible_unit: '',
    compliant_items: '',
    non_compliant_items: ''
  })
  const [loading, setLoading] = useState(false)
  const [pageLoding, setPageLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchLaws()
  }, [])

  const fetchLaws = async () => {
    try {
      const res = await getLaws()
      setLaws(res.data?.filter(l => !l.is_cancelled && isNonCompliantStatus(l.compliance_status)) || [])
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setPageLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.law_id) {
      toast.error('กรุณาเลือกกฎหมาย')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('compliance_logs')
        .insert([
          {
            law_id: formData.law_id,
            assessment_date: new Date().toISOString().split('T')[0],
            notes: formData.notes,
            timeline: formData.timeline,
            responsible_unit: formData.responsible_unit,
            compliant_items: parseInt(formData.compliant_items) || 0,
            non_compliant_items: parseInt(formData.non_compliant_items) || 0
          }
        ])

      if (error) throw error

      toast.success('เพิ่มการแก้ไขสำเร็จ')
      router.push('/legal/management-review')
    } catch (error) {
      console.error('Error:', error)
      toast.error('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoding) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/legal/management-review"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            กลับ
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">เพิ่มการแก้ไข</h1>
              <p className="text-slate-600">บันทึกผลการแก้ไขและแผนการดำเนินการ</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Law Selection */}
            <div>
              <label htmlFor="law_id" className="block text-sm font-semibold text-slate-900 mb-2">
                เลือกกฎหมาย *
              </label>
              <select
                id="law_id"
                name="law_id"
                value={formData.law_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              >
                <option value="">-- เลือกกฎหมาย --</option>
                {laws.map(law => (
                  <option key={law.id} value={law.id}>
                    {law.title} ({law.law_code})
                  </option>
                ))}
              </select>
              {laws.length === 0 && (
                <p className="text-sm text-amber-600 mt-2">ไม่มีกฎหมายที่ต้องการแก้ไข</p>
              )}
            </div>

            {/* Compliance Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="compliant_items" className="block text-sm font-semibold text-slate-900 mb-2">
                  จำนวนข้อกำหนดที่สอดคล้อง
                </label>
                <input
                  type="number"
                  id="compliant_items"
                  name="compliant_items"
                  value={formData.compliant_items}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label htmlFor="non_compliant_items" className="block text-sm font-semibold text-slate-900 mb-2">
                  จำนวนข้อกำหนดที่ไม่สอดคล้อง
                </label>
                <input
                  type="number"
                  id="non_compliant_items"
                  name="non_compliant_items"
                  value={formData.non_compliant_items}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Responsible Unit */}
            <div>
              <label htmlFor="responsible_unit" className="block text-sm font-semibold text-slate-900 mb-2">
                หน่วยงานที่รับผิดชอบ
              </label>
              <input
                type="text"
                id="responsible_unit"
                name="responsible_unit"
                value={formData.responsible_unit}
                onChange={handleChange}
                placeholder="เช่น ฝ่าย EHS, แผนก HR"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Timeline */}
            <div>
              <label htmlFor="timeline" className="block text-sm font-semibold text-slate-900 mb-2">
                กำหนดเวลา / แผนการแก้ไข
              </label>
              <textarea
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                placeholder="เช่น กำหนดแก้ไข 30 วัน, ดำเนินการในช่วง Q1"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-slate-900 mb-2">
                หมายเหตุ / รายละเอียดการแก้ไข
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="อธิบายรายละเอียดการแก้ไข สิ่งที่ทำ เอกสารที่เกี่ยวข้อง เป็นต้น"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
                {loading ? 'กำลังบันทึก...' : 'เพิ่มการแก้ไข'}
              </button>
              <Link
                href="/legal/management-review"
                className="px-6 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition"
              >
                ยกเลิก
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
