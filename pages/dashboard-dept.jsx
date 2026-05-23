import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Building2, BarChart3, Users, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { getDepartments, supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280']

export default function DashboardDeptPage() {
  const [departments, setDepartments] = useState([])
  const [deptStats, setDeptStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedDept, setSelectedDept] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: depts } = await getDepartments()
      setDepartments(depts || [])

      // Load stats for each department
      const stats = {}
      for (const dept of depts || []) {
        const [tasks, compliance] = await Promise.all([
          supabase.from('tasks').select('*').eq('department_id', dept.id),
          supabase.from('compliance_records').select('*').eq('department_id', dept.id),
        ])

        stats[dept.id] = {
          totalTasks: tasks.data?.length || 0,
          completedTasks: tasks.data?.filter(t => t.status === 'completed').length || 0,
          totalCompliance: compliance.data?.length || 0,
          compliantItems: compliance.data?.filter(c => c.compliance_status === 'compliant').length || 0,
        }
      }
      setDeptStats(stats)
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const chartData = departments.map((dept) => {
    const stat = deptStats[dept.id] || {}
    const complianceRate = stat.totalCompliance > 0
      ? Math.round((stat.compliantItems / stat.totalCompliance) * 100)
      : 0
    return {
      name: dept.name.substring(0, 10),
      fullName: dept.name,
      คะแนน: complianceRate,
      งาน: stat.totalTasks,
    }
  })

  const complianceSummary = [
    { name: 'สอดคล้อง', value: Object.values(deptStats).reduce((sum, d) => sum + (d.compliantItems || 0), 0), color: '#10B981' },
    { name: 'ไม่สอดคล้อง', value: Object.values(deptStats).reduce((sum, d) => sum + ((d.totalCompliance || 0) - (d.compliantItems || 0)), 0), color: '#EF4444' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard แผนก</h1>
              <p className="text-slate-600">ติดตามความสอดคล้องและงานในแต่ละหน่วยงาน</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">จำนวนแผนก</p>
              <p className="text-3xl font-bold text-slate-900">{departments.length}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-100 text-opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">งานทั้งหมด</p>
              <p className="text-3xl font-bold text-slate-900">
                {Object.values(deptStats).reduce((sum, d) => sum + (d.totalTasks || 0), 0)}
              </p>
            </div>
            <Users className="w-10 h-10 text-green-100 text-opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">งานเสร็จแล้ว</p>
              <p className="text-3xl font-bold text-slate-900">
                {Object.values(deptStats).reduce((sum, d) => sum + (d.completedTasks || 0), 0)}
              </p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-emerald-100 text-opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">อัตราสอดคล้อง</p>
              <p className="text-3xl font-bold text-slate-900">
                {departments.length > 0
                  ? Math.round(
                      Object.values(deptStats).reduce((sum, d) => sum + (d.compliantItems || 0), 0) /
                        Object.values(deptStats).reduce((sum, d) => sum + (d.totalCompliance || 1), 1) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-100 text-opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Bar Chart - Compliance by Department */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">คะแนนสอดคล้องตามแผนก</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded shadow border">
                          <p className="text-sm font-medium">{payload[0].payload.fullName}</p>
                          <p className="text-sm text-blue-600">คะแนน: {payload[0].value}%</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="คะแนน" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">ไม่มีข้อมูล</p>
          )}
        </div>

        {/* Pie Chart - Compliance Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">ภาพรวมความสอดคล้อง</h2>
          {complianceSummary.filter(d => d.value > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={complianceSummary.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {complianceSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">ไม่มีข้อมูล</p>
          )}
        </div>
      </div>

      {/* Department Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">รายละเอียดแต่ละแผนก</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">แผนก</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">งานทั้งหมด</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">งานเสร็จ</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">ความสอดคล้อง</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">อัตรา</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const stat = deptStats[dept.id] || {}
                const rate = stat.totalCompliance > 0 ? Math.round((stat.compliantItems / stat.totalCompliance) * 100) : 0
                const taskRate = stat.totalTasks > 0 ? Math.round((stat.completedTasks / stat.totalTasks) * 100) : 0

                return (
                  <tr key={dept.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-600">{dept.code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{stat.totalTasks || 0}</td>
                    <td className="px-4 py-3 text-center">{stat.completedTasks || 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        rate >= 75 ? 'bg-green-100 text-green-800' :
                        rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stat.compliantItems || 0} / {stat.totalCompliance || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              rate >= 75 ? 'bg-green-500' :
                              rate >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
