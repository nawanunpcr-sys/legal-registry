import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Zap, ExternalLink, Calendar, BookOpen, AlertCircle, Search, Filter, Brain, ArrowRight } from 'lucide-react'
import { fetchLatestLaws } from '../lib/royalGazette'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewLaws() {
  const [laws, setLaws] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLawType, setSelectedLawType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadLaws()
  }, [])

  const loadLaws = async () => {
    setLoading(true)
    try {
      const result = await fetchLatestLaws()
      if (result.success) {
        setLaws(result.data)
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลกฎหมายจากราชกิจจานุเบกษา')
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  // Get unique lists for filtering options
  const lawTypes = ['all', 'พระราชบัญญัติ', 'พระราชกฤษฎีกา', 'กฎกระทรวง', 'ประกาศกระทรวง', 'ประกาศกรม']
  const categories = [
    'all',
    'ความปลอดภัยทั่วไป',
    'เครื่องจักร / อุปกรณ์ / เครื่องมือ',
    'ไฟฟ้าและอัคคีภัย',
    'สารเคมีและวัตถุอันตราย',
    'สิ่งแวดล้อมในการทำงาน',
    'การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย',
    'การก่อสร้าง',
    'สวัสดิการและแรงงาน'
  ]

  // Filter logic
  const filteredLaws = laws.filter(law => {
    const matchesSearch = 
      law.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      law.summary.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLawType = selectedLawType === 'all' || law.lawType === selectedLawType
    const matchesCategory = selectedCategory === 'all' || law.safetyCategory === selectedCategory

    return matchesSearch && matchesLawType && matchesCategory
  })

  // Badge CSS helpers
  const getLawTypeClass = (type) => {
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
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-[24px] text-white shadow-lg shadow-orange-500/20">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <div className="hero-pill mb-2 border border-orange-250 bg-orange-50/50 text-orange-700">อัปเดตล่าสุดวันนี้</div>
              <h1 className="page-title text-slate-900">ราชกิจจานุเบกษา & กฎหมายใหม่</h1>
              <p className="section-subtitle max-w-2xl mt-1">
                ติดตามประกาศกฎหมายด้าน OHS, ความปลอดภัย และสวัสดิการแรงงานล่าสุด พร้อมส่งวิเคราะห์เพื่อเข้าระบบได้ทันที
              </p>
            </div>
          </div>
          <button
            onClick={loadLaws}
            className="btn-primary bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 shadow-lg shadow-slate-950/10 self-start lg:self-center transition-all duration-300"
          >
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="card mb-8 p-6 bg-white/80 backdrop-blur-md">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="xl:col-span-2 relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกฎหมาย, คีย์เวิร์ด, เนื้อหาย่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-300 focus:border-transparent outline-none transition-all shadow-sm bg-white"
            />
          </div>

          {/* Law Type Filter */}
          <div className="relative">
            <select
              value={selectedLawType}
              onChange={(e) => setSelectedLawType(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-300 bg-white transition-all shadow-sm text-sm text-slate-700 appearance-none font-medium outline-none"
            >
              <option value="all">ทุกประเภทกฎหมาย</option>
              {lawTypes.filter(t => t !== 'all').map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Filter className="absolute right-4 top-3.5 w-4 h-4 text-slate-450 pointer-events-none" />
          </div>

          {/* Safety Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-300 bg-white transition-all shadow-sm text-sm text-slate-700 appearance-none font-medium outline-none"
            >
              <option value="all">ทุกหมวดหมู่ความปลอดภัย</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute right-4 top-3.5 w-4 h-4 text-slate-450 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Laws List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">กำลังสืบค้นและจัดหมวดหมู่กฎหมาย...</p>
          </div>
        </div>
      ) : filteredLaws.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/70 shadow-sm">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-355 stroke-1" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">ไม่พบผลการค้นหา</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            ไม่พบกฎหมายที่ตรงกับคำค้นหาหรือตัวกรองที่เลือก ลองเปลี่ยนเงื่อนไขการค้นหาของคุณอีกครั้ง
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLaws.map((law) => (
            <div
              key={law.id}
              className="bg-white rounded-[32px] border border-slate-200/70 hover:border-slate-300 p-6 sm:p-8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all duration-300 relative group overflow-hidden"
            >
              {/* Top Meta info */}
              <div className="flex flex-wrap gap-2.5 mb-4 items-center">
                <span className={`badge text-[11px] py-1.5 px-3.5 rounded-full ${getLawTypeClass(law.lawType)}`}>
                  {law.lawType}
                </span>
                <span className={`badge text-[11px] py-1.5 px-3.5 rounded-full ${getCategoryClass(law.safetyCategory)}`}>
                  {law.safetyCategory}
                </span>
                <span className="text-xs text-slate-450 ml-auto flex items-center gap-1.5 font-semibold bg-slate-50 border border-slate-100 py-1 px-2.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  เผยแพร่เมื่อ: {law.publishedDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {/* Title & Description */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-slate-800 transition mb-3">
                  {law.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-4xl">
                  {law.summary}
                </p>
              </div>

              {/* Bottom Actions Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-slate-100 items-center">
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-xl text-orange-700">
                    <Zap className="w-3.5 h-3.5 text-orange-500" />
                    <span>ผลบังคับใช้: {law.effectiveDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-xl text-blue-700">
                    <span>ความถี่ทบทวน: {law.reviewFrequency}</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <a
                    href={law.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ดูราชกิจจานุเบกษาต้นฉบับ
                  </a>
                  
                  <Link
                    href={`/ai-analysis?title=${encodeURIComponent(law.title)}&text=${encodeURIComponent(law.summary)}&url=${encodeURIComponent(law.link)}`}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition"
                  >
                    <Brain className="w-3.5 h-3.5" />
                    วิเคราะห์และสรุปด้วย AI
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
