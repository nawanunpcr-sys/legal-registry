import { getSupabaseServerClient } from '../../lib/supabaseServer'
import { mapCategory, mapLaw } from '../../lib/lawMappers'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabaseServerClient()
    const [lawsResult, categoriesResult] = await Promise.all([
      supabase
        .from('laws')
        .select('*')
        .in('compliance_status', ['NC', 'nc', 'non_compliant', 'non-compliant'])
        .eq('is_cancelled', false)
        .order('title', { ascending: true }),
      supabase
        .from('law_categories')
        .select('*')
        .order('id', { ascending: true }),
    ])

    const error = lawsResult.error || categoriesResult.error
    if (error) {
      console.error('Non-compliant laws fetch error:', error)
      return res.status(500).json({ error: error.message })
    }

    const categories = (categoriesResult.data || []).map(mapCategory)
    const categoryMap = new Map(categories.map(category => [category.id, category]))
    const data = (lawsResult.data || []).map(law => mapLaw(law, categoryMap))

    return res.status(200).json({ data })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
