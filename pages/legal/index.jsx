import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { getLaws, supabase } from '../../lib/supabase'
import {
  BookOpen, Plus, Search, Filter, Trash2, Edit3,
  ExternalLink, AlertTriangle, CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const priorityLabel = {
  critical: { label: 'วิกฤต', className: 'badge-critical' },
  high: { label: 'สูง', className: 'badge-high' },
  medium: { label: 'ปานกลาง', className: 'badge-medium' },
  low: { label: 'ต่ำ', className: 'badge-low' },
}

const statusLabel = {
  active: { label: '✅ ใช้งาน', className: 'status-active' },
  amended: { label: '🔄 แก้ไขแล้ว', className: 'status-pending' },
  repealed: { label: '❌ ยกเลิก', className: 'status-overdue' },
  pending: { label: '⏳ รอใช้งาน', className: 'status-pending' },
}

export default function LegalList() {
  const [laws, setLaws] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      setFiltered(laws)
      return
    }
    setFiltered(laws.filter((law) =>
      law.title?.toLowerCase().includes(query) ||
      law.law_code?.toLowerCase().includes(query) ||
      law.law_categories?.name?.toLowerCase().includes(query)
    ))
  }, [search, laws])

  async function loadData() {
    setLoading(true)
    const { data, error } = await getLaws()
    if (error) {
      toast.error('ไม่สามารถดึงข้อมูลกฎหมายได้')
      setLaws([])
      setFiltered([])
    } else {
      setLaws(data)
      setFiltered(data)
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันการลบกฎหมายนี้?')) return
    const { error } = await supabase.from('laws').delete().eq('id', id)
    if (error) {
      toast.error('ลบไม่สำเร็จ: ' + error.message)
    } else {
      toast.success('ลบกฎหมายเรียบร้อยแล้ว')
      loadData()
    }
  }

  return (
    <Layout>
      <div className="mb-8 rounded-[32px] border border-slate-200/70 bg-white/95 p-8 shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="hero-pill mb-3">ทะเบียนกฎหมาย</div>
            <h1 className="page-title">จัดการรายการกฎหมาย</h1>
            <p className="section-subtitle max-w-2xl">
              ดูรายการกฎหมายทั้งหมด ค้นหา และจัดการข้อมูลได้อย่างชัดเจน
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/legal/add" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มกฎหมายใหม่
            </Link>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-4 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหากฎหมาย รหัส หรือหมวดหมู่"
              className="input-field pl-11"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-slate-600">
              <Filter className="w-4 h-4" />
              {filtered.length} รายการ
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                {['รหัส', 'ชื่อกฎหมาย', 'หมวดหมู่', 'ความสำคัญ', 'สถานะ', 'แผนกที่เกี่ยวข้อง', 'จัดการ'].map((label) => (
                  <th key={label} className="px-6 py-4 text-left font-semibold uppercase tracking-[0.08em] text-[11px]">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    ไม่พบข้อมูลกฎหมาย
                  </td>
                </tr>
              ) : (
                filtered.map((law) => {
                  const p = priorityLabel[law.priority] || priorityLabel.medium
                  const s = statusLabel[law.status] || statusLabel.active
                  const depts = law.law_department_mapping || []
                  return (
                    <tr key={law.id} className="hover:bg-slate-50 transition-colors" onClick={() => setSelectedId(selectedId === law.id ? null : law.id)}>
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex rounded-2xl bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{law.law_code || '-'}</span>
                      </td>
                      <td className="px-6 py-4 align-top max-w-[320px]">
                        <p className="font-medium text-slate-900">{law.title || 'ไม่ระบุชื่อกฎหมาย'}</p>
                        {law.issuing_authority && <p className="text-xs text-slate-500 mt-1 truncate">{law.issuing_authority}</p>}
                      </td>
                      <td className="px-6 py-4 align-top text-slate-700">
                        {law.law_categories?.name || '-' }
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`badge ${p.className}`}>{p.label}</span>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className={`badge ${s.className}`}>{s.label}</span>
                      </td>
                      <td className="px-6 py-4 align-top text-slate-700">
                        {depts.length > 0 ? depts.map((d) => d.departments?.name || d.name).join(', ') : '-'}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className="btn-secondary inline-flex items-center gap-2">
                            <Edit3 className="w-4 h-4" /> แก้ไข
                          </button>
                          <button type="button" className="btn-danger inline-flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleDelete(law.id) }}>
                            <Trash2 className="w-4 h-4" /> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
