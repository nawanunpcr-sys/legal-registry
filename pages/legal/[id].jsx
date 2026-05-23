import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import {
  BookOpen, ChevronLeft, FileText, Users, Calendar,
  CheckCircle2, AlertCircle, Edit3, Save, X, BarChart3
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LawDetail() {
  const router = useRouter()
  const { id } = router.query
  const [law, setLaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [complianceTasks, setComplianceTasks] = useState([])

  useEffect(() => {
    if (id) {
      fetchLawDetail()
    }
  }, [id])

  const fetchLawDetail = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('laws')
        .select(`
          *,
          law_categories(name, color),
          law_department_mapping(*, departments(name, code))
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setLaw(data)
      setEditData(data)

      // Fetch compliance tasks for this law
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('law_id', id)

      setComplianceTasks(tasks || [])
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูลกฎหมายได้')
      router.push('/legal')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('laws')
        .update({
          title: editData.title,
          description: editData.description,
          compliance_status: editData.compliance_status,
          priority: editData.priority,
        })
        .eq('id', id)

      if (error) throw error

      setLaw(editData)
      setIsEditing(false)
      toast.success('บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว')
    } catch (err) {
      toast.error('ไม่สามารถบันทึกการเปลี่ยนแปลง')
    }
  }

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('laws')
        .update({
          compliance_status: 'compliant',
          approved_by: 'current_user',
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      setLaw({ ...law, compliance_status: 'compliant' })
      toast.success('อนุมัติการสอดคล้องแล้ว')
    } catch (err) {
      toast.error('ไม่สามารถอนุมัติได้')
    }
  }

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

  if (!law) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">ไม่พบข้อมูลกฎหมาย</p>
        </div>
      </Layout>
    )
  }

  const summaryPoints = [
    { label: 'ผู้รับผิดชอบ', value: law.responsible_person || '-' },
    { label: 'วันที่บังคับใช้', value: law.effective_date ? new Date(law.effective_date).toLocaleDateString('th-TH') : '-' },
    { label: 'ความถี่ตรวจติดตาม', value: law.review_frequency || 'ไม่ระบุ' },
    { label: 'อัพเดทล่าสุด', value: law.last_updated ? new Date(law.last_updated).toLocaleDateString('th-TH') : '-' },
  ]

  const departments = law.law_department_mapping || []

  return (
    <Layout>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/legal"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          กลับไปยังทะเบียนกฎหมาย
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {law.law_code}
              </span>
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-3xl font-bold text-slate-900 border border-gray-300 rounded px-3 py-2 w-full mb-2"
              />
            ) : (
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{law.title}</h1>
            )}
            <p className="text-gray-600">{law.law_categories?.name}</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition"
                >
                  <Save className="w-5 h-5" />
                  บันทึก
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData(law)
                  }}
                  className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-medium transition"
                >
                  <X className="w-5 h-5" />
                  ยกเลิก
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
                >
                  <Edit3 className="w-5 h-5" />
                  แก้ไข
                </button>
                {law.compliance_status !== 'compliant' && (
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    อนุมัติ
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Compliance Status */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {isEditing ? (
            <select
              value={editData.compliance_status || ''}
              onChange={(e) => setEditData({ ...editData, compliance_status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="compliant">✓ สอดคล้อง</option>
              <option value="non-compliant">✗ ไม่สอดคล้อง</option>
              <option value="pending">⏳ รอการตรวจสอบ</option>
            </select>
          ) : (
            <>
              {law.compliance_status === 'compliant' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">สอดคล้องแล้ว</p>
                    {law.approved_at && (
                      <p className="text-sm text-gray-600">
                        อนุมัติโดย {law.approved_by} เมื่อ {new Date(law.approved_at).toLocaleDateString('th-TH')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-6 h-6" />
                  <p className="font-semibold">ไม่สอดคล้อง - ต้องดำเนินการ</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              สรุปสาระสำคัญ
            </h2>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            ) : (
              <div className="prose max-w-none">
                {law.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{law.description}</p>
                ) : (
                  <p className="text-gray-500">ไม่มีข้อมูลสรุป</p>
                )}
              </div>
            )}
          </div>

          {/* Key Points */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              ข้อมูลสำคัญ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summaryPoints.map((point) => (
                <div key={point.label} className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-1">{point.label}</p>
                  <p className="font-semibold text-slate-900">{point.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related Documents */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">เอกสารที่เกี่ยวข้อง</h2>
            {law.related_documents ? (
              <ul className="space-y-2">
                {law.related_documents.split('\n').map((doc, idx) => (
                  <li key={idx} className="text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">ไม่มีเอกสารที่เกี่ยวข้อง</p>
            )}
          </div>

          {/* Actions Required */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">สิ่งที่ต้องดำเนินการ</h2>
            {complianceTasks.length > 0 ? (
              <div className="space-y-3">
                {complianceTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1" defaultChecked={task.status === 'completed'} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="flex gap-2 mt-2">
                          {task.responsible_person && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              ผู้รับผิดชอบ: {task.responsible_person}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                              ครบกำหนด: {new Date(task.due_date).toLocaleDateString('th-TH')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">ไม่มีงานที่ต้องดำเนินการ</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Affected Departments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              แผนกที่ได้รับผลกระทบ
            </h3>
            {departments.length > 0 ? (
              <div className="space-y-2">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-blue-50 text-blue-900 px-4 py-3 rounded-lg border border-blue-200"
                  >
                    <p className="font-medium">{dept.departments?.name}</p>
                    <p className="text-xs text-blue-700">{dept.departments?.code}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">ไม่มีแผนก</p>
            )}
          </div>

          {/* Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-slate-900 mb-3">ความสำคัญ</h3>
            {isEditing ? (
              <select
                value={editData.priority || ''}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="critical">วิกฤต</option>
                <option value="high">สูง</option>
                <option value="medium">ปานกลาง</option>
                <option value="low">ต่ำ</option>
              </select>
            ) : (
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  law.priority === 'critical'
                    ? 'bg-red-100 text-red-700'
                    : law.priority === 'high'
                    ? 'bg-orange-100 text-orange-700'
                    : law.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {law.priority === 'critical'
                  ? 'วิกฤต'
                  : law.priority === 'high'
                  ? 'สูง'
                  : law.priority === 'medium'
                  ? 'ปานกลาง'
                  : 'ต่ำ'}
              </span>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              ไทม์ไลน์
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">วันที่สร้าง</p>
                <p className="font-medium text-slate-900">
                  {law.created_at ? new Date(law.created_at).toLocaleDateString('th-TH') : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">อัพเดทล่าสุด</p>
                <p className="font-medium text-slate-900">
                  {law.last_updated ? new Date(law.last_updated).toLocaleDateString('th-TH') : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
