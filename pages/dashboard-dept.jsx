import Layout from '../components/Layout'
import { Building2, Layers, BarChart3 } from 'lucide-react'

export default function DashboardDeptPage() {
  return (
    <Layout>
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <div className="hero-pill mb-3">Dashboard แผนก</div>
            <h1 className="page-title">ภาพรวม Dashboard แผนก</h1>
            <p className="section-subtitle max-w-2xl">
              ติดตามการดำเนินการตามแผนก ดูผลการปฏิบัติงาน และสถานะความเสี่ยงของแต่ละหน่วยงาน.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-slate-700">
            <Building2 className="w-4 h-4" />
            เหมาะสำหรับการบริหารจัดการ
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">แผนก</h2>
            <p className="text-slate-600 mt-3">ดูรายชื่อแผนกทั้งหมดและสถานะการปฏิบัติงาน.</p>
          </div>
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">งานแผนก</h2>
            <p className="text-slate-600 mt-3">ติดตามงานที่มอบหมายและความคืบหน้าในแต่ละแผนก.</p>
          </div>
          <div className="card bg-slate-50 border-slate-200/70">
            <h2 className="section-title">คะแนนสอดคล้อง</h2>
            <p className="text-slate-600 mt-3">วัดระดับความสอดคล้องของแต่ละทีมในองค์กร.</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
