import Layout from '../components/Layout'
import { Shield, ChartBar } from 'lucide-react'

export default function CompliancePage() {
  return (
    <Layout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="hero-pill mb-3">การประเมินความสอดคล้อง</div>
            <h1 className="page-title">ผลการประเมินความสอดคล้อง</h1>
            <p className="section-subtitle max-w-2xl">
              ดูผลการประเมินความสอดคล้องตามกฎหมายและแผนก พร้อมกับสถานะที่ชัดเจน.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-blue-50 px-4 py-3 text-blue-700">
            <ChartBar className="w-4 h-4" />
            วิเคราะห์เชิงข้อมูล
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">สอดคล้อง</h2>
            <p className="text-slate-600 mt-3">แสดงรายการที่ผ่านการประเมินและบ่งชี้ความพร้อมขององค์กร.</p>
          </div>
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">บางส่วน</h2>
            <p className="text-slate-600 mt-3">แสดงรายการที่ยังต้องปรับปรุงเพื่อให้ถูกต้องตามเกณฑ์.</p>
          </div>
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">ไม่สอดคล้อง</h2>
            <p className="text-slate-600 mt-3">ข้อมูลที่ต้องการการตรวจสอบเพิ่มเติมและแก้ไขทันที.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
