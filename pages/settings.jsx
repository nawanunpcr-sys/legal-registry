import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Settings, Bell, Database, RefreshCw, CheckCircle2, Save, Shield } from 'lucide-react'
import { useNotifications, DEFAULT_SETTINGS } from '../hooks/useNotifications'
import toast from 'react-hot-toast'

const FREQUENCY_OPTIONS = [
  { value: 1, label: 'ทุกวัน' },
  { value: 3, label: 'ทุก 3 วัน' },
  { value: 7, label: 'ทุกสัปดาห์ (แนะนำ)' },
  { value: 14, label: 'ทุก 2 สัปดาห์' },
  { value: 30, label: 'ทุกเดือน' },
]

export default function SettingsPage() {
  const { settings, updateSettings, checkGazette, checking, clearAll } = useNotifications()
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({ ...DEFAULT_SETTINGS, ...settings })
  }, [settings])

  const handleSave = () => {
    updateSettings(form)
    setSaved(true)
    toast.success('บันทึกการตั้งค่าแล้ว')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestCheck = async () => {
    const result = await checkGazette(true)
    if (result.newCount > 0) {
      toast.success(`พบกฎหมายใหม่ ${result.newCount} ฉบับ!`)
    } else if (result.error) {
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบ')
    } else {
      toast('ไม่พบกฎหมายใหม่ในขณะนี้', { icon: '✓' })
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-slate-700 rounded-xl shadow">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">การตั้งค่าระบบ</h1>
          </div>
          <p className="text-slate-500 text-sm ml-14">จัดการการแจ้งเตือน การเชื่อมต่อ และข้อมูลระบบ</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Notification Settings */}
        <div id="notifications" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">การแจ้งเตือน</h2>
              <p className="text-xs text-slate-500">กำหนดความถี่และประเภทการแจ้งเตือน</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Check Frequency */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ความถี่ตรวจสอบราชกิจจานุเบกษา
              </label>
              <select
                value={form.checkFrequencyDays}
                onChange={e => setForm(f => ({ ...f, checkFrequencyDays: parseInt(e.target.value) }))}
                className="select-field text-sm"
              >
                {FREQUENCY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                ระบบจะตรวจสอบกฎหมายใหม่โดยอัตโนมัติทุกครั้งที่เปิดแอป หากครบกำหนด
              </p>
            </div>

            {/* Toggle: New law alerts */}
            <ToggleRow
              label="แจ้งเตือนเมื่อพบกฎหมายใหม่"
              description="รับการแจ้งเตือนเมื่อมีกฎหมายใหม่จากราชกิจจานุเบกษา"
              checked={form.enableNewLawAlerts}
              onChange={v => setForm(f => ({ ...f, enableNewLawAlerts: v }))}
            />

            {/* Toggle: Review reminders */}
            <ToggleRow
              label="แจ้งเตือนการทบทวนกฎหมาย"
              description="รับการแจ้งเตือนเมื่อถึงกำหนดตรวจสอบกฎหมายในระบบ"
              checked={form.enableReviewReminders}
              onChange={v => setForm(f => ({ ...f, enableReviewReminders: v }))}
            />

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="btn-primary flex-1 justify-center"
              >
                {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'บันทึกแล้ว' : 'บันทึกการตั้งค่า'}
              </button>
              <button
                onClick={handleTestCheck}
                disabled={checking}
                className="btn-secondary"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                ทดสอบ
              </button>
            </div>

            <button
              onClick={() => { clearAll(); toast('ล้างการแจ้งเตือนทั้งหมดแล้ว', { icon: '🗑️' }) }}
              className="w-full text-xs text-slate-400 hover:text-red-500 py-1 transition-colors"
            >
              ล้างประวัติการแจ้งเตือนทั้งหมด
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Database className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">ข้อมูลระบบ</h2>
              <p className="text-xs text-slate-500">การเชื่อมต่อฐานข้อมูลและบริการ</p>
            </div>
          </div>
          <div className="space-y-3">
            <InfoRow label="ฐานข้อมูล" value="Supabase (PostgreSQL)" status="connected" />
            <InfoRow label="แหล่งกฎหมาย" value="ราชกิจจานุเบกษา" status="connected" />
            <InfoRow label="เวอร์ชันระบบ" value="v2.0.0" />
            <InfoRow label="สิทธิ์ผู้ใช้" value="จป.วิชาชีพ — EHS Admin" />
          </div>
        </div>

        {/* Legal Registry Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">ระบบทะเบียนกฎหมาย</h2>
              <p className="text-xs text-slate-500">เกี่ยวกับการดึงข้อมูลจากราชกิจจานุเบกษาและการซิงค์</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 space-y-2">
            <p>• ระบบดึงข้อมูลกฎหมายจากราชกิจจานุเบกษา (<strong>ratchakitcha.soc.go.th</strong>) โดยอัตโนมัติ</p>
            <p>• กฎหมายใหม่ที่ตรวจพบจะแสดงในหน้า <strong>กฎหมายใหม่</strong> และสามารถส่งวิเคราะห์ด้วย AI ได้ทันที</p>
            <p>• สามารถเพิ่มกฎหมายเข้าทะเบียนได้ด้วยตนเองผ่านหน้า <strong>เพิ่มกฎหมาย</strong></p>
            <p>• การแจ้งเตือนจะแสดงที่กระดิ่ง (🔔) ในแถบด้านบนของทุกหน้า</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function InfoRow({ label, value, status }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {status === 'connected' && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
        <span className="text-xs font-semibold text-slate-700">{value}</span>
      </div>
    </div>
  )
}
