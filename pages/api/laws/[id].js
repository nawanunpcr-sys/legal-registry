import { getSupabaseServerClient } from '../../../lib/supabaseServer'
import { mapCategory, mapLaw } from '../../../lib/lawMappers'
import { toLawDbComplianceStatus } from '../../../lib/statusUtils'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Missing law id' })
  }

  if (req.method === 'GET') {
    return getLaw(req, res, id)
  }

  if (req.method === 'PATCH') {
    return updateLaw(req, res, id)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function getLaw(req, res, id) {
  try {
    const supabase = getSupabaseServerClient()
    const [lawResult, categoriesResult, logsResult] = await Promise.all([
      supabase.from('laws').select('*').eq('id', id).single(),
      supabase.from('law_categories').select('*').order('id', { ascending: true }),
      supabase
        .from('compliance_logs')
        .select('*')
        .eq('law_id', id)
        .order('created_at', { ascending: false }),
    ])

    if (lawResult.error) {
      const status = lawResult.error.code === 'PGRST116' ? 404 : 500
      return res.status(status).json({ error: lawResult.error.message })
    }

    if (categoriesResult.error) {
      console.error('Categories fetch error:', categoriesResult.error)
      return res.status(500).json({ error: categoriesResult.error.message })
    }

    const categories = (categoriesResult.data || []).map(mapCategory)
    const categoryMap = new Map(categories.map(category => [category.id, category]))
    const law = mapLaw(lawResult.data, categoryMap)

    return res.status(200).json({
      data: law,
      tasks: logsResult.error ? [] : logsResult.data || [],
    })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function updateLaw(req, res, id) {
  try {
    const supabase = getSupabaseServerClient()
    const updates = {}

    if (typeof req.body.title === 'string') updates.title = req.body.title
    if (typeof req.body.description === 'string') updates.summary = req.body.description
    if (typeof req.body.compliance_status === 'string') {
      updates.compliance_status = toLawDbComplianceStatus(req.body.compliance_status)
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No supported fields to update' })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('laws')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Law update error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ data: mapLaw(data) })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
