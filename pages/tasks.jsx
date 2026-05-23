import { useState } from 'react'
import Layout from '../components/Layout'
import { 
  ClipboardList, CheckCircle2, AlertCircle, Clock, Search, 
  Filter, User, Building2, Plus, Calendar, ArrowRight,
  ShieldAlert, RefreshCw, CheckCircle, Hourglass, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedDept, setSelectedDept] = useState('all')

  // Mock initial tasks for demo
  const [tasks, setTasks] = useState([
    {
      id: 'task_001',
      title: 'จัดทำบัญชีรายชื่อสารเคมีอันตรายและเอกสารความปลอดภัย (SDS)',
      lawTitle: 'กฎกระทรวง กำหนดมาตรฐานเกี่ยวกับสารเคมีอันตราย พ.ศ. ๒๕๕๖',
      department: 'ฝ่าย EHS',
      assignee: 'สมชาย รักปลอดภัย',
      status: 'completed',
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewFrequency: 'ทุก 6 เดือน',
      progress: 100
    },
    {
      id: 'task_002',
      title: 'ดำเนินการตรวจวัดสารเคมีในบรรยากาศพื้นที่จัดเก็บชั้น ๒',
      lawTitle: 'กฎกระทรวง กำหนดมาตรฐานเกี่ยวกับสารเคมีอันตราย พ.ศ. ๒๕๕๖',
      department: 'ฝ่ายวิศวกรรม',
      assignee: 'วิชัย เก่งคำนวณ',
      status: 'pending_approval',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reviewFrequency: 'ทุก 6 เดือน',
      progress: 90
    },
    {
      id: 'task_003',
      title: 'ตรวจสอบระบบสายดินและตู้คอนโทรลไฟฟ้าหม้อต้มความร้อน',
      lawTitle: 'กฎกระทรวง กำหนดมาตรฐานเกี่ยวกับไฟฟ้า พ.ศ. ๒๕๕๘',
      department: 'ฝ่ายซ่อมบำรุง',
      assignee: 'มานะ อุปกรณ์ดี',
      status: 'in_progress',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      reviewFrequency: 'ทุก 6 เดือน',
      progress: 60
    },
    {
      id: 'task_004',
      title: 'จัดการฝึกอบรมจำลองเหตุฉุกเฉินและปฏิบัติงานที่อับอากาศ',
      lawTitle: 'กฎกระทรวง กำหนดมาตรฐานในที่อับอากาศ พ.ศ. ๒๕๖๒',
      department: 'ฝ่ายทรัพยากรบุคคล (HR)',
      assignee: 'สุดา ใจประสาน',
      status: 'pending',
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      reviewFrequency: 'ทุก 6 เดือน',
      progress: 0
    },
    {
      id: 'task_005',
      title: 'วิศวกรภายนอกตรวจทดสอบหม้อน้ำ (Boiler) และออกใบรับรองประจำปี',
      lawTitle: 'ประกาศกระทรวงอุตสาหกรรม มาตรการความปลอดภัยเกี่ยวกับหม้อน้ำ พ.ศ. ๒๕๖๕',
      department: 'ฝ่ายวิศวกรรม',
      assignee: 'วิทยา พลังงาน',
      status: 'overdue',
      dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewFrequency: 'ทุก 3 เดือน',
      progress: 40
    }
  ])

  // Handles updating task status
  const handleUpdateStatus = (id, newStatus) => {
    let progressValue = 0
    if (newStatus === 'completed') progressValue = 100
    else if (newStatus === 'pending_approval') progressValue = 90
    else if (newStatus === 'in_progress') progressValue = 50
    else progressValue = 0

    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: newStatus,
          progress: progressValue
        }
      }
      return t
    }))
    toast.success('อัปเดตสถานะงานเรียบร้อยแล้ว!')
  }

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.lawTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.assignee.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus
    const matchesDept = selectedDept === 'all' || t.department.includes(selectedDept)

    return matchesSearch && matchesStatus && matchesDept
  })

  // Count stats
  const totalTasks = tasks.length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const approvalCount = tasks.filter(t => t.status === 'pending_approval').length
  const overdueCount = tasks.filter(t => t.status === 'overdue').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="status-completed px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />เสร็จสมบูรณ์</span>
      case 'pending_approval':
        return <span className="status-pending-approval px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Hourglass className="w-3.5 h-3.5" />รออนุมัติประเมิน</span>
      case 'in_progress':
        return <span className="status-in-progress px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />กำลังดำเนินการ</span>
      case 'pending':
        return <span className="status-pending px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" />ยังไม่เริ่มดำเนินการ</span>
      case 'overdue':
        return <span className="status-overdue px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />เกินกำหนดส่ง</span>
      default:
        return null
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="mb-8 rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-[24px] text-white shadow-lg shadow-indigo-600/20">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <div className="hero-pill mb-2 border border-blue-200 bg-blue-50/50 text-indigo-700">ระบบสอดคล้อง EHS</div>
              <h1 className="page-title text-slate-900">มอบหมายและติดตามผลความสอดคล้อง</h1>
              <p className="section-subtitle max-w-2xl mt-1">
                จัดการแผนปฏิบัติการ (Action Plan) มอบหมายรายบุคคล และติดตามสถานะความถูกต้องตามกำหนดเวลาของกฎหมาย
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              toast.success('ฟังก์ชันการเพิ่มงานอยู่ระหว่างประมวลผลระบบSupabase')
            }}
            className="btn-primary bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 shadow-lg shadow-slate-950/10 self-start lg:self-center flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            มอบหมายงานใหม่
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="card bg-white p-5 flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">งานที่มอบหมายทั้งหมด</p>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-extrabold text-slate-900">{totalTasks}</p>
            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">รวม</span>
          </div>
        </div>

        <div className="card bg-white p-5 flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">อยู่ระหว่างดำเนินการ</p>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-extrabold text-blue-600">{inProgressCount}</p>
            <span className="text-[10px] font-bold bg-blue-100 px-2 py-0.5 rounded-full text-blue-700">ลุยงาน</span>
          </div>
        </div>

        <div className="card bg-white p-5 flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">รออนุมัติประเมิน</p>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-extrabold text-purple-650">{approvalCount}</p>
            <span className="text-[10px] font-bold bg-purple-100 px-2 py-0.5 rounded-full text-purple-700">ตรวจผล</span>
          </div>
        </div>

        <div className="card bg-white p-5 flex flex-col justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">เสร็จสมบูรณ์แล้ว</p>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-extrabold text-emerald-600">{completedCount}</p>
            <span className="text-[10px] font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-700">ผ่าน</span>
          </div>
        </div>

        <div className="card bg-white p-5 flex flex-col justify-between col-span-2 lg:col-span-1">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">เกินกำหนดเวลาส่ง</p>
          <div className="flex items-baseline justify-between mt-3">
            <p className="text-3xl font-extrabold text-red-650">{overdueCount}</p>
            <span className="text-[10px] font-bold bg-red-100 px-2 py-0.5 rounded-full text-red-700 animate-pulse">เร่งด่วน</span>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="card mb-8 p-6 bg-white/80 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อแผนงาน, ผู้รับผิดชอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-350 focus:border-transparent outline-none transition-all text-sm shadow-sm bg-white"
            />
          </div>

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-350 bg-white transition-all text-sm text-slate-700 font-medium outline-none appearance-none"
            >
              <option value="all">ทุกสถานะการดำเนินงาน</option>
              <option value="pending">ยังไม่เริ่มดำเนินการ</option>
              <option value="in_progress">กำลังดำเนินการ</option>
              <option value="pending_approval">รออนุมัติประเมิน</option>
              <option value="completed">เสร็จสมบูรณ์</option>
              <option value="overdue">เกินกำหนดส่ง</option>
            </select>
            <Filter className="absolute right-4 top-3.5 w-4 h-4 text-slate-450 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-350 bg-white transition-all text-sm text-slate-700 font-medium outline-none appearance-none"
            >
              <option value="all">ทุกแผนกที่รับผิดชอบ</option>
              <option value="EHS">ฝ่าย EHS</option>
              <option value="วิศวกรรม">ฝ่ายวิศวกรรม</option>
              <option value="ซ่อมบำรุง">ฝ่ายซ่อมบำรุง</option>
              <option value="ทรัพยากรบุคคล">ฝ่ายทรัพยากรบุคคล</option>
            </select>
            <Filter className="absolute right-4 top-3.5 w-4 h-4 text-slate-450 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="space-y-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/70 shadow-sm">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-355 stroke-1" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">ไม่พบรายการแผนงาน</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              ลองค้นหาด้วยคำอื่นหรือปรับเปลี่ยนตัวกรองสถานะ/แผนกรับผิดชอบอีกครั้ง
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks.map((task) => (
              <div 
                key={task.id}
                className="bg-white border border-slate-200/70 hover:border-slate-300 rounded-[28px] p-6 hover:shadow-[0_15px_30px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
              >
                {/* Info block */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(task.status)}
                    <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full flex items-center gap-1">
                      รอบทบทวนแนะนำ: {task.reviewFrequency}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 truncate leading-snug">
                    {task.title}
                  </h3>

                  <p className="text-slate-500 text-xs truncate max-w-3xl flex items-center gap-1">
                    <span className="font-semibold text-slate-700 flex-shrink-0">อิงกฎหมาย:</span> 
                    {task.lawTitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-650 pt-1">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {task.department}</span>
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> {task.assignee}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" /> กำหนดส่ง: {task.dueDate.toLocaleDateString('th-TH')}</span>
                  </div>
                </div>

                {/* Progress & Quick Actions */}
                <div className="w-full md:w-64 flex flex-col sm:flex-row md:flex-col gap-4 justify-between md:items-end flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Progress Bar */}
                  <div className="w-full sm:w-40 md:w-full space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-550">
                      <span>ความคืบหน้า</span>
                      <span>{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          task.status === 'completed' ? 'bg-emerald-500' :
                          task.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Select box */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">อัปเดตสถานะ:</span>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-bold text-slate-700 outline-none hover:bg-slate-100 transition cursor-pointer"
                    >
                      <option value="pending">ยังไม่เริ่ม</option>
                      <option value="in_progress">กำลังทำงาน</option>
                      <option value="pending_approval">รอส่งตรวจ</option>
                      <option value="completed">เสร็จสมบูรณ์</option>
                      <option value="overdue">เกินกำหนดส่ง</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Advisor Panel */}
      <div className="card mt-12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border-0 p-8 sm:p-10 text-white rounded-[36px] shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10" />
        
        <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              ที่ปรึกษาวางแผนรอบทบทวนความสอดคล้อง (Review Frequency Advisor)
            </h2>
            <p className="text-slate-300 text-sm mt-2 max-w-3xl leading-relaxed">
              ในฐานะ จป.วิชาชีพ การเลือกความถี่ในการตรวจติดตามความสอดคล้องที่มีประสิทธิภาพ จะช่วยป้องกันความเสี่ยงด้านอุบัติภัยและลดความซ้ำซ้อนของการประเมินความสอดคล้องในองค์กร
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-semibold border border-white/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            มาตรฐานการตรวจทบทวนองค์กร
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="badge bg-indigo-500/20 text-indigo-305 text-[10px] font-bold border border-indigo-500/20">ความถี่ต่ำ • ทุก 12 เดือน</span>
              <h4 className="font-bold text-lg text-white mt-3 mb-1">พระราชบัญญัติ (พรบ.)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                เป็นแม่บทหลักที่มีการแก้ไขยาก นานๆ จะเปลี่ยนแปลงที จึงควรประเมินครอบคลุมองค์กรปีละ 1 ครั้ง ร่วมกับผู้บริหารสูงสุด
              </p>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 border-t border-white/10 pt-3">
              ตัวอย่าง: พรบ. ความปลอดภัย ๒๕๕๔
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="badge bg-purple-500/20 text-purple-305 text-[10px] font-bold border border-purple-500/20">ความถี่กลาง • ทุก 6 เดือน</span>
              <h4 className="font-bold text-lg text-white mt-3 mb-1">พระราชกฤษฎีกา (พรฎ.)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ข้อกำหนดเฉพาะทางเทคนิคในการประเมินความเสี่ยงและมาตรการป้องกัน จำเป็นต้องทบทวนทุกครึ่งปีเพื่อไม่ให้ตกหล่น
              </p>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 border-t border-white/10 pt-3">
              ตัวอย่าง: พรฎ. ภาษีส่งเสริม EHS
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="badge bg-sky-500/20 text-sky-305 text-[10px] font-bold border border-sky-500/20">ความถี่กลาง • ทุก 6 เดือน</span>
              <h4 className="font-bold text-lg text-white mt-3 mb-1">กฎกระทรวง</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ข้อบังคับเกี่ยวกับงานอันตราย เช่น เครื่องจักร ไฟฟ้า สารเคมี ซึ่งมีมาตรฐานความปลอดภัยที่ต้องประเมินและทบทวนอย่างเคร่งครัด
              </p>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 border-t border-white/10 pt-3">
              ตัวอย่าง: กฎกระทรวงสารเคมีอันตราย
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="badge bg-orange-500/20 text-orange-305 text-[10px] font-bold border border-orange-500/20">ความถี่สูง • ทุก 3 เดือน</span>
              <h4 className="font-bold text-lg text-white mt-3 mb-1">ประกาศกระทรวง / กรม</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ประกาศลูกที่มีการแก้ไขรวดเร็วและบ่อยที่สุดเกี่ยวกับระดับสารเคมี ตารางอบรม หรือเกณฑ์วิศวกรรม จึงควรทบทวนทุกไตรมาส (3 เดือน)
              </p>
            </div>
            <div className="text-[10px] text-slate-500 mt-4 border-t border-white/10 pt-3">
              ตัวอย่าง: ประกาศเกณฑ์ฝึกอบรม จป.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
