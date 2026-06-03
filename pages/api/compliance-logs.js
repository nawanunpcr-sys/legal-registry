import { getSupabaseServerClient } from '../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('compliance_logs')
      .select(`*, laws(title, law_code)`)
      .order('assessment_date', { ascending: false })

    if (error) {
      console.error('Compliance logs fetch error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
