export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/law_categories`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json({ error: data })
    }

    return res.status(200).json({ data: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: error.message })
  }
}
