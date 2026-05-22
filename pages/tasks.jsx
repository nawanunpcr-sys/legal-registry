import Layout from '../components/Layout'
import { ClipboardList, CheckCircle2 } from 'lucide-react'

export default function TasksPage() {
  return (
    <Layout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="hero-pill mb-3">งานและการส่ง</div>
            <h1 className="page-title">มอบหมายงานและติดตามผล</h1>
            <p className="section-subtitle max-w-2xl">
              จัดการงานตามแผนก ติดตามการอนุมัติ และดูสถานะของงานในแต่ละขั้นตอน
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-emerald-50 px-4 py-3 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            ระบบงานพร้อมใช้งาน
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">งานที่ต้องอนุมัติ</h2>
            <p className="text-slate-600 mt-3">ยังไม่มีงานที่รออนุมัติในตอนนี้ หากมีงานใหม่จะปรากฏที่นี่</p>
          </div>
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">ภาพรวมสถานะงาน</h2>
            <p className="text-slate-600 mt-3">ดูสถานะงานทั้งหมดตามแผนก และตรวจสอบว่ามีงานไหนที่ต้องเร่งด่วน</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
