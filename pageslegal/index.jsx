import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { getLaws, supabase } from '../../lib/supabase'
import {
  BookOpen, Plus, Search, Edit3, Trash2,
  ExternalLink, AlertTriangle, CheckCircle,
  Filter, Download, Eye
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const priorityLabel = {
  critical: { label: 'วิกฤต', class: 'badge-critical' },
  high: { label: 'สูง', class: 'badge-high' },
  medium: { label: 'ปานกลาง', class: 'badge-medium' },
  low: { label: 'ต่ำ', class: 'badge-low' },
}

const statusLabel = {
  active: { label: '✅ ใช้งาน', class: 'status-active' },
  amended: { label: '🔄 แก้ไขแล้ว', class: 'status-pending' },
  repealed: { label: '❌ ยกเลิก', class: 'status-overdue' },
  pending: { label: '⏳ รอใช้งาน', class: 'status-pending' },
}
export default function LegalList() {
  const [laws, setLaws] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setFiltered(laws.filter(l =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.law_code?.toLowerCase().includes(search.toLowerCase())
    ))
  }, [search, laws])

  async function loadData() {
    const { data } = await getLaws()
    setLaws(data)
    setFiltered(data)
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันการลบกฎหมายนี้?')) return
    const { error } = await supabase.from('laws').delete().eq('id', id)
    if (!error) {
      toast.success('ลบกฎหมายเรียบร้อยแล้ว')
      loadData()
    } else {
      toast.error('เกิดข้อผิดพลาด: ' + error.message)
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            ทะเบียนกฎหมาย
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            จัดการรายการกฎหมายและข้อบังคับที่เกี่ยวข้อง
          </p>
        </div>
        <Link href="/legal/add" className="btn-primary">
          <Plus className="w-4 h-4" />
          เพิ่มกฎหมายใหม่
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหากฎหมาย..."
              className="input-field pl-11"
            />
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 
                          px-4 rounded-xl border border-gray-200">
            <Filter className="w-4 h-4" />
            <span>{filtered.length} รายการ</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">รหัส</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">ชื่อกฎหมาย</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">หมวดหมู่</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">ความสำคัญ</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">สถานะ</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-600 uppercase">แผนกที่เกี่ยวข้อง</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-600 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent 
                                   rounded-full animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    ไม่พบข้อมูลกฎหมาย
                  </td>
                </tr>
              ) : filtered.map(law => {
                const p = priorityLabel[law.priority] || priorityLabel.medium
                const s = statusLabel[law.status] || statusLabel.active
                const depts = law.law_department_mapping || []
                return (
                  <tr key={law.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(selected?.id === law.id ? null : law)}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 
                                       px-2 py-1 rounded-lg">{law.law_code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 text-sm max-w-xs truncate">
                        {law.title}
                      </p>
                      {law.issuing_authority && (
                        <p className="
