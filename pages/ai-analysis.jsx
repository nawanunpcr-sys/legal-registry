import Layout from '../components/Layout'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function AiAnalysisPage() {
  return (
    <Layout>
      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="hero-pill mb-3">AI วิเคราะห์</div>
            <h1 className="page-title">ระบบวิเคราะห์ด้วย AI</h1>
            <p className="section-subtitle max-w-2xl">
              ใช้ AI เพื่อวิเคราะห์กฎหมาย ประเมินความสอดคล้อง และสร้างข้อสรุปอัตโนมัติ
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-blue-50 px-4 py-3 text-blue-700">
            <Sparkles className="w-4 h-4" />
            กำลังพัฒนาฟีเจอร์เพิ่มเติม
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {[
            { title: 'วิเคราะห์กฎหมาย', description: 'สร้างสรุปและคำแนะนำจากข้อมูลกฎหมายที่บันทึก', action: 'ไปยังหน้าทดลอง' },
            { title: 'ประเมินความสอดคล้อง', description: 'ดูข้อมูลการประเมินและสถานะความสอดคล้อง', action: 'ดูรายงาน' },
            { title: 'สรุปองค์กร', description: 'ติดตามแนวโน้มและงานที่ต้องเร่งด่วน', action: 'ตรวจสอบสรุป' },
          ].map((item) => (
            <div key={item.title} className="action-card">
              <h2 className="section-title">{item.title}</h2>
              <p className="text-slate-600 mt-2">{item.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                {item.action}
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200/80 bg-slate-50 p-6">
          <p className="text-slate-700">หมายเหตุ:</p>
          <p className="text-slate-500 mt-2">ฟีเจอร์ AI ยังอยู่ในขั้นพัฒนา หากต้องการเชื่อมต่อข้อมูลจริง กรุณาตั้งค่า API และโมเดลในระบบเพิ่มเติม.</p>
        </div>
      </div>
    </Layout>
  )
}
