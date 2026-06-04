import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchApi(path) {
  const response = await fetch(path)
  const result = await response.json()

  if (!response.ok) {
    const message =
      typeof result.error === 'string'
        ? result.error
        : JSON.stringify(result.error || result)
    throw new Error(message || `Request failed: ${response.status}`)
  }

  return result
}

// ดึงข้อมูลกฎหมายทั้งหมด
export async function getLaws(search = '') {
  try {
    const result = await fetchApi('/api/laws')
    let laws = result.data || []
    
    if (search) {
      laws = laws.filter(law =>
        law.title?.toLowerCase().includes(search.toLowerCase()) ||
        law.law_code?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return { data: laws, error: null }
  } catch (error) {
    console.error('Error fetching laws:', error)
    return { data: [], error: error.message }
  }
}

// ดึงข้อมูลกฎหมายตามรหัส
export async function getLawById(id) {
  try {
    const result = await fetchApi(`/api/laws/${encodeURIComponent(id)}`)
    return {
      data: result.data || null,
      tasks: result.tasks || [],
      error: null,
    }
  } catch (error) {
    console.error('Error fetching law detail:', error)
    return { data: null, tasks: [], error: error.message }
  }
}

// อัปเดตข้อมูลกฎหมาย
export async function updateLawById(id, updates) {
  try {
    const response = await fetch(`/api/laws/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const result = await response.json()

    if (!response.ok) {
      const message =
        typeof result.error === 'string'
          ? result.error
          : JSON.stringify(result.error || result)
      throw new Error(message || `Request failed: ${response.status}`)
    }

    return { data: result.data || null, error: null }
  } catch (error) {
    console.error('Error updating law:', error)
    return { data: null, error: error.message }
  }
}

// ดึงข้อมูล Dashboard
export async function getDashboardData() {
  try {
    const result = await fetchApi('/api/dashboard')
    return {
      laws: result.data?.laws || [],
      tasks: result.data?.tasks || [],
      compliance: result.data?.compliance || [],
      departments: result.data?.departments || [],
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return {
      laws: [],
      tasks: [],
      compliance: [],
      departments: [],
      error: error.message,
    }
  }
}

// ดึง Tasks
export async function getTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select(`*, laws(title, law_code), departments(name, code)`)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

// ดึง AI Analyses
export async function getAnalyses() {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select(`*, laws(title, law_code)`)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

// ดึง Compliance Records
export async function getCompliance() {
  const { data, error } = await supabase
    .from('compliance_records')
    .select(`*, tasks(title), laws(title, law_code), departments(name, code)`)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}

// ดึงรายชื่อแผนก
export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')
  return { data: data || [], error }
}

// ดึงหมวดหมู่กฎหมาย
export async function getCategories() {
  try {
    const result = await fetchApi('/api/categories')
    return { data: result.data || [], error: null }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { data: [], error: error.message }
  }
}

// ดึงกฎหมายที่ยกเลิก
export async function getRepealedLaws() {
  try {
    const result = await fetchApi('/api/repealed-laws')
    return { data: result.data || [], error: null }
  } catch (error) {
    console.error('Error fetching repealed laws:', error)
    return { data: [], error: error.message }
  }
}

// ดึงกฎหมายที่ไม่สอดคล้อง (NC)
export async function getNonCompliantLaws() {
  try {
    const result = await fetchApi('/api/non-compliant-laws')
    return { data: result.data || [], error: null }
  } catch (error) {
    console.error('Error fetching non-compliant laws:', error)
    return { data: [], error: error.message }
  }
}

// ดึง Management Review
export async function getManagementReviews() {
  try {
    const result = await fetchApi('/api/compliance-logs')
    return { data: result.data || [], error: null }
  } catch (error) {
    console.error('Error fetching management reviews:', error)
    return { data: [], error: error.message }
  }
}

// ดึง Corrective Actions (ข้อมูลจาก compliance_logs)
export async function getCorrectiveActions(lawId) {
  const { data, error } = await supabase
    .from('compliance_logs')
    .select('*')
    .eq('law_id', lawId)
    .order('created_at', { ascending: false })
  return { data: data || [], error }
}
