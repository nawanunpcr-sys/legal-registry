import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)

// ดึงข้อมูลกฎหมายทั้งหมด
export async function getLaws(search = '') {
  let query = supabase
    .from('laws')
    .select(`*, law_categories(name, color), 
             law_department_mapping(*, departments(name, code))`)
    .order('created_at', { ascending: false })
  if (search) query = query.ilike('title', `%${search}%`)
  const { data, error } = await query
  return { data: data || [], error }
}

// ดึงข้อมูล Dashboard
export async function getDashboardData() {
  const [laws, tasks, compliance, departments] = await Promise.all([
    supabase.from('laws').select('id, status, priority'),
    supabase.from('tasks').select('id, status, department_id, jorpor_approved'),
    supabase.from('compliance_records')
      .select('id, compliance_status, compliance_score, department_id'),
    supabase.from('departments').select('*'),
  ])
  return {
    laws: laws.data || [],
    tasks: tasks.data || [],
    compliance: compliance.data || [],
    departments: departments.data || [],
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
  const { data, error } = await supabase
    .from('law_categories')
    .select('*')
    .order('name')
  return { data: data || [], error }
}