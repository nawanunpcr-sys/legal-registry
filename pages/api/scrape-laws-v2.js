import { fetchLatestOSHLaws, fetchLatestRoyalGazetteLaws } from '../../lib/webScraper'

export default async function handler(req, res) {
  try {
    const { source = 'all', limit = 15 } = req.query

    // Fetch from OSH website
    if (source === 'osh' || source === 'all') {
      try {
        const oshLaws = await fetchLatestOSHLaws()
        
        if (source === 'osh') {
          return res.status(200).json({
            success: true,
            live: true,
            data: oshLaws.slice(0, parseInt(limit) || 15),
            source: 'osh.labour.go.th',
            count: oshLaws.length,
            message: 'นำเข้าข้อมูลความคืบหน้ากฎหมายความปลอดภัยจาก OSH Labour สำเร็จ'
          })
        }

        // For 'all', also fetch from Royal Gazette
        const rgLaws = await fetchLatestRoyalGazetteLaws()
        const combinedLaws = [...oshLaws, ...rgLaws]
        
        // Remove duplicates
        const uniqueLaws = Array.from(
          new Map(combinedLaws.map(law => [law.title, law])).values()
        ).sort((a, b) => {
          const dateA = new Date(a.publishedDate || 0)
          const dateB = new Date(b.publishedDate || 0)
          return dateB - dateA
        })

        return res.status(200).json({
          success: true,
          live: true,
          data: uniqueLaws.slice(0, parseInt(limit) || 15),
          sources: ['osh.labour.go.th', 'ratchakitcha.soc.go.th'],
          count: uniqueLaws.length,
          message: 'นำเข้าข้อมูลกฎหมายจากทุกแหล่งสำเร็จ'
        })
      } catch (e) {
        console.error('Error fetching laws:', e.message)
        return res.status(200).json({
          success: false,
          error: 'ไม่สามารถดึงข้อมูลจากแหล่งที่ระบุได้'
        })
      }
    }

    // Fetch from Royal Gazette
    if (source === 'royal-gazette') {
      try {
        const rgLaws = await fetchLatestRoyalGazetteLaws()
        
        return res.status(200).json({
          success: true,
          live: true,
          data: rgLaws.slice(0, parseInt(limit) || 15),
          source: 'ratchakitcha.soc.go.th',
          count: rgLaws.length,
          message: 'นำเข้าข้อมูลกฎหมายจากราชกิจจานุเบกษา สำเร็จ'
        })
      } catch (e) {
        console.error('Error fetching Royal Gazette laws:', e.message)
        return res.status(200).json({
          success: false,
          error: 'ไม่สามารถดึงข้อมูลจากราชกิจจานุเบกษาได้'
        })
      }
    }

    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุแหล่งข้อมูล: osh, royal-gazette, หรือ all'
    })
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการประมวลผล'
    })
  }
}
