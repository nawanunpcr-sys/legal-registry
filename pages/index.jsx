import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { getDashboardData, getRepealedLaws, supabase } from '../lib/supabase'
import { normalizeComplianceStatus } from '../lib/statusUtils'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Link from 'next/link'
import toast from 'react-hot-toast'

const MONTHS = [
  { value: '01', label: 'มกราคม' },
  { value: '02', label: 'กุมภาพันธ์' },
  { value: '03', label: 'มีนาคม' },
  { value: '04', label: 'เมษายน' },
  { value: '05', label: 'พฤษภาคม' },
  { value: '06', label: 'มิถุนายน' },
  { value: '07', label: 'กรกฎาคม' },
  { value: '08', label: 'สิงหาคม' },
  { value: '09', label: 'กันยายน' },
  { value: '10', label: 'ตุลาคม' },
  { value: '11', label: 'พฤศจิกายน' },
  { value: '12', label: 'ธันวาคม' },
]

const chartColors = {
  compliant: '#059669',
  partial: '#d97706',
  non_compliant: '#dc2626',
  not_evaluated: '#94a3b8',
}

const currentDate = new Date()
const defaultYear = String(currentDate.getFullYear())
const defaultMonth = String(currentDate.getMonth() + 1).padStart(2, '0')

function formatThaiYear(year) {
  const numericYear = Number(year)
  if (!Number.isFinite(numericYear)) return year
  return numericYear >= 2400 ? numericYear : numericYear + 543
}

