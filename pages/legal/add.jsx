import { useState } from 'react'
import Layout from '../../components/Layout'
import { PlusCircle, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AddLawPage() {
  const [form, setForm] = useState({ law_code: '', title: '', category: '', status: 'active', priority: 'medium' })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    toast.success('ฟอร์มบันทึกข้อมูลฟีเจอร์ยังไม่พร้อมใช้งาน')
  }

  return (
    <Layout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="hero-pill mb-3">กฎหมาย</div>
            <h1 className="page-title">เพิ่มกฎหมายใหม่</h1>
            <p className="section-subtitle max-w-2xl">
              กรอกข้อมูลกฎหมายเพื่อเพิ่มเข้าในระบบและจัดการการแสดงผลต่อไป.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-slate-800">
            <PlusCircle className="w-4 h-4" />
            แบบฟอร์มจัดการง่าย
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">รหัสกฎหมาย</label>
            <input
              name="law_code"
              value={form.law_code}
              onChange={handleChange}
              className="input-field"
              placeholder="เช่น L1234"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">ชื่อกฎหมาย</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="input-field"
              placeholder="ชื่อกฎหมาย"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">หมวดหมู่</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input-field"
              placeholder="เช่น สิ่งแวดล้อม"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">สถานะ</label>
            <select name="status" value={form.status} onChange={handleChange} className="select-field">
              <option value="active">ใช้งาน</option>
              <option value="amended">แก้ไขแล้ว</option>
              <option value="repealed">ยกเลิก</option>
              <option value="pending">รอใช้งาน</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">ความสำคัญ</label>
            <select name="priority" value={form.priority} onChange={handleChange} className="select-field">
              <option value="critical">วิกฤต</option>
              <option value="high">สูง</option>
              <option value="medium">ปานกลาง</option>
              <option value="low">ต่ำ</option>
            </select>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <label className="block text-sm font-medium text-slate-700">หมายเหตุเพิ่มเติม</label>
            <textarea
              rows={4}
              name="notes"
              value={form.notes || ''}
              onChange={handleChange}
              className="input-field resize-none"
              placeholder="ระบุรายละเอียดอื่น ๆ"
            />
          </div>

          <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-500 text-sm">การบันทึกจริงจะเชื่อมกับฐานข้อมูลเมื่อระบบพร้อมใช้งาน</p>
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" />
              บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
