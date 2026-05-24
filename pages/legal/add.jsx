import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Plus, Save, ChevronLeft } from 'lucide-react'
import { supabase, getCategories, getDepartments } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

export default function AddLawPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDepartments, setSelectedDepartments] = useState([])
  const [form, setForm] = useState({
    law_code: '',
    title: '',
    category_id: '',
    subject: '',
    description: '',
    effective_date: '',
    responsible_person: '',
    review_frequency: '',
    related_documents: '',
    required_actions: '',
    priority: 'high',
    compliance_status: 'pending',
    issuing_authority: '',
    law_type: 'law', // law, announcement, regulation
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesRes, departmentsRes] = await Promise.all([
        getCategories(),
        getDepartments()
      ])
      setCategories(categoriesRes.data || [])
      setDepartments(departmentsRes.data || [])
    } catch (err) {
      toast.error('ไม่สามารถโหลดข้อมูล')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleDepartmentToggle = (deptId) => {
    if (selectedDepartments.includes(deptId)) {
      setSelectedDepartments(selectedDepartments.filter(id => id !== deptId))
    } else {
      setSelectedDepartments([...selectedDepartments, deptId])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!form.title || !form.category_id || !form.responsible_person) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็น: ชื่อกฎหมาย หมวดหมู่ และผู้รับผิดชอบ')
      return
    }

    setLoading(true)
    try {
      // Insert law
      const { data: newLaw, error: lawError } = await supabase
        .from('laws')
        .insert([
          {
            law_code: form.law_code,
            title: form.title,
            category_id: form.category_id,
            description: form.description,
            subject: form.subject,
            effective_date: form.effective_date,
            responsible_person: form.responsible_person,
            review_frequency: form.review_frequency,
            related_documents: form.related_documents,
            required_actions: form.required_actions,
            priority: form.priority,
            compliance_status: form.compliance_status,
            issuing_authority: form.issuing_authority,
            law_type: form.law_type,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          }
        ])
        .select()

      if (lawError) throw lawError

      const lawId = newLaw[0].id

      // Add department mappings and create first tracking records for Dashboard/Compliance.
      const trackingDepartmentIds = selectedDepartments.length > 0 ? selectedDepartments : [null]

      if (selectedDepartments.length > 0) {
        const mappings = selectedDepartments.map(deptId => ({
          law_id: lawId,
          department_id: deptId,
        }))

        const { error: mappingError } = await supabase
          .from('law_department_mapping')
          .insert(mappings)

        if (mappingError) throw mappingError
      }

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)

      const tasks = trackingDepartmentIds.map((deptId, index) => ({
        task_code: `${form.law_code || 'LAW'}-${index + 1}`,
        law_id: lawId,
        department_id: deptId,
        title: `ประเมินความสอดคล้อง: ${form.title}`,
        description: form.required_actions || form.description || 'ตรวจสอบข้อกำหนดและบันทึกผลการปฏิบัติตามกฎหมาย',
        status: 'pending',
        responsible_person: form.responsible_person,
        due_date: dueDate.toISOString().slice(0, 10),
        jorpor_approved: false,
        created_at: new Date().toISOString(),
      }))

      let { error: taskError } = await supabase
        .from('tasks')
        .insert(tasks)

      if (taskError && taskError.message?.includes('task_code')) {
        const fallbackTasks = tasks.map(({ task_code, ...task }) => task)
        const retry = await supabase
          .from('tasks')
          .insert(fallbackTasks)
        taskError = retry.error
      }

      if (taskError) {
        toast.error('บันทึกกฎหมายแล้ว แต่สร้างงานติดตามไม่สำเร็จ: ' + taskError.message)
      }

      const complianceRecords = trackingDepartmentIds.map((deptId) => ({
        law_id: lawId,
        department_id: deptId,
        compliance_status: form.compliance_status === 'compliant' ? 'compliant' : 'not_evaluated',
        compliance_score: form.compliance_status === 'compliant' ? 100 : 0,
        evaluation_year: new Date().getFullYear(),
        created_at: new Date().toISOString(),
      }))

      let { error: complianceError } = await supabase
        .from('compliance_records')
        .insert(complianceRecords)

      if (complianceError && complianceError.message?.includes('evaluation_year')) {
        const fallbackRecords = complianceRecords.map(({ evaluation_year, ...record }) => record)
        const retry = await supabase
          .from('compliance_records')
          .insert(fallbackRecords)
        complianceError = retry.error
      }

      if (complianceError) {
        toast.error('บันทึกกฎหมายแล้ว แต่สร้างรายการประเมินความสอดคล้องไม่สำเร็จ: ' + complianceError.message)
      }

      toast.success('เพิ่มกฎหมายใหม่เรียบร้อยแล้ว')
      router.push(`/legal/${lawId}`)
    } catch (err) {
      toast.error('ไม่สามารถเพิ่มกฎหมาย: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">เพิ่มกฎหมายใหม่</h1>
            <p className="text-gray-600">กรอกข้อมูลกฎหมายเพื่อบันทึกลงในระบบ</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสกฎหมาย
              </label>
              <input
                type="text"
                name="law_code"
                value={form.law_code}
                onChange={handleChange}
                placeholder="เช่น L1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทกฎหมาย *
              </label>
              <select
                name="law_type"
                value={form.law_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="law">กฎหมาย</option>
                <option value="announcement">ประกาศ</option>
                <option value="regulation">ระเบียบ/กฎกระทรวง</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อกฎหมาย *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="ระบุชื่อกฎหมายแบบสมบูรณ์"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่กฎหมาย *
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หน่วยงานที่ออก
              </label>
              <input
                type="text"
                name="issuing_authority"
                value={form.issuing_authority}
                onChange={handleChange}
                placeholder="เช่น ราชกิจจานุเบกษา"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เรื่อง / หัวข้อ
              </label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="ระบุเรื่องหรือหัวข้อ"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่บังคับใช้
              </label>
              <input
                type="date"
                name="effective_date"
                value={form.effective_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Description & Responsibilities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">รายละเอียดและความรับผิดชอบ</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สรุปสาระสำคัญ
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="สรุปข้อมูลสำคัญของกฎหมาย"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ผู้รับผิดชอบ *
              </label>
              <input
                type="text"
                name="responsible_person"
                value={form.responsible_person}
                onChange={handleChange}
                placeholder="ชื่อและตำแหน่ง"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ความถี่ในการตรวจติดตาม
              </label>
              <select
                name="review_frequency"
                value={form.review_frequency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">เลือกความถี่</option>
                <option value="monthly">รายเดือน</option>
                <option value="quarterly">รายไตรมาส</option>
                <option value="semi-annual">ครึ่งปี</option>
                <option value="annual">รายปี</option>
                <option value="as-needed">ตามความจำเป็น</option>
              </select>
            </div>
          </div>
        </div>

        {/* Compliance & Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">ปฏิบัติการและเอกสาร</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                สิ่งที่ต้องดำเนินการ
              </label>
              <textarea
                name="required_actions"
                value={form.required_actions}
                onChange={handleChange}
                rows={4}
                placeholder="ระบุสิ่งที่ต้องทำ (สามารถใส่หลายรายการ)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เอกสารที่เกี่ยวข้อง
              </label>
              <textarea
                name="related_documents"
                value={form.related_documents}
                onChange={handleChange}
                rows={3}
                placeholder="ระบุเอกสารที่เกี่ยวข้อง (คั่นด้วยลูกน้ำ)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ความสำคัญ
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="critical">วิกฤต</option>
                  <option value="high">สูง</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="low">ต่ำ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  สถานะการสอดคล้อง
                </label>
                <select
                  name="compliance_status"
                  value={form.compliance_status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="compliant">สอดคล้องแล้ว</option>
                  <option value="non-compliant">ไม่สอดคล้อง</option>
                  <option value="pending">รอการตรวจสอบ</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Affected Departments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">แผนกที่ได้รับผลกระทบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((dept) => (
              <label key={dept.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(dept.id)}
                  onChange={() => handleDepartmentToggle(dept.id)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-medium text-gray-700">{dept.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition"
          >
            <Save className="w-5 h-5" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
          <Link
            href="/legal"
            className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium transition"
          >
            ยกเลิก
          </Link>
        </div>
      </form>
    </Layout>
  )
}
