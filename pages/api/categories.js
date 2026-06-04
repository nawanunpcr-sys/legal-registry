import { getSupabaseServerClient } from '../../lib/supabaseServer'
import { mapCategory } from '../../lib/lawMappers'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('law_categories')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Categories fetch error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data: (data || []).map(mapCategory) })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
