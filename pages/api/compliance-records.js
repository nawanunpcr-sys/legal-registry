import { getSupabaseServerClient } from '../../lib/supabaseServer'
import { mapCategory, mapLaw } from '../../lib/lawMappers'
import { isCompliantStatus } from '../../lib/statusUtils'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = getSupabaseServerClient()
    const [lawsResult, categoriesResult] = await Promise.all([
      supabase.from('laws').select('*').order('id', { ascending: true }),
      supabase.from('law_categories').select('*').order('id', { ascending: true }),
    ])

    const error = lawsResult.error || categoriesResult.error
    if (error) {
      console.error('Compliance records fetch error:', error)
      return res.status(500).json({ error: error.message })
    }

    const categories = (categoriesResult.data || []).map(mapCategory)
    const categoryMap = new Map(categories.map(category => [category.id, category]))
    const records = (lawsResult.data || []).map((law) => {
      const mappedLaw = mapLaw(law, categoryMap)

      return {
        id: mappedLaw.id,
        compliance_status: mappedLaw.compliance_status,
        compliance_score: isCompliantStatus(mappedLaw.compliance_status) ? 100 : 0,
        department_id: null,
        laws: {
          title: mappedLaw.title,
          law_code: mappedLaw.law_code,
        },
        departments: {
          name: mappedLaw.responsible_unit || mappedLaw.responsible_person || '-',
        },
        tasks: null,
      }
    })

    return res.status(200).json({ data: records })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
