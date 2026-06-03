import { getSupabaseServerClient } from '../../lib/supabaseServer'
import { mapCategory, mapLaw } from '../../lib/lawMappers'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabaseServerClient()
    const [laws, categoriesResult, complianceLogs] = await Promise.all([
      supabase.from('laws').select('*').order('id', { ascending: true }),
      supabase.from('law_categories').select('*').order('id', { ascending: true }),
      supabase.from('compliance_logs').select('*').order('created_at', { ascending: false }),
    ])

    const error = laws.error || categoriesResult.error || complianceLogs.error
    if (error) {
      console.error('Dashboard fetch error:', error)
      return res.status(500).json({ error: error.message })
    }

    const categories = (categoriesResult.data || []).map(mapCategory)
    const categoryMap = new Map(categories.map(category => [category.id, category]))
    const mappedLaws = (laws.data || []).map(law => mapLaw(law, categoryMap))
    const compliance =
      (complianceLogs.data || []).length > 0
        ? complianceLogs.data || []
        : mappedLaws.map(law => ({
            id: law.id,
            compliance_status: law.compliance_status,
            compliance_score: law.compliance_status === 'C' ? 100 : 0,
            department_id: null,
          }))

    return res.status(200).json({
      data: {
        laws: mappedLaws,
        tasks: [],
        compliance,
        departments: [],
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
