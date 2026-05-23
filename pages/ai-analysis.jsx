import { useState } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'
import { Sparkles, ArrowRight, Search, Copy, CheckCircle2, AlertCircle } from 'lucide-react'
import { summarizeLaw, generateComplianceChecklist } from '../lib/aiSummarization'
import toast from 'react-hot-toast'

export default function AiAnalysisPage() {
  const [activeTab, setActiveTab] = useState('analyze')
  const [lawText, setLawText] = useState('')
  const [lawTitle, setLawTitle] = useState('')
  const [summary, setSummary] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!lawText.trim()) {
      toast.error('กรุณากรอกข้อความกฎหมาย')
      return
    }

    setLoading(true)
    try {
      const result = await summarizeLaw(lawText, lawTitle)
      if (result) {
        setSummary(result)
        // Generate sample checklist
        const mockLaw = { 
          title: lawTitle, 
          responsible_person: '-',
          effective_date: result.effectiveDate,
          review_frequency: 'เดือน'
        }
        setChecklist(generateComplianceChecklist(mockLaw))
        toast.success('วิเคราะห์เสร็จเรียบร้อย')
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการวิเคราะห์')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('คัดลอกแล้ว')
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">วิเคราะห์กฎหมายด้วย AI</h1>
              <p className="text-slate-600">สร้างสรุปและแผนการปรับปรุงอัตโนมัติ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === 'analyze'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            วิเคราะห์กฎหมาย
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === 'tools'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            เครื่องมืออื่น ๆ
          </button>
        </div>

        {activeTab === 'analyze' ? (
          <div className="p-6 space-y-6">
            {/* Input Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Input */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อกฎหมาย
                  </label>
                  <input
                    type="text"
                    value={lawTitle}
                    onChange={(e) => setLawTitle(e.target.value)}
                    placeholder="เช่น พระราชกฤษฎีกา ว่าด้วยการใช้ข้อมูลบุคคล"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ข้อความกฎหมาย
                  </label>
                  <textarea
                    value={lawText}
                    onChange={(e) => setLawText(e.target.value)}
                    placeholder="วาง ข้อความกฎหมายที่ต้องการวิเคราะห์ที่นี่..."
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  />
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {loading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI'}
                </button>
              </div>

              {/* Right Column - Example */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">💡 ตัวอย่างการใช้งาน</h3>
                <ol className="text-xs text-blue-800 space-y-2 list-decimal list-inside">
                  <li>วาง ข้อความกฎหมายจากราชกิจจานุเบกษา</li>
                  <li>ระบบจะวิเคราะห์โดยอัตโนมัติ</li>
                  <li>ดูผลสรุปและแผนการดำเนินการ</li>
                  <li>นำไปใช้ในระบบทะเบียน</li>
                </ol>
              </div>
            </div>

            {/* Results */}
            {summary && (
              <div className="space-y-6 pt-6 border-t">
                {/* Key Points */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ประเด็นสำคัญ
                  </h3>
                  <div className="space-y-3">
                    {summary.keyPoints.length > 0 ? (
                      summary.keyPoints.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-green-50 rounded border border-green-200"
                        >
                          <span className="text-green-600 font-bold flex-shrink-0">•</span>
                          <p className="text-gray-700 text-sm">{point}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">ไม่พบประเด็นสำคัญ</p>
                    )}
                  </div>
                </div>

                {/* Action Items */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    สิ่งที่ต้องดำเนินการ
                  </h3>
                  <div className="space-y-3">
                    {summary.actionItems.length > 0 ? (
                      summary.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-orange-50 rounded border border-orange-200"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 accent-orange-600"
                          />
                          <p className="text-gray-700 text-sm">{item}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">ไม่พบสิ่งที่ต้องดำเนินการ</p>
                    )}
                  </div>
                </div>

                {/* Additional Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {summary.enforcementDate && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold mb-1">วันที่บังคับใช้</p>
                      <p className="font-medium text-gray-900">{summary.enforcementDate}</p>
                    </div>
                  )}
                  {summary.affectedParties.length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-xs text-purple-600 font-semibold mb-2">ผู้ที่ได้รับผลกระทบ</p>
                      <div className="flex flex-wrap gap-2">
                        {summary.affectedParties.map((party, idx) => (
                          <span key={idx} className="text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded">
                            {party}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Penalties */}
                {summary.penalties.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm font-semibold text-red-900 mb-3">⚠️ บทลงโทษ</p>
                    <ul className="space-y-2">
                      {summary.penalties.map((penalty, idx) => (
                        <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                          <span className="text-red-600">•</span>
                          {penalty}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Compliance Checklist */}
                {checklist && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">📋 แผนปรับปรุงความสอดคล้อง</h3>
                    <div className="space-y-3">
                      {checklist.map((task, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mt-1 w-4 h-4" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.item}</p>
                            <div className="flex gap-3 text-xs text-gray-600 mt-1">
                              <span>👤 {task.responsible}</span>
                              <span>📅 {task.deadline}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'เพิ่มกฎหมาย',
                  desc: 'บันทึกกฎหมายใหม่ลงในระบบ',
                  href: '/legal/add',
                  icon: '📝',
                },
                {
                  title: 'ค้นหากฎหมายใหม่',
                  desc: 'ดูกฎหมายที่เพิ่งเผยแพร่จากราชกิจจานุเบกษา',
                  href: '/new-laws',
                  icon: '🔍',
                },
                {
                  title: 'ประเมินความสอดคล้อง',
                  desc: 'ตรวจสอบสถานะการสอดคล้องทั้งองค์กร',
                  href: '/compliance',
                  icon: '✅',
                },
              ].map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-lg transition"
                >
                  <p className="text-3xl mb-2">{tool.icon}</p>
                  <h3 className="font-bold text-slate-900 mb-1">{tool.title}</h3>
                  <p className="text-sm text-gray-700">{tool.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
