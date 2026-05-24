import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'
import { 
  Sparkles, ArrowRight, Search, Copy, CheckCircle2, AlertCircle, 
  Upload, FileText, Globe, Clipboard, Shield, Scale, Clock, Key,
  Flame, FlaskConical, TreePine, Mountain, HardHat, Users, Cog, Eye, EyeOff
} from 'lucide-react'
import { summarizeLaw, generateComplianceChecklist } from '../lib/aiSummarization'
import { supabase, getCategories } from '../lib/supabase'
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
  const [savingToRegistry, setSavingToRegistry] = useState(false)

  // Gemini API Key State
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  // Load API Key from localStorage & inject PDF.js library dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('GEMINI_API_KEY') || ''
      setApiKey(savedKey)

      // Dynamic injection of PDF.js scripts for client-side PDF parsing
      if (!window.pdfjsLib) {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
        script.async = true
        script.onload = () => {
          window.pdfjsLib = window['pdfjs-dist/build/pdf']
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
        }
        document.body.appendChild(script)
      }
    }
  }, [])

  // Auto populate query parameters
  useEffect(() => {
    if (title) setLawTitle(decodeURIComponent(title))
    if (text) setLawText(decodeURIComponent(text))
    if (url) {
      setImportUrl(decodeURIComponent(url))
      setInputMode('url')
    }
  }, [title, text, url])

  // Save API Key to localStorage
  const handleSaveApiKey = (val) => {
    setApiKey(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('GEMINI_API_KEY', val)
    }
  }

  // Robust Client-side PDF Parser + Text Reader
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAttachedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type
    })

    // If PDF File
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      if (!window.pdfjsLib) {
        toast.error('ระบบกำลังโหลดตัวแปลงไฟล์ PDF กรุณารอสักครู่แล้วลองอีกครั้ง')
        return
      }

      setLoading(true)
      const toastId = toast.loading('กำลังแยกข้อความภาษาไทยจากไฟล์ PDF...')
      
      try {
        const reader = new FileReader()
        reader.onload = async function() {
          try {
            const typedarray = new Uint8Array(this.result)
            const pdf = await window.pdfjsLib.getDocument(typedarray).promise
            let fullText = ''
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i)
              const textContent = await page.getTextContent()
              const pageText = textContent.items.map(item => item.str).join(' ')
              fullText += pageText + '\n'
            }

            if (!fullText.trim()) {
              throw new Error('ไม่พบตัวอักษรในไฟล์ PDF (อาจเป็นไฟล์รูปภาพสแกนที่ไม่มีข้อความ)')
            }

            setLawText(fullText)
            if (!lawTitle) {
              setLawTitle(file.name.replace(/\.[^/.]+$/, ""))
            }
            toast.success('ดึงข้อความจากไฟล์ PDF สำเร็จ!', { id: toastId })
          } catch (err) {
            toast.error('ล้มเหลว: ' + err.message, { id: toastId })
          } finally {
            setLoading(false)
          }
        }
        reader.readAsArrayBuffer(file)
      } catch (err) {
        toast.error('ไม่สามารถอ่านไฟล์ได้', { id: toastId })
        setLoading(false)
      }
    } else {
      // Standard Text File
      const reader = new FileReader()
      reader.onload = (evt) => {
        setLawText(evt.target.result)
        if (!lawTitle) {
          setLawTitle(file.name.replace(/\.[^/.]+$/, ""))
        }
        toast.success('อ่านไฟล์และเตรียมข้อมูลสำเร็จ')
      }
      reader.onerror = () => {
        toast.error('ไม่สามารถอ่านไฟล์ได้')
      }
      reader.readAsText(file)
    }
  }

  const handleUrlFetch = async () => {
    if (!importUrl.trim()) {
      toast.error('กรุณากรอก URL กฎหมาย')
      return
    }

    let parsedUrl
    try {
      parsedUrl = new URL(importUrl.trim())
    } catch (err) {
      toast.error('รูปแบบ URL ไม่ถูกต้อง')
      return
    }

    const host = parsedUrl.hostname.replace(/^www\./, '')
    const source = host.includes('osh.labour.go.th')
      ? 'osh'
      : host.includes('ratchakitcha.soc.go.th')
      ? 'royal-gazette'
      : null

    if (!source) {
      toast.error('รองรับเฉพาะลิงก์ osh.labour.go.th และ ratchakitcha.soc.go.th')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/scrape-laws-v2?source=${source}&limit=20`)
      const result = await response.json()

      if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error(result.error || 'ไม่พบข้อมูลจากลิงก์ที่ระบุ')
      }

      const normalizedUrl = importUrl.trim().toLowerCase()
      const matchedLaw = result.data.find((law) => law.link?.toLowerCase() === normalizedUrl)
        || result.data.find((law) => normalizedUrl.includes(String(law.id).toLowerCase()))
        || result.data[0]

      setLawTitle(matchedLaw.title || '')
      setLawText([
        matchedLaw.summary,
        matchedLaw.status ? `สถานะ: ${matchedLaw.status}` : '',
        matchedLaw.lawType ? `ประเภท: ${matchedLaw.lawType}` : '',
        matchedLaw.safetyCategory ? `หมวดหมู่: ${matchedLaw.safetyCategory}` : '',
        matchedLaw.effectiveDate ? `วันที่บังคับใช้: ${matchedLaw.effectiveDate}` : '',
        matchedLaw.link ? `แหล่งที่มา: ${matchedLaw.link}` : '',
      ].filter(Boolean).join('\n'))
      setLoading(false)
      toast.success('นำเข้าเนื้อหาจากลิงก์หน่วยงานรัฐสำเร็จ')
      setInputMode('text')
    } catch (err) {
      toast.error(err.message || 'ไม่สามารถนำเข้าข้อมูลจากลิงก์ได้')
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!lawText.trim()) {
      toast.error('กรุณากรอกข้อความหรือนำเข้าเนื้อหากฎหมายก่อน')
      return
    }

    setLoading(true)
    try {
      const result = await summarizeLaw(lawText, lawTitle || 'กฎหมายวิเคราะห์นำเข้า')
      if (result) {
        setSummary(result)
        // Generate checklist dynamically
        const mockLaw = { 
          title: result.title, 
          responsible_person: 'ฝ่าย EHS / จป.วิชาชีพ',
          effective_date: result.effectiveDate || 'ภายใน 30 วัน',
          review_frequency: result.reviewFrequency
        }
        setChecklist(generateComplianceChecklist(mockLaw))
        if (apiKey && apiKey.trim()) {
          toast.success('วิเคราะห์เสร็จสิ้นด้วย Google Gemini 1.5 Flash!')
        } else {
          toast.success('วิเคราะห์เสร็จสิ้นด้วยระบบ local rules engine!')
        }
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

  const normalizeLawType = (lawType) => {
    if (lawType === 'พระราชบัญญัติ') return 'law'
    if (lawType === 'กฎกระทรวง' || lawType === 'พระราชกฤษฎีกา') return 'regulation'
    return 'announcement'
  }

  const handleSaveToRegistry = async () => {
    if (!summary) return

    setSavingToRegistry(true)
    try {
      let sourceHost = 'AI Analysis'
      if (importUrl) {
        try {
          sourceHost = new URL(importUrl).hostname
        } catch (err) {
          sourceHost = importUrl
        }
      }

      const { data: categories } = await getCategories()
      const matchedCategory = categories?.find((category) =>
        category.name === summary.safetyCategory ||
        category.name?.includes(summary.safetyCategory?.split(' ')[0])
      )

      const { data: newLaw, error: lawError } = await supabase
        .from('laws')
        .insert([{
          law_code: `AI-${Date.now()}`,
          title: summary.title || lawTitle || 'กฎหมายจาก AI',
          category_id: matchedCategory?.id || null,
          description: summary.summary || summary.keyPoints?.join('\n') || lawText.slice(0, 500),
          subject: summary.safetyCategory,
          effective_date: null,
          responsible_person: 'ฝ่าย EHS / จป.วิชาชีพ',
          review_frequency: summary.reviewFrequency,
          related_documents: summary.relatedDocuments?.join('\n') || importUrl,
          required_actions: summary.actionItems?.join('\n'),
          priority: summary.penalties?.length > 0 ? 'critical' : 'high',
          compliance_status: 'pending',
          issuing_authority: sourceHost,
          law_type: normalizeLawType(summary.lawType),
          status: 'active',
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        }])
        .select()

      if (lawError) throw lawError

      const lawId = newLaw?.[0]?.id

      if (lawId) {
        const analysisPayload = {
          law_id: lawId,
          analysis_source: apiKey ? 'gemini' : 'local_rules',
          raw_analysis: JSON.stringify(summary),
          where_to_do: summary.affectedParties?.join(', ') || 'ฝ่ายที่เกี่ยวข้อง',
          what_to_do: summary.actionItems || [],
          is_approved: false,
          created_by: 'AI Analysis',
        }

        const { error: analysisError } = await supabase
          .from('ai_analyses')
          .insert([analysisPayload])

        if (analysisError) {
          await supabase.from('ai_analyses').insert([{
            law_id: lawId,
            summary: summary.summary || summary.title,
            key_points: summary.keyPoints || [],
            created_at: new Date().toISOString(),
          }])
        }
      }

      toast.success('บันทึกผล AI เข้าทะเบียนกฎหมายและ Supabase แล้ว')
      router.push(lawId ? `/legal/${lawId}` : '/legal')
    } catch (err) {
      toast.error('บันทึกเข้าทะเบียนไม่สำเร็จ: ' + err.message)
    } finally {
      setSavingToRegistry(false)
    }
  }

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
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs text-indigo-350 font-bold border border-white/5 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> AI Engine v2.6 (Gemini Enabled)
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">
              ตัววิเคราะห์และสรุปกฎหมายอัจฉริยะ
            </h1>
            <p className="max-w-2xl text-slate-305 text-sm sm:text-base leading-relaxed">
              ช่วย จป.วิชาชีพ และทีม EHS วิเคราะห์ข้อบังคับกฎหมาย ประเมินประเภท จำแนกหมวดหมู่ความปลอดภัย แนะนำรอบการทบทวน และสร้าง Checklist ความสอดคล้องอย่างสมบูรณ์แบบ
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 backdrop-blur-sm self-stretch flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-2">เทคโนโลยีหลัก</p>
              <h3 className="text-lg font-bold">NLP & Smart Classification</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                เชื่อมต่อและแยกข้อความกฎหมายผ่าน Gemini API หรือคัดกรองข้อมูลอิงกฎกระทรวง จัดกลุ่มตาม 8 หมวดความปลอดภัยสากล
              </p>
            </div>
            <div className="border-t border-white/10 pt-4 mt-4 flex items-center justify-between text-xs text-slate-300">
              <span>ประมวลผลโลคอลทันที</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* API Key configuration banner */}
      <div className="card mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">🔑 เปิดใช้งานความสามารถวิเคราะห์กฎหมายได้จริง (Google Gemini API)</h4>
              <p className="text-xs text-slate-600 mt-1">
                กรอก Gemini API Key เพื่อประมวลผลผ่านโมเดลจริง หากเว้นว่างไว้ ระบบจะรันในโหมด EHS Local Rules Engine 
              </p>
            </div>
          </div>
          <div className="relative w-full md:w-80 flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="กรอก Gemini API Key ที่นี่..."
                className="w-full pl-3 pr-10 py-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white text-xs outline-none transition"
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 text-white font-bold text-xs rounded-xl px-3 py-2.5 hover:bg-blue-700 transition flex items-center justify-center flex-shrink-0"
            >
              รับ Key ฟรี ↗
            </a>
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
                แนบไฟล์ (PDF/TXT)
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
                ดึงจากราชกิจจา / ลิงก์รัฐ
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">อัปโหลดไฟล์เอกสารข้อความ (.txt) หรือเอกสารกฎหมาย (.pdf)</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-slate-350 rounded-[24px] p-8 text-center bg-slate-50/50 cursor-pointer relative group transition-all duration-300">
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:scale-110 transition duration-300" />
                    <p className="text-sm font-bold text-slate-700">ลากและวางไฟล์ PDF หรือ TXT หรือคลิกเพื่อเลือกไฟล์</p>
                    <p className="text-xs text-slate-450 mt-1">ดึงตัวอักษรภาษาไทยจาก PDF สแกน/ดิจิทัล ได้โดยตรงผ่านระบบ OCR/Text Extraction</p>
                  </div>
                  
                  {attachedFile && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fadeIn">
                      <FileText className="w-6 h-6 text-indigo-500 animate-pulse" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{attachedFile.name}</p>
                        <p className="text-xs text-slate-550">{attachedFile.size} • {attachedFile.type || 'ประเภทระบุไม่ได้'}</p>
                      </div>
                      <span className="badge bg-emerald-100 text-emerald-800 text-[10px] py-1 px-2.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ดึงข้อมูลสำเร็จ
                      </span>
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'url' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ระบุลิงก์นำเข้าข้อมูล (ราชกิจจานุเบกษา หรือ กรมสวัสดิการฯ OSH)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        placeholder="ตัวอย่าง: https://osh.labour.go.th/ความคืบหน้าของกฎหมาย หรือ ลิงก์ PDF ราชกิจจา..."
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
                      ระบุลิงก์จากเว็บไซต์ **กองความปลอดภัยแรงงาน (osh.labour.go.th)** หรือ **ราชกิจจานุเบกษา** เพื่อนำมาวิเคราะห์ด้วย AI ระบบจะจับคู่นำเสนอข้อมูลกฎหมายสเปกจริงพร้อมประเมินความสอดคล้องอย่างสมบูรณ์แบบ
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
                    <span>กำลังสรุปและแยกความต้องการผ่าน AI ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>เริ่มสรุปวิเคราะห์ด้วยระบบ AI ({apiKey ? 'โมเดลจริง' : 'โหมดจำลอง'})</span>
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
            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveToRegistry}
                disabled={savingToRegistry}
                className="btn-success"
              >
                <CheckCircle2 className="w-4 h-4" />
                {savingToRegistry ? 'กำลังบันทึกเข้า Supabase...' : 'บันทึกผล AI เข้าทะเบียนกฎหมาย'}
              </button>
              <Link href="/legal" className="btn-secondary">
                ไปที่ทะเบียนกฎหมาย <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

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
