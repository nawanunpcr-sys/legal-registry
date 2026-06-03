import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import { Shield, ChartBar, Download, LayoutDashboard, Building2, AlertCircle } from 'lucide-react'
import { getCompliance } from '../lib/supabase'
import { normalizeComplianceStatus } from '../lib/statusUtils'
import { exportToCsv, exportToExcel } from '../lib/exportUtils'
import toast from 'react-hot-toast'

const statusMeta = {
  compliant: { label: 'สอดคล้อง', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  partial: { label: 'บางส่วน', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  non_compliant: { label: 'ไม่สอดคล้อง', className: 'bg-red-50 text-red-700 border-red-200' },
  not_evaluated: { label: 'ยังไม่ประเมิน', className: 'bg-slate-50 text-slate-700 border-slate-200' },
}

export default function CompliancePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompliance()
  }, [])

  const loadCompliance = async () => {
    setLoading(true)
    try {
      const { data, error } = await getCompliance()
      if (error) throw error
      setRecords(data || [])
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูลความสอดคล้องได้')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = records.length
    const normalizedRecords = records.map((item) => normalizeComplianceStatus(item.compliance_status))
    const compliant = normalizedRecords.filter((status) => status === 'compliant').length
    const partial = normalizedRecords.filter((status) => status === 'partial').length
    const nonCompliant = normalizedRecords.filter((status) => status === 'non_compliant').length
    const notEvaluated = normalizedRecords.filter((status) => status === 'not_evaluated').length
    return {
      total,
      compliant,
      partial,
      nonCompliant,
      notEvaluated,
      rate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    }
  }, [records])

  const exportColumns = [
    { label: 'กฎหมาย', value: (item) => item.laws?.title },
    { label: 'รหัสกฎหมาย', value: (item) => item.laws?.law_code },
    { label: 'แผนก', value: (item) => item.departments?.name },
    { label: 'สถานะ', value: (item) => statusMeta[normalizeComplianceStatus(item.compliance_status)]?.label || item.compliance_status },
    { label: 'คะแนน', value: (item) => item.compliance_score },
    { label: 'งานที่เกี่ยวข้อง', value: (item) => item.tasks?.title },
  ]

  return (
    <Layout>
      <div className="card mb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="hero-pill mb-3">การประเมินความสอดคล้อง</div>
            <h1 className="page-title">ผลการประเมินความสอดคล้อง</h1>
            <p className="section-subtitle max-w-2xl">
              ข้อมูลหน้านี้เชื่อมกับ Supabase และสะท้อนกลับไปยัง Dashboard องค์กรกับ Dashboard แผนกทันทีเมื่อมีการบันทึกผล.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="btn-secondary">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/dashboard-dept" className="btn-secondary">
              <Building2 className="w-4 h-4" />
              แผนก
            </Link>
            <button
              type="button"
              onClick={() => exportToCsv(records, exportColumns, 'compliance-records.csv')}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={() => exportToExcel(records, exportColumns, 'compliance-records.xls')}
              className="btn-success"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-72">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-5 mb-6">
            <div className="card">
              <p className="text-xs font-bold text-slate-500 uppercase">รายการทั้งหมด</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-xs font-bold text-emerald-600 uppercase">สอดคล้อง</p>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{stats.compliant}</p>
            </div>
            <div className="card">
              <p className="text-xs font-bold text-amber-600 uppercase">บางส่วน</p>
              <p className="text-3xl font-bold text-amber-700 mt-2">{stats.partial}</p>
            </div>
            <div className="card">
              <p className="text-xs font-bold text-red-600 uppercase">ไม่สอดคล้อง</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{stats.nonCompliant}</p>
            </div>
            <div className="card">
              <p className="text-xs font-bold text-blue-600 uppercase">อัตราสอดคล้อง</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{stats.rate}%</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <ChartBar className="w-5 h-5 text-blue-600" />
              <h2 className="section-title">รายการติดตามความสอดคล้อง</h2>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                ยังไม่มีข้อมูลการประเมินความสอดคล้อง
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">กฎหมาย</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">แผนก</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">สถานะ</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900">คะแนน</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">งานที่เกี่ยวข้อง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const status = normalizeComplianceStatus(record.compliance_status)
                      const meta = statusMeta[status] || statusMeta.not_evaluated
                      return (
                        <tr key={record.id} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{record.laws?.title || '-'}</p>
                            <p className="text-xs text-slate-500">{record.laws?.law_code || '-'}</p>
                          </td>
                          <td className="px-4 py-3">{record.departments?.name || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${meta.className}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-900">
                            {record.compliance_score ?? 0}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{record.tasks?.title || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
