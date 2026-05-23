import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'
import { 
  Sparkles, ArrowRight, Search, Copy, CheckCircle2, AlertCircle, 
  Upload, FileText, Globe, Clipboard, Shield, Scale, Clock, 
  Flame, FlaskConical, TreePine, Mountain, HardHat, Users, Cog
} from 'lucide-react'
import { summarizeLaw, generateComplianceChecklist } from '../lib/aiSummarization'
import toast from 'react-hot-toast'

export default function AiAnalysisPage() {
  const router = useRouter()
  const { title, text, url } = router.query

  const [inputMode, setInputMode] = useState('text') // 'text', 'file', 'url'
  const [lawText, setLawText] = useState('')
  const [lawTitle, setLawTitle] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  
  const [summary, setSummary] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [loading, setLoading] = useState(false)

  // Auto populate query parameters
  useEffect(() => {
    if (title) setLawTitle(decodeURIComponent(title))
    if (text) setLawText(decodeURIComponent(text))
    if (url) {
      setImportUrl(decodeURIComponent(url))
      setInputMode('url')
    }
  }, [title, text, url])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAttachedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type
    })

    const reader = new FileReader()
    reader.onload = (evt) => {
      setLawText(evt.target.result)
      if (!lawTitle) {
        // Set title to filename minus extension
        setLawTitle(file.name.replace(/\.[^/.]+$/, ""))
      }
      toast.success('อ่านไฟล์และเตรียมข้อมูลสำเร็จ')
    }
    reader.onerror = () => {
      toast.error('ไม่สามารถอ่านไฟล์ได้')
    }
    reader.readAsText(file)
  }

  const handleUrlFetch = () => {
    if (!importUrl.trim()) {
      toast.error('กรุณากรอก URL ราชกิจจานุเบกษา')
      return
    }

    if (!importUrl.startsWith('http://') && !importUrl.startsWith('https://')) {
      toast.error('กรุณากรอกรูปแบบ URL ที่ถูกต้อง')
      return
    }

    setLoading(true)
    setTimeout(() => {
      // Simulate fetching title and content from URL
      let fetchedTitle = 'ประกาศราชกิจจานุเบกษา จาก URL'
      let fetchedText = `พระราชบัญญัติ ว่าด้วยมาตรฐานความปลอดภัยในการทำงาน EHS หมวดหมู่การป้องกันควบคุมอุบัติภัยร้ายแรงทางเคมีและพลังงานความร้อน บังคับใช้นับแต่วันถัดจากวันประกาศในราชกิจจานุเบกษาเป็นต้นไป ผู้ใดไม่ปฏิบัติตามปรับไม่เกินหนึ่งแสนบาท`

      if (importUrl.includes('1887309.pdf')) {
        fetchedTitle = 'พระราชบัญญัติ ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. ๒๕๕๔'
        fetchedText = 'พระราชบัญญัติ ความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. ๒๕๕๔ เพื่อส่งเสริมการดูแลรักษาสิ่งแวดล้อม สุขภาพพนักงาน และควบคุมการปฏิบัติงานทั่วไปของสถานประกอบการ'
      } else if (importUrl.includes('1993412.pdf')) {
        fetchedTitle = 'กฎกระทรวง กำหนดมาตรฐานในการบริหาร จัดการ และดำเนินการด้านความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงานเกี่ยวกับสารเคมีอันตราย พ.ศ. ๒๕๕๖'
        fetchedText = 'กำหนดมาตรฐานในการบริหารจัดการสารเคมีอันตราย ข้อมูล SDS การตรวจสุขภาพพนักงาน การป้องกันสารเคมีรั่วไหล สารระเหย และมาตรฐานการเตือนภัย'
      }

      setLawTitle(fetchedTitle)
      setLawText(fetchedText)
      setLoading(false)
      toast.success('นำเข้าเนื้อหากฎหมายจากราชกิจจานุเบกษาสำเร็จ!')
      setInputMode('text') // Switch back to text to show fetched contents
    }, 1200)
  }

  const handleAnalyze = async () => {
    if (!lawText.trim()) {
      toast.error('กรุณากรอกข้อความหรือนำเข้าเนื้อหากฎหมายก่อน')
      return
    }

    setLoading(true)
    try {
      const result = await summarizeLaw(lawText, lawTitle || 'กฎหมายนำเข้าจากผู้ใช้')
      if (result) {
        setSummary(result)
        // Generate checklist based on analysis
        const mockLaw = { 
          title: result.title, 
          responsible_person: 'ฝ่าย EHS / จป.วิชาชีพ',
          effective_date: result.effectiveDate || 'ภายใน 30 วัน',
          review_frequency: result.reviewFrequency
        }
        setChecklist(generateComplianceChecklist(mockLaw))
        toast.success('วิเคราะห์และประเมินสอดคล้องสำเร็จ!')
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการวิเคราะห์ด้วย AI')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('คัดลอกลง Clipboard เรียบร้อย')
  }

  // Helper colors for types and categories
  const getLawTypeBadgeColor = (type) => {
    switch (type) {
      case 'พระราชบัญญัติ': return 'badge-lawtype-act'
      case 'พระราชกฤษฎีกา': return 'badge-lawtype-decree'
      case 'กฎกระทรวง': return 'badge-lawtype-ministerial'
      case 'ประกาศกระทรวง': return 'badge-lawtype-ministry-ann'
      case 'ประกาศกรม': return 'badge-lawtype-dept-ann'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'ความปลอดภัยทั่วไป': return 'badge-cat-general'
      case 'เครื่องจักร / อุปกรณ์ / เครื่องมือ': return 'badge-cat-machinery'
      case 'ไฟฟ้าและอัคคีภัย': return 'badge-cat-electrical'
      case 'สารเคมีและวัตถุอันตราย': return 'badge-cat-chemical'
      case 'สิ่งแวดล้อมในการทำงาน': return 'badge-cat-env'
      case 'การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย': return 'badge-cat-confined'
      case 'การก่อสร้าง': return 'badge-cat-construction'
      case 'สวัสดิการและแรงงาน': return 'badge-cat-welfare'
      default: return 'bg-slate-100 text-slate-850'
    }
  }

  return (
    <Layout>
      {/* Header Banner */}
      <div className="mb-8 rounded-[32px] bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[2fr_1fr] items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs text-indigo-300 font-semibold border border-white/5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> AI Engine v2.5
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
              ตัววิเคราะห์และสรุปกฎหมายอัจฉริยะ
            </h1>
            <p className="max-w-2xl text-slate-300 text-sm sm:text-base leading-relaxed">
              ช่วย จป.วิชาชีพ และทีม EHS วิเคราะห์ข้อบังคับกฎหมาย ประเมินประเภท จำแนกหมวดหมู่ความปลอดภัย แนะนำรอบการทบทวน และสร้าง Checklist ความสอดคล้องอย่างสมบูรณ์แบบ
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-sm self-stretch flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-2">เทคโนโลยีหลัก</p>
              <h3 className="text-lg font-bold">NLP & Smart Classification</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                คัดกรองข้อมูลอิงกฎกระทรวงและพระราชบัญญัติจริง แยกประเภท อัตราโทษปรับ พร้อมสร้าง Checklist จัดกลุ่มตาม 8 หมวดความปลอดภัยสากล
              </p>
            </div>
            <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between text-xs text-slate-305">
              <span>ประมวลผลโลคอลทันที</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.8fr_1.2fr] items-start">
        {/* Left Column: Form & Tools */}
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-200/70 shadow-xl overflow-hidden">
            {/* Tab Selectors */}
            <div className="flex bg-slate-50 border-b border-slate-200/80 p-2 gap-2">
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
                  inputMode === 'text'
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                <Clipboard className="w-4 h-4 text-slate-500" />
                วางข้อความกฎหมาย
              </button>
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
                  inputMode === 'file'
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4 text-slate-500" />
                แนบไฟล์กฎหมาย
              </button>
              <button
                type="button"
                onClick={() => setInputMode('url')}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all ${
                  inputMode === 'url'
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-900/5'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                <Globe className="w-4 h-4 text-slate-500" />
                ดึงจากราชกิจจานุเบกษา URL
              </button>
            </div>

            {/* Input Form Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ชื่อกฎหมายอย่างเป็นทางการ</label>
                <input
                  type="text"
                  value={lawTitle}
                  onChange={(e) => setLawTitle(e.target.value)}
                  placeholder="ตัวอย่าง: พระราชบัญญัติความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน พ.ศ. ๒๕๕๔"
                  className="input-field rounded-2xl border-slate-200"
                />
              </div>

              {inputMode === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ข้อความหรือบทสรุปข้อบังคับ</label>
                  <textarea
                    value={lawText}
                    onChange={(e) => setLawText(e.target.value)}
                    placeholder="วางเนื้อหากฎหมายหรือคำอธิบายข้อบังคับเพื่อส่งวิเคราะห์..."
                    rows={8}
                    className="input-field rounded-2xl border-slate-200"
                  />
                </div>
              )}

              {inputMode === 'file' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">อัปโหลดไฟล์เอกสาร (.txt, .docx, .pdf)</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-[24px] p-8 text-center bg-slate-50/50 cursor-pointer relative group transition-all duration-300">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:scale-110 transition duration-300" />
                    <p className="text-sm font-bold text-slate-700">ลากและวางไฟล์ หรือคลิกเพื่อเปิดเครื่องคอมพิวเตอร์ของคุณ</p>
                    <p className="text-xs text-slate-450 mt-1">เฉพาะรูปแบบไฟล์ข้อความ .txt หรือเอกสารเท่านั้น</p>
                  </div>
                  
                  {attachedFile && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <FileText className="w-6 h-6 text-indigo-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{attachedFile.name}</p>
                        <p className="text-xs text-slate-500">{attachedFile.size} • {attachedFile.type || 'Text File'}</p>
                      </div>
                      <span className="badge bg-emerald-100 text-emerald-800 text-[10px] py-1 px-2 rounded-full">นำเข้าแล้ว</span>
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ระบุลิงก์นำเข้าข้อมูล (ratchakitcha.soc.go.th)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="ตัวอย่าง: https://ratchakitcha.soc.go.th/documents/1993412.pdf"
                        className="input-field rounded-2xl border-slate-200 flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleUrlFetch}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-6 py-3 font-semibold transition text-sm flex-shrink-0"
                      >
                        นำเข้าข้อมูล
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 border border-indigo-150 p-4 text-indigo-850 text-xs leading-relaxed flex gap-2">
                    <Globe className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>
                      ระบบจะสแกนและจับคู่ข้อมูลอ้างอิงจากฐานข้อมูลราชกิจจานุเบกษาของเราตามรหัสลิงก์ เพื่อดึงข้อสรุปที่เป็นมาตรฐานเข้ามาให้อัตโนมัติโดยที่จป. ไม่ต้องสแกนพิมพ์เอง
                    </span>
                  </div>
                </div>
              )}

              {/* Action Trigger */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading || !lawText}
                className="btn-primary w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-lg shadow-slate-950/10 transition-all font-semibold disabled:bg-slate-200 disabled:text-slate-450 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                    <span>กำลังสรุปและประมวลผลด้วย AI Smart Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>เริ่มสรุปและประเมินประเภทกฎหมาย</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Information Cards */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              เกณฑ์รอบการทบทวน
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              ตามหลักการประเมินสอดคล้อง (Compliance Assessment) ของ EHS กฎหมายแต่ละประเภทมีลักษณะการปรับปรุงและเปลี่ยนแปลงความถี่แตกต่างกันไป AI จะวิเคราะห์ประเภทกฎหมายและเสนอแนะรอบการตรวจทบทวนให้อัตโนมัติดังนี้:
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold">พระราชบัญญัติ (พรบ.)</span>
                <span className="bg-indigo-500/20 text-indigo-305 px-2.5 py-1 rounded-full font-semibold border border-indigo-500/20">ทุก 12 เดือน (1 ปี)</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold">พระราชกฤษฎีกา (พรฎ.)</span>
                <span className="bg-purple-500/20 text-purple-305 px-2.5 py-1 rounded-full font-semibold border border-purple-500/20">ทุก 6 เดือน</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold">กฎกระทรวง</span>
                <span className="bg-sky-500/20 text-sky-305 px-2.5 py-1 rounded-full font-semibold border border-sky-500/20">ทุก 6 เดือน</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="font-bold">ประกาศกระทรวง / กรม</span>
                <span className="bg-orange-500/20 text-orange-305 px-2.5 py-1 rounded-full font-semibold border border-orange-500/20">ทุก 3 เดือน</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">8 หมวดหมู่ความปลอดภัยในการทำงาน</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              เราจำแนกกฎหมายเข้าสู่หมวดหมู่ต่างๆ เพื่อให้ง่ายต่อการแบ่งการทำงานและการประเมินความสอดคล้องตามหน่วยงานที่เกี่ยวข้อง
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><Shield className="w-3.5 h-3.5 text-slate-500" />ความปลอดภัยทั่วไป</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><Cog className="w-3.5 h-3.5 text-teal-500" />เครื่องจักร/อุปกรณ์</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><Flame className="w-3.5 h-3.5 text-amber-500" />ไฟฟ้าและอัคคีภัย</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><FlaskConical className="w-3.5 h-3.5 text-red-500" />สารเคมี/วัตถุอันตราย</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><TreePine className="w-3.5 h-3.5 text-green-500" />สิ่งแวดล้อม EHS</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><Mountain className="w-3.5 h-3.5 text-rose-500" />ที่สูง/ที่อับอากาศ</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><HardHat className="w-3.5 h-3.5 text-orange-500" />การก่อสร้าง</div>
              <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl"><Users className="w-3.5 h-3.5 text-cyan-500" />สวัสดิการ/แรงงาน</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {summary && (
        <div className="mt-8 space-y-8 animate-fadeIn">
          {/* Classification Result Badges */}
          <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ผลการวิเคราะห์และระบุหมวดหมู่โดย AI
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Type Badge Card */}
              <div className="p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">ประเภทเอกสารกฎหมาย</span>
                <div className="my-4">
                  <span className={`badge text-xs py-2 px-4 rounded-full inline-block ${getLawTypeBadgeColor(summary.lawType)}`}>
                    {summary.lawType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  จำแนกจากโครงสร้างหัวเรื่องและระดับของประกาศพระราชกฤษฎีกา/ประกาศกระทรวง
                </p>
              </div>

              {/* Category Card */}
              <div className="p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">หมวดหมู่ความปลอดภัย</span>
                <div className="my-4">
                  <span className={`badge text-xs py-2 px-4 rounded-full inline-block ${getCategoryClass(summary.safetyCategory)}`}>
                    {summary.safetyCategory}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  จำแนกตามมาตรฐานความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อมในการปฏิบัติงาน EHS
                </p>
              </div>

              {/* Review Frequency Card */}
              <div className="p-5 rounded-[24px] bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">รอบการตรวจทบทวนความสอดคล้อง</span>
                <div className="my-4 flex items-center gap-2 text-indigo-700 font-bold text-lg">
                  <Clock className="w-5 h-5 text-indigo-500" />
                  <span>{summary.reviewFrequency}</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  รอบทบทวนที่เหมาะสมแนะนำอิงตามพระราชบัญญัติและประเภทการปรับปรุงของกฎหมาย
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Key Points Card */}
            <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 sm:p-8 shadow-sm">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">สรุปประเด็นหลักสำคัญ</p>
              <div className="space-y-3">
                {summary.keyPoints.length > 0 ? (
                  summary.keyPoints.map((point, idx) => (
                    <div key={idx} className="rounded-2xl bg-indigo-50/50 border border-indigo-100/50 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed relative flex gap-3">
                      <span className="h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">ไม่มีข้อมูลสรุปประเด็นหลักสำคัญ</p>
                )}
              </div>
            </div>

            {/* Action Items Card */}
            <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 sm:p-8 shadow-sm">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">สิ่งที่ต้องดำเนินการตามกฎหมาย</p>
              <div className="space-y-3">
                {summary.actionItems.length > 0 ? (
                  summary.actionItems.map((item, idx) => (
                    <div key={idx} className="rounded-2xl bg-amber-50/50 border border-amber-100/50 p-4 text-xs sm:text-sm text-slate-800 leading-relaxed flex gap-3">
                      <span className="h-5 w-5 bg-amber-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">ไม่มีสิ่งต้องการที่ตรวจวัดได้</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Penalties & Fines */}
            <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 sm:p-8 shadow-sm">
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" /> อัตราโทษปรับและบทลงโทษ
              </h4>
              {summary.penalties.length > 0 ? (
                <ul className="space-y-2">
                  {summary.penalties.map((penalty, idx) => (
                    <li key={idx} className="text-xs sm:text-sm bg-red-50/50 border border-red-100/50 text-slate-800 p-3 rounded-2xl font-semibold flex justify-between items-center">
                      <span>{penalty}</span>
                      <span className="badge badge-critical text-[10px]">มีอัตราโทษ</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold text-center">
                  ไม่พบข้อกำหนดบทลงโทษในร่างกฎหมายเบื้องต้นนี้
                </div>
              )}
            </div>

            {/* Affected & Effectiveness */}
            <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 sm:p-8 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">ขอบเขตผู้ได้รับผลกระทบและการบังคับใช้</h4>
              <div>
                <p className="text-[10px] font-bold text-slate-450 uppercase mb-2">กลุ่มผู้เกี่ยวข้องโดยตรง:</p>
                <div className="flex flex-wrap gap-2">
                  {summary.affectedParties.map((party, idx) => (
                    <span key={idx} className="badge bg-slate-100 text-slate-800 text-[11px] font-semibold py-1 px-3 rounded-full border border-slate-200">
                      {party}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-450 uppercase mb-1">วันที่ประกาศ / เริ่มบังคับใช้ทางราชการ:</p>
                <p className="text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 inline-block">
                  {summary.effectiveDate || 'มีผลบังคับใช้ทันทีเมื่อพ้นกำหนดตามราชกิจจานุเบกษา'}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Action Plan Checklist */}
          {checklist && (
            <div className="bg-white rounded-[32px] border border-slate-200/70 p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    แผนงานมอบหมายเพื่อความสอดคล้อง (Compliance Action Plan)
                  </h3>
                  <p className="text-xs text-slate-550 mt-1">
                    Checklist แนะนำการดำเนินการที่เกี่ยวข้องกับกฎหมายใหม่นี้ คุณสามารถแก้ไขและนำเข้ารายงานงานต่อไป
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toast.success('บันทึกแผนมอบหมายและบันทึกความสอดคล้องสำเร็จ!')
                    router.push('/tasks')
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-md shadow-emerald-600/10 flex items-center gap-1.5 self-start sm:self-center"
                >
                  <CheckCircle2 className="w-4 h-4" /> บันทึกและมอบหมายแผนปฏิบัติการ
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {checklist.map((task, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="h-6 w-6 rounded-full bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm sm:text-base">{task.item}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          ผู้รับผิดชอบที่แนะนำ: <span className="font-semibold text-slate-700">{task.responsible}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 self-end sm:self-center text-xs">
                      <span className="bg-slate-50 border border-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-xl">
                        กำหนดส่ง: {task.deadline}
                      </span>
                      <span className="status-pending px-3 py-1.5 rounded-xl text-[10px] font-bold">
                        รอมอบหมาย
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
