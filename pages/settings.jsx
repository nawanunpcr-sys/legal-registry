import Layout from '../components/Layout'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <Layout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="hero-pill mb-3">ตั้งค่าระบบ</div>
            <h1 className="page-title">การตั้งค่าระบบ</h1>
            <p className="section-subtitle max-w-2xl">
              จัดการการตั้งค่าโปรเจกต์และข้อมูลพื้นฐานของระบบได้ที่หน้าเดียว.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-slate-700">
            <Settings className="w-4 h-4" />
            ปรับแต่งได้ง่าย
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">ข้อมูลระบบ</h2>
            <p className="text-slate-600 mt-3">ตัวเลือกการตั้งค่า เช่น การแสดงผลและสิทธิ์ผู้ใช้งาน.</p>
          </div>
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">การเชื่อมต่อ</h2>
            <p className="text-slate-600 mt-3">ตั้งค่าการเชื่อมต่อกับ Supabase, AI API และบริการอื่น ๆ.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
