import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'
import {
  Sparkles, CheckCircle2, AlertCircle, Upload, FileText,
  Globe, Clipboard, Clock, Key, Eye, EyeOff, ArrowRight,
  BookMarked, Send, RefreshCw, MessageSquare, Lightbulb,
  ExternalLink, Wifi, WifiOff, ChevronDown, ChevronUp,
  Copy, BookOpen, Zap, Brain,
} from 'lucide-react'
import { summarizeLaw } from '../lib/aiSummarization'
import { supabase, getCategories } from '../lib/supabase'
import {
  checkConnection, setupLawNotebook, sendChatMessage,
  getSourceInsights, generateInsight,
  getOpenNotebookConfig, saveOpenNotebookConfig,
} from '../lib/openNotebook'
import toast from 'react-hot-toast'

const INPUT_TABS = [
  { key: 'text', label: 'วางข้อความ', icon: Clipboard },
  { key: 'file', label: 'แนบไฟล์ PDF/TXT', icon: Upload },
  { key: 'url', label: 'ลิงก์ราชกิจจาฯ', icon: Globe },
]

export default function AiAnalysisPage() {
  const router = useRouter()
  const { title: qTitle, text: qText, url: qUrl } = router.query

  // ── Input state ──────────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState('text')
  const [lawText, setLawText] = useState('')
  const [lawTitle, setLawTitle] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  // ── Result state ─────────────────────────────────────────────────────────
  const [result, setResult] = useState(null)     // { title, summary, keyPoints, lawType, safetyCategory, reviewFrequency, actionItems }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // ── Open Notebook state ──────────────────────────────────────────────────
  const [onOpen, setOnOpen] = useState(false)
  const [onConnected, setOnConnected] = useState(null)
  const [onChecking, setOnChecking] = useState(false)
  const [onUrl, setOnUrl] = useState('')
  const [onPassword, setOnPassword] = useState('')
  const [onNotebookId, setOnNotebookId] = useState(null)
  const [onSessionId, setOnSessionId] = useState(null)
  const [onSourceId, setOnSourceId] = useState(null)
  const [onSending, setOnSending] = useState(false)
  const [onMessages, setOnMessages] = useState([])
  const [onInput, setOnInput] = useState('')
  const [onInsights, setOnInsights] = useState([])
  const [onInsightLoading, setOnInsightLoading] = useState(false)
  const [onSetupLoading, setOnSetupLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Load saved config
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('GEMINI_API_KEY') || '')
      const cfg = getOpenNotebookConfig()
      setOnUrl(cfg.url)
      setOnPassword(cfg.password)
      if (!window.pdfjsLib) {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
        s.async = true
        s.onload = () => {
          window.pdfjsLib = window['pdfjs-dist/build/pdf']
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
        }
        document.body.appendChild(s)
      }
    }
  }, [])

  useEffect(() => {
    if (qTitle) setLawTitle(decodeURIComponent(qTitle))
    if (qText) setLawText(decodeURIComponent(qText))
    if (qUrl) { setImportUrl(decodeURIComponent(qUrl)); setInputMode('url') }
  }, [qTitle, qText, qUrl])

  const saveApiKey = v => {
    setApiKey(v)
    localStorage.setItem('GEMINI_API_KEY', v)
  }

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    setAttachedFile({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' })
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      if (!window.pdfjsLib) { toast.error('PDF reader loading, please try again'); return }
      setLoading(true)
      const id = toast.loading('กำลังอ่านไฟล์ PDF...')
      try {
        const reader = new FileReader()
        reader.onload = async function () {
          const pdf = await window.pdfjsLib.getDocument(new Uint8Array(this.result)).promise
          let text = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const content = await page.getTextContent()
            text += content.items.map(x => x.str).join(' ') + '\n'
          }
          if (!text.trim()) throw new Error('ไม่พบข้อความในไฟล์ PDF')
          setLawText(text)
          if (!lawTitle) setLawTitle(file.name.replace(/\.[^/.]+$/, ''))
          toast.success('อ่านไฟล์ PDF สำเร็จ', { id })
          setLoading(false)
        }
        reader.readAsArrayBuffer(file)
      } catch (err) { toast.error(err.message, { id }); setLoading(false) }
    } else {
      const reader = new FileReader()
      reader.onload = e => {
        setLawText(e.target.result)
        if (!lawTitle) setLawTitle(file.name.replace(/\.[^/.]+$/, ''))
        toast.success('อ่านไฟล์สำเร็จ')
      }
      reader.readAsText(file)
    }
  }

  // ── URL fetch ────────────────────────────────────────────────────────────
  const handleUrlFetch = async () => {
    if (!importUrl.trim()) { toast.error('กรุณากรอก URL'); return }
    let parsed
    try { parsed = new URL(importUrl.trim()) } catch { toast.error('URL ไม่ถูกต้อง'); return }
    const host = parsed.hostname.replace(/^www\./, '')
    const source = host.includes('osh.labour.go.th') ? 'osh' : host.includes('ratchakitcha.soc.go.th') ? 'royal-gazette' : null
    if (!source) { toast.error('รองรับเฉพาะลิงก์ osh.labour.go.th และ ratchakitcha.soc.go.th'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/scrape-laws-v2?source=${source}&limit=20`)
      const data = await res.json()
      if (!data.success || !data.data?.length) throw new Error(data.error || 'ไม่พบข้อมูล')
      const law = data.data.find(l => l.link?.toLowerCase() === importUrl.trim().toLowerCase()) || data.data[0]
      setLawTitle(law.title || '')
      setLawText([law.summary, law.lawType && `ประเภท: ${law.lawType}`, law.safetyCategory && `หมวดหมู่: ${law.safetyCategory}`, law.link && `ลิงก์: ${law.link}`].filter(Boolean).join('\n'))
      setInputMode('text')
      toast.success('นำเข้าข้อมูลสำเร็จ')
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }

  // ── Analyze ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!lawText.trim()) { toast.error('กรุณากรอกข้อความกฎหมายก่อน'); return }
    setLoading(true)
    setResult(null)
    try {
      const data = await summarizeLaw(lawText, lawTitle || 'กฎหมาย')
      if (data) {
        setResult(data)
        toast.success(apiKey ? 'วิเคราะห์ด้วย Gemini AI สำเร็จ' : 'วิเคราะห์ด้วยระบบ Local สำเร็จ')
      } else {
        toast.error('ไม่สามารถวิเคราะห์ได้')
      }
    } catch { toast.error('เกิดข้อผิดพลาดในการวิเคราะห์') } finally { setLoading(false) }
  }

  const copyResult = () => {
    if (!result) return
    const text = `${result.title}\n\nสรุป:\n${result.summary}\n\nประเด็นสำคัญ:\n${result.keyPoints?.map((p, i) => `${i + 1}. ${p}`).join('\n') || '-'}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('คัดลอกแล้ว')
  }

  // ── Save to registry ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      const { data: cats } = await getCategories()
      const matched = cats?.find(c => c.name === result.safetyCategory || c.name?.includes(result.safetyCategory?.split(' ')[0]))
      const { data: law, error } = await supabase.from('laws').insert([{
        law_code: `AI-${Date.now()}`,
        title: result.title || lawTitle || 'กฎหมายจาก AI',
        category_id: matched?.id || null,
        description: result.summary,
        subject: result.safetyCategory,
        responsible_person: 'ฝ่าย EHS / จป.วิชาชีพ',
        review_frequency: result.reviewFrequency,
        required_actions: result.actionItems?.join('\n'),
        priority: result.penalties?.length > 0 ? 'critical' : 'high',
        compliance_status: 'pending',
        status: 'active',
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      }]).select().single()
      if (error) throw error
      toast.success('บันทึกเข้าทะเบียนกฎหมายแล้ว')
      router.push(`/legal/${law.id}`)
    } catch (err) { toast.error('บันทึกไม่สำเร็จ: ' + err.message) } finally { setSaving(false) }
  }

  // ── Open Notebook handlers ────────────────────────────────────────────────
  const handleOnCheck = async () => {
    saveOpenNotebookConfig({ url: onUrl, password: onPassword })
    setOnChecking(true)
    const r = await checkConnection()
    setOnConnected(r.ok)
    setOnChecking(false)
    if (r.ok) toast.success('เชื่อมต่อ Open Notebook สำเร็จ!')
    else toast.error('เชื่อมต่อไม่ได้: ' + r.error)
  }

  const handleOnSetup = async () => {
    if (!lawText.trim() && !importUrl.trim()) { toast.error('ใส่ข้อความหรือ URL ก่อน'); return }
    setOnSetupLoading(true)
    try {
      saveOpenNotebookConfig({ url: onUrl, password: onPassword })
      const { notebookId, sourceId, sessionId } = await setupLawNotebook({ title: lawTitle || 'กฎหมาย EHS', content: lawText, url: importUrl || undefined })
      setOnNotebookId(notebookId); setOnSourceId(sourceId); setOnSessionId(sessionId)
      setOnMessages([{ role: 'assistant', content: `✅ พร้อมแล้ว สามารถถามคำถามเกี่ยวกับ **"${lawTitle || 'กฎหมาย'}"** ได้เลย` }])
      toast.success('Open Notebook พร้อมใช้งาน!')
    } catch (err) { toast.error(err.message) } finally { setOnSetupLoading(false) }
  }

  const handleOnSend = async () => {
    if (!onInput.trim() || !onSessionId) return
    const msg = onInput.trim(); setOnInput('')
    setOnMessages(prev => [...prev, { role: 'user', content: msg }])
    setOnSending(true)
    try {
      const r = await sendChatMessage({ sessionId: onSessionId, message: msg })
      setOnMessages(prev => [...prev, { role: 'assistant', content: r?.message || r?.response || r?.content || JSON.stringify(r) }])
    } catch (err) { setOnMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${err.message}` }]) }
    finally { setOnSending(false); setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }
  }

  const handleOnInsights = async () => {
    if (!onSourceId) return
    setOnInsightLoading(true)
    try {
      await generateInsight(onSourceId, 'summary').catch(() => {})
      const data = await getSourceInsights(onSourceId)
      const items = Array.isArray(data) ? data : data?.insights || []
      setOnInsights(items)
      if (!items.length) toast('ระบบกำลังประมวลผล', { icon: '⏳' })
    } catch (err) { toast.error(err.message) } finally { setOnInsightLoading(false) }
  }

  const lawTypeColors = {
    'พระราชบัญญัติ': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'พระราชกฤษฎีกา': 'bg-violet-50 text-violet-700 border-violet-200',
    'กฎกระทรวง': 'bg-blue-50 text-blue-700 border-blue-200',
    'ประกาศกระทรวง': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'ประกาศกรม': 'bg-teal-50 text-teal-700 border-teal-200',
  }

  return (
    <Layout>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl shadow-lg shadow-indigo-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">วิเคราะห์กฎหมายด้วย AI</h1>
          </div>
          <p className="text-slate-500 text-sm ml-14">สรุปประเด็นสำคัญ จำแนกประเภท และระบุหมวดหมู่ความปลอดภัยโดยอัตโนมัติ</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${apiKey ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          <Zap className="w-3.5 h-3.5" />
          {apiKey ? 'Gemini AI (โมเดลจริง)' : 'Local Rules Engine'}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
        {/* ── LEFT: Input + Results ─────────────────────────────────────── */}
        <div className="space-y-5">

          {/* API Key */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
                <Key className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700">Gemini API Key <span className="text-slate-400 font-normal">(ไม่บังคับ — ระบบทำงานได้โดยไม่ต้องใช้)</span></p>
                <div className="flex gap-2 mt-1.5">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => saveApiKey(e.target.value)}
                      placeholder="AIza..."
                      className="input-field py-2 text-sm pr-9"
                    />
                    <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl whitespace-nowrap">
                    รับฟรี <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Input card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs */}
            <div className="flex bg-slate-50 border-b border-slate-100 p-1.5 gap-1">
              {INPUT_TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => setInputMode(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${inputMode === tab.key ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">ชื่อกฎหมาย</label>
                <input
                  type="text"
                  value={lawTitle}
                  onChange={e => setLawTitle(e.target.value)}
                  placeholder="พระราชบัญญัติ / กฎกระทรวง / ประกาศ..."
                  className="input-field text-sm"
                />
              </div>

              {inputMode === 'text' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">เนื้อหากฎหมาย</label>
                  <textarea
                    value={lawText}
                    onChange={e => setLawText(e.target.value)}
                    placeholder="วางเนื้อหาหรือบทสรุปของกฎหมายที่ต้องการวิเคราะห์..."
                    rows={9}
                    className="input-field text-sm resize-none"
                  />
                </div>
              )}

              {inputMode === 'file' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">อัปโหลดไฟล์</label>
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-8 text-center bg-slate-50 transition-colors cursor-pointer group">
                    <input type="file" accept=".txt,.pdf" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                    <p className="text-sm font-semibold text-slate-600">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
                    <p className="text-xs text-slate-400 mt-1">รองรับ PDF และ TXT</p>
                  </div>
                  {attachedFile && (
                    <div className="flex items-center gap-3 mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      <p className="text-sm font-semibold text-slate-800 truncate flex-1">{attachedFile.name}</p>
                      <span className="text-xs text-slate-500">{attachedFile.size}</span>
                    </div>
                  )}
                </div>
              )}

              {inputMode === 'url' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL ราชกิจจานุเบกษา / กรมสวัสดิการฯ</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={importUrl}
                      onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://ratchakitcha.soc.go.th/..."
                      className="input-field text-sm flex-1"
                    />
                    <button onClick={handleUrlFetch} disabled={loading} className="btn-primary px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700">
                      นำเข้า
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || !lawText.trim()}
                className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังวิเคราะห์...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> วิเคราะห์กฎหมาย</>
                )}
              </button>
            </div>
          </div>

          {/* ── Results ──────────────────────────────────────────────────── */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Classification chips */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ผลการวิเคราะห์
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={copyResult} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-400 px-3 py-1.5 rounded-xl transition-all">
                      <Copy className="w-3.5 h-3.5" /> {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                    <button onClick={handleSave} disabled={saving} className="btn-success text-xs px-3 py-1.5">
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                      {saving ? 'กำลังบันทึก...' : 'บันทึกเข้าทะเบียน'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {result.lawType && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${lawTypeColors[result.lawType] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {result.lawType}
                    </span>
                  )}
                  {result.safetyCategory && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {result.safetyCategory}
                    </span>
                  )}
                  {result.reviewFrequency && (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {result.reviewFrequency}
                    </span>
                  )}
                </div>

                {/* Summary */}
                {result.summary && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">บทสรุป</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                  </div>
                )}

                {/* Key Points */}
                {result.keyPoints?.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">ประเด็นสำคัญ</p>
                    <div className="space-y-2">
                      {result.keyPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-slate-700 leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save CTA */}
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-success justify-center py-3">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                  {saving ? 'กำลังบันทึก...' : 'บันทึกเข้าทะเบียนกฎหมาย'}
                </button>
                <Link href="/legal" className="btn-secondary px-5 py-3">
                  ดูทะเบียน <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* ── Open Notebook ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-violet-200 bg-violet-50/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setOnOpen(v => !v)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-violet-100/50 transition-colors"
            >
              <div className="p-2 bg-violet-600 rounded-xl shadow flex-shrink-0">
                <BookMarked className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-violet-900 text-sm">Open Notebook — RAG Chat</p>
                <p className="text-xs text-violet-600 mt-0.5">สร้าง Knowledge Base จากกฎหมายนี้ แล้ว Chat ถาม-ตอบกับ AI หลายโมเดล</p>
              </div>
              <div className="flex items-center gap-2">
                {onConnected === true && <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1"><Wifi className="w-3.5 h-3.5" /> เชื่อมต่อแล้ว</span>}
                {onConnected === false && <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1"><WifiOff className="w-3.5 h-3.5" /> ไม่ได้เชื่อมต่อ</span>}
                {onOpen ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-violet-500" />}
              </div>
            </button>

            {onOpen && (
              <div className="border-t border-violet-200 p-5 space-y-4">
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-violet-700 mb-1">Open Notebook URL</label>
                    <input type="url" value={onUrl} onChange={e => setOnUrl(e.target.value)} placeholder="http://localhost:5055" className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-violet-700 mb-1">Password</label>
                    <input type="password" value={onPassword} onChange={e => setOnPassword(e.target.value)} placeholder="ไม่บังคับ" className="input-field text-sm w-40" />
                  </div>
                  <button onClick={handleOnCheck} disabled={onChecking} className="btn-primary bg-violet-600 hover:bg-violet-700 py-2.5 px-3">
                    {onChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  </button>
                </div>

                {!onSessionId ? (
                  <button onClick={handleOnSetup} disabled={onSetupLoading || (!lawText && !importUrl)} className="w-full btn-primary bg-violet-700 hover:bg-violet-800 disabled:opacity-50 justify-center">
                    {onSetupLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> กำลังสร้าง...</> : <><BookMarked className="w-4 h-4" /> สร้าง Notebook และเริ่ม Chat</>}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-mono">Notebook: {onNotebookId?.slice(0, 12)}…</span>
                      <button onClick={() => { setOnSessionId(null); setOnMessages([]); setOnInsights([]) }} className="ml-auto text-slate-400 hover:text-red-500">รีเซ็ต</button>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 flex flex-col" style={{ height: 320 }}>
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-xs font-semibold text-slate-600">Chat กับ Open Notebook</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {onMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {onSending && <div className="flex justify-start"><div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" /><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" /><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" /></div></div>}
                        <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={e => { e.preventDefault(); handleOnSend() }} className="flex gap-2 p-2 border-t border-slate-100">
                        <input type="text" value={onInput} onChange={e => setOnInput(e.target.value)} placeholder="ถามเกี่ยวกับกฎหมายนี้..." className="input-field py-2 text-sm flex-1" disabled={onSending} />
                        <button type="submit" disabled={onSending || !onInput.trim()} className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl">
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                    <button onClick={handleOnInsights} disabled={onInsightLoading} className="flex items-center gap-1.5 text-xs text-violet-600 hover:underline">
                      <Lightbulb className="w-3.5 h-3.5" />
                      {onInsightLoading ? 'กำลังโหลด Insights...' : 'ดึง AI Insights จากเอกสาร'}
                    </button>
                    {onInsights.map((ins, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-slate-700">
                        {ins.content || ins.text || JSON.stringify(ins)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Reference sidebar ──────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-20">
          {/* Review frequency guide */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-xl">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-300" /> รอบการทบทวนแนะนำ
            </h3>
            {[
              { type: 'พระราชบัญญัติ', period: 'ทุก 12 เดือน', color: 'indigo' },
              { type: 'พระราชกฤษฎีกา', period: 'ทุก 6 เดือน', color: 'violet' },
              { type: 'กฎกระทรวง', period: 'ทุก 6 เดือน', color: 'blue' },
              { type: 'ประกาศกระทรวง', period: 'ทุก 3 เดือน', color: 'cyan' },
              { type: 'ประกาศกรม', period: 'ทุก 3 เดือน', color: 'teal' },
            ].map(row => (
              <div key={row.type} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 text-xs">
                <span className="text-slate-300">{row.type}</span>
                <span className="bg-white/10 border border-white/10 text-white px-2 py-0.5 rounded-full font-semibold">{row.period}</span>
              </div>
            ))}
          </div>

          {/* Category grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-bold text-slate-800 text-sm mb-3">8 หมวดหมู่ความปลอดภัย EHS</h4>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              {[
                { cat: 'ความปลอดภัยทั่วไป', color: '#3B82F6' },
                { cat: 'เครื่องจักร / อุปกรณ์', color: '#F59E0B' },
                { cat: 'ไฟฟ้าและอัคคีภัย', color: '#EF4444' },
                { cat: 'สารเคมีอันตราย', color: '#8B5CF6' },
                { cat: 'สิ่งแวดล้อม', color: '#10B981' },
                { cat: 'ที่สูง / อับอากาศ', color: '#F97316' },
                { cat: 'การก่อสร้าง', color: '#6B7280' },
                { cat: 'สวัสดิการแรงงาน', color: '#EC4899' },
              ].map(({ cat, color }) => (
                <div key={cat} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 font-medium text-slate-600">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-2">
            <p className="font-bold flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5" /> เคล็ดลับ</p>
            <p>ใส่ Gemini API Key เพื่อรับการวิเคราะห์เชิงลึกจากโมเดล AI จริง ไม่มี Key ระบบยังทำงานได้ด้วย Local Rules Engine</p>
            <p>ใช้ <strong>Open Notebook</strong> สำหรับการถามตอบเชิงลึกและเปรียบเทียบกฎหมายหลายฉบับพร้อมกัน</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
