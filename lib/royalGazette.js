// Royal Gazette API Integration
// Fetches latest laws from:
// 1. Royal Gazette website (ratchakitcha.soc.go.th)
// 2. Thai OSH Department (osh.labour.go.th)
// 3. Labor Department updates

import { 
  fetchLatestOSHLaws, 
  fetchLatestRoyalGazetteLaws,
  searchRoyalGazette as searchRGWebsite
} from './webScraper'

/**
 * Fetch latest laws from Royal Gazette and OSH sources combined
 */
export async function fetchLatestLaws(options = {}) {
  try {
    const { limit = 15, source = 'all' } = options
    
    let allLaws = []

    // Fetch from both sources based on option
    if (source === 'all' || source === 'royal-gazette') {
      try {
        const rgLaws = await fetchLatestRoyalGazetteLaws()
        allLaws = [...allLaws, ...rgLaws]
      } catch (err) {
        console.warn('Error fetching from Royal Gazette:', err)
      }
    }

    if (source === 'all' || source === 'osh') {
      try {
        const oshLaws = await fetchLatestOSHLaws()
        allLaws = [...allLaws, ...oshLaws]
      } catch (err) {
        console.warn('Error fetching from OSH:', err)
      }
    }

    // Remove duplicates and sort by date
    const uniqueLaws = Array.from(
      new Map(allLaws.map(law => [law.title, law])).values()
    ).sort((a, b) => {
      const dateA = new Date(a.publishedDate || 0)
      const dateB = new Date(b.publishedDate || 0)
      return dateB - dateA
    })

    return {
      success: true,
      data: uniqueLaws.slice(0, limit),
      count: uniqueLaws.length,
      lastUpdated: new Date(),
      sources: ['ราชกิจจานุเบกษา', 'กระทรวงแรงงาน']
    }
  } catch (error) {
    console.error('Error fetching laws:', error)
    return {
      success: false,
      error: error.message,
      data: [],
      sources: ['Error']
    }
  }
}

/**
 * Search laws in Royal Gazette
 */
export async function searchRoyalGazette(keywords, options = {}) {
  try {
    const { limit = 20 } = options
    
    // Try web search first
    if (Array.isArray(keywords) && keywords.length > 0) {
      const searchResults = await searchRGWebsite(keywords[0])
      if (searchResults.length > 0) {
        return {
          success: true,
          data: searchResults.slice(0, limit),
          count: searchResults.length,
          source: 'web-search'
        }
      }
    }

    // Fallback to filtering existing laws
    const res = await fetchLatestLaws({ limit: 50 })
    if (!res.success) return res

    const filtered = res.data.filter(law => {
      return keywords.some(kw =>
        law.title.toLowerCase().includes(kw.toLowerCase()) ||
        law.summary?.toLowerCase().includes(kw.toLowerCase()) ||
        law.safetyCategory?.toLowerCase().includes(kw.toLowerCase())
      )
    })

    return {
      success: true,
      data: filtered.slice(0, limit),
      count: filtered.length,
      source: 'local-filter'
    }
  } catch (error) {
    console.error('Error searching laws:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Get law details from Royal Gazette
 */
export async function getLawDetailsFromRoyalGazette(lawId) {
  try {
    const res = await fetchLatestLaws({ limit: 100 })
    const law = res.data.find(l => l.id === lawId)
    if (!law) throw new Error('ไม่พบกฎหมายที่ระบุ')

    return {
      success: true,
      data: {
        ...law,
        fullText: `${law.title}\n\nบทสรุปย่อ:\n${law.summary || 'ไม่มีข้อมูล'}\n\nแหล่งที่มา: ${law.source || law.originalSource || 'ราชกิจจานุเบกษา'}\nลิงก์ทางการ: ${law.link || 'ไม่มี'}\nประเภทกฎหมาย: ${law.lawType || 'อื่นๆ'}\nหมวดหมู่: ${law.safetyCategory || 'ไม่ระบุ'}\nสถานะ: ${law.status || law.effectiveDate ? 'มีผลบังคับใช้' : 'ร่าง'}`
      }
    }
  } catch (error) {
    console.error('Error getting law details:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Fetch laws specifically from OSH Website
 */
export async function fetchOSHLaws(options = {}) {
  try {
    const { limit = 10 } = options
    const oshLaws = await fetchLatestOSHLaws()
    
    return {
      success: true,
      data: oshLaws.slice(0, limit),
      count: oshLaws.length,
      source: 'osh.labour.go.th',
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error fetching OSH laws:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Link law with related documents
 */
export async function linkLawWithDocuments(lawTitle) {
  try {
    const searchResults = await searchRoyalGazette([lawTitle])
    
    if (searchResults.success && searchResults.data.length > 0) {
      const law = searchResults.data[0]
      return {
        success: true,
        data: {
          mainLaw: law,
          relatedLaws: searchResults.data.slice(1, 5),
          linkedDocuments: law.link ? [law.link] : []
        }
      }
    }

    return {
      success: false,
      error: 'ไม่พบกฎหมายที่เกี่ยวข้อง',
      data: null
    }
  } catch (error) {
    console.error('Error linking documents:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