export default function Dashboard() {
  const [data, setData] = useState({ laws: [], compliance: [] })
  const [repealedLaws, setRepealedLaws] = useState([])
  const [communications, setCommunications] = useState([])
  const [selectedYear, setSelectedYear] = useState(defaultYear)
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [dashboardData, repealedResult, communicationsResult] = await Promise.all([
          getDashboardData(),
          getRepealedLaws(),
          supabase.from('communication_matrix').select('*').order('seq_no'),
        ])

        setData(dashboardData)
        setRepealedLaws(repealedResult.data || [])
        setCommunications(communicationsResult.data || [])
      } catch (error) {
        toast.error('โหลดข้อมูลหน้าแรกไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const years = useMemo(() => {
    const sourceYears = data.laws
      .map((law) => law.effective_date || law.announced_date || law.created_at)
      .map((date) => {
        const parsed = new Date(date)
        return Number.isNaN(parsed.getTime()) ? null : String(parsed.getFullYear())
      })
      .filter(Boolean)
    return Array.from(new Set([defaultYear, ...sourceYears])).sort((a, b) => Number(b) - Number(a))
  }, [data.laws])

  const activeLaws = data.laws.filter((law) => !law.is_cancelled && law.status !== 'cancelled')
  const reportingRecords = data.compliance.filter((record) => {
    const dateValue = record.created_at || record.updated_at || record.assessment_date || record.effective_date
    if (!dateValue) return true
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return true
    return date.getFullYear() === Number(selectedYear) && String(date.getMonth() + 1).padStart(2, '0') === selectedMonth
  })

  const complianceSource = reportingRecords.length > 0
    ? reportingRecords
    : activeLaws.map((law) => ({ id: law.id, compliance_status: law.compliance_status }))

  const complianceCounts = complianceSource.reduce(
    (acc, item) => {
      const status = normalizeComplianceStatus(item.compliance_status)
      if (status === 'compliant') acc.compliant += 1
      else if (status === 'non_compliant') acc.nonCompliant += 1
      else if (status === 'partial') acc.partial += 1
      else acc.notEvaluated += 1
      return acc
    },
    { compliant: 0, nonCompliant: 0, partial: 0, notEvaluated: 0 }
  )

  const lawOverview = Object.values(
    activeLaws.reduce((acc, law) => {
      const categoryName = law.law_categories?.name || 'ไม่ระบุหมวดหมู่'
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          total: 0,
          compliant: 0,
          nonCompliant: 0,
        }
      }
      acc[categoryName].total += 1
      if (normalizeComplianceStatus(law.compliance_status) === 'compliant') acc[categoryName].compliant += 1
      if (normalizeComplianceStatus(law.compliance_status) === 'non_compliant') acc[categoryName].nonCompliant += 1
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const complianceChartData = [
    { name: 'สอดคล้อง', value: complianceCounts.compliant, color: chartColors.compliant },
    { name: 'สอดคล้องบางส่วน', value: complianceCounts.partial, color: chartColors.partial },
    { name: 'ไม่สอดคล้อง', value: complianceCounts.nonCompliant, color: chartColors.non_compliant },
    { name: 'ยังไม่ประเมิน', value: complianceCounts.notEvaluated, color: chartColors.not_evaluated },
  ].filter((item) => item.value > 0)

  const overviewChartData = lawOverview.slice(0, 6).map((item) => ({
    name: item.name.length > 18 ? `${item.name.slice(0, 18)}...` : item.name,
    total: item.total,
    nonCompliant: item.nonCompliant,
  }))

  const notificationItems = communications.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.info_type || 'รายการสื่อสาร',
    recipient: item.recipient || '-',
    frequency: item.frequency || 'ไม่ระบุความถี่',
    method: item.method || 'ไม่ระบุวิธี',
  }))

  const sendNotification = (item) => {
    toast.success(`เตรียมส่งแจ้งเตือนถึง ${item.recipient}`)
  }

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="hero-pill mb-3">
            <ShieldCheck className="h-4 w-4" />
            Legal Dashboard
          </div>
          <h1 className="page-title">ภาพรวมทะเบียนกฎหมาย</h1>
          <p className="section-subtitle">
            ติดตามกฎหมายที่เกี่ยวข้อง สถานะการปฏิบัติตาม และรายการสื่อสารที่ควรแจ้งเตือน
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <label className="text-sm font-medium text-slate-700">
            ปีรายงาน
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="select-field mt-1"
            >
              {years.map((year) => (
                <option key={year} value={year}>{formatThaiYear(year)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            เดือนรายงาน
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="select-field mt-1"
            >
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <DashboardCard icon={BookOpen} label="กฎหมายที่เกี่ยวข้อง" value={activeLaws.length} tone="slate" />
        <DashboardCard icon={CheckCircle2} label="สอดคล้อง" value={complianceCounts.compliant} tone="emerald" />
        <DashboardCard icon={XCircle} label="ไม่สอดคล้อง" value={complianceCounts.nonCompliant} tone="red" />
        <DashboardCard icon={FileWarning} label="กฎหมายที่ยกเลิก" value={repealedLaws.length} tone="amber" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">ภาพรวมกฎหมายตามหมวดหมู่</h2>
              <p className="mt-1 text-sm text-slate-500">แสดงจำนวนกฎหมายและประเด็นไม่สอดคล้องในแต่ละหมวด</p>
            </div>
            <Link href="/legal" className="btn-secondary">
              เปิดทะเบียน
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          {overviewChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={overviewChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Sarabun' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontFamily: 'Sarabun', fontSize: 12 }} />
                <Bar dataKey="total" name="กฎหมายทั้งหมด" fill="#475569" radius={[6, 6, 0, 0]} />
                <Bar dataKey="nonCompliant" name="ไม่สอดคล้อง" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={BookOpen} text="ยังไม่มีข้อมูลกฎหมาย" />
          )}
        </section>

        <section className="card">
          <h2 className="section-title mb-1">Legal Dashboard</h2>
          <p className="mb-4 text-sm text-slate-500">
            ผลประเมินประจำเดือน {MONTHS.find((month) => month.value === selectedMonth)?.label} {formatThaiYear(selectedYear)}
          </p>
          {complianceChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={complianceChartData} cx="50%" cy="50%" innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={3}>
                    {complianceChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} รายการ`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-3">
                {complianceChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={ClipboardCheck} text="ยังไม่มีผลประเมินในช่วงเวลานี้" />
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">กฎหมายที่ยกเลิก</h2>
              <p className="mt-1 text-sm text-slate-500">รายการล่าสุดที่ถูกยกเลิกหรือหมดผลบังคับใช้</p>
            </div>
            <Link href="/legal/repealed" className="btn-secondary">
              ดูทั้งหมด
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          {repealedLaws.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {repealedLaws.slice(0, 5).map((law) => (
                <Link key={law.id} href={`/legal/${law.id}`} className="block py-3 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-red-500" />
                    <div>
                      <p className="font-medium text-slate-900">{law.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{law.law_code || law.id}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon={AlertTriangle} text="ไม่มีกฎหมายที่ยกเลิก" />
          )}
        </section>

        <section className="card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">การแจ้งเตือนการสื่อสาร</h2>
              <p className="mt-1 text-sm text-slate-500">ดึงจากตารางการสื่อสารเพื่อเตรียมส่งแจ้งเตือน</p>
            </div>
            <Bell className="h-5 w-5 text-slate-500" />
          </div>
          {notificationItems.length > 0 ? (
            <div className="space-y-3">
              {notificationItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        ถึง {item.recipient} • {item.frequency} • {item.method}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => sendNotification(item)}
                      className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                      title="ส่งแจ้งเตือน"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquare} text="ยังไม่มีรายการสื่อสาร" />
          )}
        </section>
      </div>
    </Layout>
  )
}

function DashboardCard({ icon: Icon, label, value, tone }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className={`rounded-lg border p-3 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
      <Icon className="mb-3 h-8 w-8 text-slate-300" />
      <p>{text}</p>
    </div>
  )
}
