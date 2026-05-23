import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Zap, ExternalLink, Calendar, MapPin, BookOpen, AlertCircle } from 'lucide-react'
import { fetchLatestLaws } from '../lib/royalGazette'
import toast from 'react-hot-toast'

export default function NewLaws() {
  const [laws, setLaws] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadLaws()
  }, [])

  const loadLaws = async () => {
    setLoading(true)
    try {
      const result = await fetchLatestLaws({ limit: 20 })
      if (result.success) {
        setLaws(result.data)
      } else {
        toast.error('ไม่สามารถโหลดข้อมูลกฎหมายจากราชกิจจานุเบกษา')
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const categories = [...new Set(laws.map(l => l.category))]
  const filteredLaws = filter === 'all' ? laws : laws.filter(l => l.category === filter)

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">กฎหมายที่เพิ่งเผยแพร่</h1>
              <p className="text-slate-600">ข้อมูลจากราชกิจจานุเบกษา</p>
            </div>
          </div>
          <button
            onClick={loadLaws}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full transition font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({laws.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full transition font-medium ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat} ({laws.filter(l => l.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Laws List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : filteredLaws.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">ไม่พบข้อมูลกฎหมาย</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLaws.map((law) => (
            <div
              key={law.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                      {law.category}
                    </span>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      {law.source}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{law.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{law.summary}</p>
                </div>
                <a
                  href={law.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium ml-4 flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  ดูเพิ่มเติม
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    เผยแพร่: {new Date(law.publishedDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span>
                    บังคับใช้: {new Date(law.effectiveDate).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="text-right">
                  <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    + เพิ่มไปยังระบบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
