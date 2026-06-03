import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { MessageSquare, Filter, Search, Plus, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CommunicationMatrix() {
  const [communications, setCommunications] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDirection, setSelectedDirection] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterData()
  }, [communications, searchTerm, selectedDirection])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('communication_matrix')
        .select('*')
        .order('seq_no')

      if (error) throw error
      setCommunications(data || [])
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let result = communications.filter(item =>
      item.info_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.communicator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.method?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (selectedDirection !== 'all') {
      result = result.filter(item => item.direction === selectedDirection)
    }

    setFilteredData(result)
  }

  const getDirectionLabel = (direction) => {
    return direction === 'internal' ? 'ภายใน' : 'ภายนอก'
  }

  const getDirectionColor = (direction) => {
    return direction === 'internal'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800'
  }

  const exportToExcel = () => {
    const headers = ['ลำดับที่', 'ประเภทข้อมูล', 'ผู้สื่อสาร', 'ผู้รับสาร', 'ความถี่', 'วิธีการสื่อสาร', 'ทิศทาง']
    const rows = filteredData.map(item => [
      item.seq_no,
      item.info_type,
      item.communicator,
      item.recipient,
      item.frequency,
      item.method,
      getDirectionLabel(item.direction)
    ])

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
    csvContent += headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csvContent))
    link.setAttribute('download', 'communication-matrix.csv')
    link.click()
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

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ตารางการสื่อสาร (ISD-86)</h1>
              <p className="text-slate-600">จัดการการสื่อสารภายในและภายนอกหน่วยงาน</p>
            </div>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium transition"
          >
            <Download className="w-5 h-5" />
            ส่งออก Excel
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาข้อมูล..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all">ทั้งหมด</option>
            <option value="internal">ภายใน</option>
            <option value="external">ภายนอก</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-600 font-medium mb-1">รวมการสื่อสาร</p>
          <p className="text-2xl font-bold text-blue-900">{filteredData.length}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg">
          <p className="text-sm text-cyan-600 font-medium mb-1">ภายใน</p>
          <p className="text-2xl font-bold text-cyan-900">
            {filteredData.filter(item => item.direction === 'internal').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-600 font-medium mb-1">ภายนอก</p>
          <p className="text-2xl font-bold text-green-900">
            {filteredData.filter(item => item.direction === 'external').length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ไม่มีข้อมูลการสื่อสาร</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ลำดับที่</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ประเภทข้อมูล</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ผู้สื่อสาร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ผู้รับสาร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ความถี่</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">วิธีการสื่อสาร</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ทิศทาง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-sm text-slate-600">{item.seq_no}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{item.info_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.communicator}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.recipient}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.frequency}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.method}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getDirectionColor(item.direction)}`}>
                        {getDirectionLabel(item.direction)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
