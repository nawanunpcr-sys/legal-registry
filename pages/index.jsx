import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getDashboardData } from '../lib/supabase'
import {
  BookOpen, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Users, FileCheck, Activity,
  ArrowUp, Building2, Shield, Target
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280', '#3B82F6']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardData().then(({ laws, tasks, compliance, departments }) => {
      setData({ laws, tasks, compliance, departments })
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent 
                          rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    </Layout>
  )

  const totalLaws = data.laws.length
  const activeLaws = data.laws.filter(l => l.status === 'active').length
  const criticalLaws = data.laws.filter(l => l.priority === 'critical').length
  const totalTasks = data.tasks.length
  const completedTasks = data.tasks.filter(t => t.status === 'completed').length
  const pendingApproval = data.tasks.filter(t => t.status === 'pending_approval').length
  const complianceRate = data.compliance.length > 0
    ? Math.round(data.compliance.filter(c =>
        c.compliance_status === 'compliant').length / data.compliance.length * 100)
    : 0

  const statsCards = [
    {
      label: 'กฎหมายทั้งหมด',
      value: totalLaws,
      sub: `${activeLaws} กฎหมายบังคับใช้`,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    {
      label: 'ประเมินสอดคล้องแล้ว',
      value: `${complianceRate}%`,
      sub: `${data.compliance.filter(c => c.compliance_status === 'compliant').length} / ${data.compliance.length} รายการ`,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600'
    },
    {
      label: 'งานรอ Approve',
      value: pendingApproval,
      sub: `รวมงานทั้งหมด ${totalTasks} รายการ`,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600'
    },
    {
      label: 'กฎหมายวิกฤต',
      value: criticalLaws,
      sub: 'ต้องดูแลเป็นพิเศษ',
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bg: 'bg-red-50',
      text: 'text-red-600'
    },
    {
      label: 'แผนกในระบบ',
      value: data.departments.length,
      sub: 'แผนกที่รับผิดชอบ',
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600'
    },
    {
      label: 'งานเสร็จแล้ว',
      value: completedTasks,
      sub: `${totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0}% ของงานทั้งหมด`,
      icon: FileCheck,
      color: 'from-teal-500 to-teal-600',
      bg: 'bg-teal-50',
      text: 'text-teal-600'
    },
  ]

  const taskStatusData = [
    { name: 'เสร็จแล้ว', value: data.tasks.filter(t => t.status === 'completed').length, color: '#10B981' },
    { name: 'กำลังดำเนินการ', value: data.tasks.filter(t => t.status === 'in_progress').length, color: '#3B82F6' },
    { name: 'รอ Approve', value: data.tasks.filter(t => t.status === 'pending_approval').length, color: '#F59E0B' },
    { name: 'ยังไม่เริ่ม', value: data.tasks.filter(t => t.status === 'pending').length, color: '#6B7280' },
    { name: 'เกินกำหนด', value: data.tasks.filter(t => t.status === 'overdue').length, color: '#EF4444' },
  ].filter(d => d.value > 0)

  const complianceData = [
    { name: 'สอดคล้อง', value: data.compliance.filter(c => c.compliance_status === 'compliant').length, color: '#10B981' },
    { name: 'บางส่วน', value: data.compliance.filter(c => c.compliance_status === 'partial').length, color: '#F59E0B' },
    { name: 'ไม่สอดคล้อง', value: data.compliance.filter(c => c.compliance_status === 'non_compliant').length, color: '#EF4444' },
    { name: 'ยังไม่ประเมิน', value: data.compliance.filter(c => c.compliance_status === 'not_evaluated').length, color: '#CBD5E1' },
  ].filter(d => d.value > 0)

  const deptBarData = data.departments.map(dept => {
    const deptTasks = data.tasks.filter(t => t.department_id === dept.id)
    const deptCompliance = data.compliance.filter(c => c.department_id === dept.id)
    const score = deptCompliance.length > 0
      ? Math.round(deptCompliance.filter(c => c.compliance_status === 'compliant').length / deptCompliance.length * 100)
      : 0
    return {
      name: dept.code || dept.name.substring(0, 6),
      คะแนน: score,
      งานทั้งหมด: deptTasks.length,
      งานเสร็จ: deptTasks.filter(t => t.status === 'completed').length,
    }
  })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            🏢 Dashboard ภาพรวมองค์กร
          </h1>
          <p className="text-slate-500 mt-1">
            ระบบทะเบียนกฎหมายและการประเมินความสอดคล้อง
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/legal/add" className="btn-primary">
            <BookOpen className="w-4 h-4" />
            เพิ่มกฎหมาย
          </Link>
          <Link href="/ai-analysis" className="btn-success">
            <Activity className="w-4 h-4" />
            วิเคราะห์ด้วย AI
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                  <p className={`text-xs mt-1 ${card.text}`}>{card.sub}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} 
                                flex items-center justify-center shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress Bar ภาพรวม */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            ความคืบหน้าการประเมินความสอดคล้อง
          </h2>
          <span className="text-2xl font-bold text-blue-600">{complianceRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
          <div
            className="h-6 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 
                       transition-all duration-1000 flex items-center justify-end pr-3"
            style={{ width: `${complianceRate}%` }}
          >
            <span className="text-white text-xs font-bold">{complianceRate}%</span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>0%</span>
          <span>เป้าหมาย 100%</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pie - Task Status */}
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            สถานะงานทั้งหมด
          </h3>
          {taskStatusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={taskStatusData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={3}>
                    {taskStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} รายการ`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {taskStatusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Pie - Compliance */}
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            ผลการประเมินสอดคล้อง
          </h3>
          {complianceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={complianceData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={3}>
                    {complianceData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v} รายการ`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {complianceData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            การดำเนินการด่วน
          </h3>
          <div className="space-y-3">
            {[
              { label: 'เพิ่มกฎหมายใหม่', href: '/legal/add', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700', icon: '📚' },
              { label: 'วิเคราะห์ด้วย AI', href: '/ai-analysis', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700', icon: '🤖' },
              { label: 'อนุมัติและส่งงาน', href: '/tasks', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700', icon: '✅' },
              { label: 'ประเมินความสอดคล้อง', href: '/compliance', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700', icon: '🛡️' },
              { label: 'ดู Dashboard แผนก', href: '/dashboard-dept', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700', icon: '🏗️' },
            ].map((action) => (
              <Link key={action.href} href={action.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${action.color}`}>
                <span className="text-xl">{action.icon}</span>
                <span className="font-medium text-sm">{action.label}</span>
                <ArrowUp className="w-3 h-3 ml-auto rotate-45 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart แผนก */}
      {deptBarData.length > 0 && (
        <div className="card mb-8">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            คะแนนความสอดคล้องรายแผนก (%)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptBarData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: 'Sarabun' }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ fontFamily: 'Sarabun', fontSize: 12 }}
                formatter={(v) => [`${v}%`, 'คะแนน']}
              />
              <Bar dataKey="คะแนน" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Layout>
  )
}

// เพิ่ม import ที่ขาดไป
import { ClipboardList } from 'lucide-react'