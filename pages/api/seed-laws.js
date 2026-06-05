import { getSupabaseServerClient } from '../../lib/supabaseServer'
import { ALL_LAWS, HIERARCHY_ORDER } from '../../lib/royalGazette'
import { classifySafetyCategory } from '../../lib/aiSummarization'

const CATEGORY_COLOR_MAP = {
  'ความปลอดภัยทั่วไป': '#3B82F6',
  'เครื่องจักร / อุปกรณ์ / เครื่องมือ': '#F59E0B',
  'ไฟฟ้าและอัคคีภัย': '#EF4444',
  'สารเคมีและวัตถุอันตราย': '#8B5CF6',
  'สิ่งแวดล้อมในการทำงาน': '#10B981',
  'การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย': '#F97316',
  'การก่อสร้าง': '#6B7280',
  'สวัสดิการและแรงงาน': '#EC4899',
}

function normalizeLawType(lawType) {
  if (lawType === 'พระราชบัญญัติ') return 'law'
  if (lawType === 'พระราชกฤษฎีกา') return 'royal_decree'
  if (lawType === 'กฎกระทรวง') return 'ministerial_regulation'
  if (lawType === 'ประกาศกระทรวง') return 'ministerial_announcement'
  if (lawType === 'ประกาศกรม') return 'departmental_announcement'
  if (lawType === 'ระเบียบ') return 'regulation'
  if (lawType === 'คำสั่ง') return 'order'
  return 'announcement'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = getSupabaseServerClient()

  try {
    // 1. Ensure all safety categories exist as law_categories
    const uniqueCategories = [...new Set(ALL_LAWS.map(l => l.safetyCategory))]
    const categoryMap = {}

    for (const catName of uniqueCategories) {
      const { data: existing } = await supabase
        .from('law_categories')
        .select('id')
        .eq('name', catName)
        .limit(1)

      if (existing && existing.length > 0) {
        categoryMap[catName] = existing[0].id
      } else {
        const { data: inserted, error } = await supabase
          .from('law_categories')
          .insert({ name: catName, color: CATEGORY_COLOR_MAP[catName] || '#64748B' })
          .select('id')
          .single()
        if (error) throw error
        categoryMap[catName] = inserted.id
      }
    }

    // 2. Upsert each law (match on title to avoid duplicates)
    let inserted = 0
    let skipped = 0

    for (const law of ALL_LAWS) {
      const { data: existing } = await supabase
        .from('laws')
        .select('id')
        .eq('title', law.title)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }

      const { error } = await supabase.from('laws').insert({
        law_code: law.id.toUpperCase(),
        title: law.title,
        law_type: normalizeLawType(law.lawType),
        category_id: categoryMap[law.safetyCategory] || null,
        description: law.summary,
        subject: law.safetyCategory,
        effective_date: law.effectiveDate instanceof Date ? law.effectiveDate.toISOString().split('T')[0] : null,
        announced_date: law.publishedDate instanceof Date ? law.publishedDate.toISOString().split('T')[0] : null,
        responsible_person: 'ฝ่าย EHS / จป.วิชาชีพ',
        review_frequency: law.reviewFrequency,
        related_documents: law.link,
        priority: law.lawType === 'พระราชบัญญัติ' ? 'critical' : law.lawType === 'พระราชกฤษฎีกา' ? 'high' : 'normal',
        compliance_status: 'pending',
        issuing_authority: law.source,
        status: 'active',
        is_cancelled: false,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })

      if (error) {
        console.error('Insert error for', law.id, error.message)
      } else {
        inserted++
      }
    }

    return res.status(200).json({
      success: true,
      inserted,
      skipped,
      total: ALL_LAWS.length,
      message: `เพิ่มกฎหมายใหม่ ${inserted} รายการ, ข้าม ${skipped} รายการที่มีอยู่แล้ว`,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return res.status(500).json({ error: error.message })
  }
}
