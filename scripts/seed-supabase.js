import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findOrInsert(table, match, row) {
  const { data: existing, error: findError } = await supabase
    .from(table)
    .select('id')
    .match(match)
    .limit(1)

  if (findError) {
    console.error(`Error finding in ${table}:`, findError.message)
    process.exit(1)
  }

  if (existing && existing.length > 0) {
    return existing[0]
  }

  const { data, error } = await supabase.from(table).insert(row).select('id').single()
  if (error) {
    console.error(`Error inserting into ${table}:`, error.message)
    process.exit(1)
  }
  return data
}

;(async () => {
  console.log('Seeding Supabase sample data...')

  const category1 = await findOrInsert('law_categories', { name: 'กฎหมายสิ่งแวดล้อม' }, {
    name: 'กฎหมายสิ่งแวดล้อม',
    color: '#0ea5e9',
  })
  const category2 = await findOrInsert('law_categories', { name: 'กฎหมายแรงงาน' }, {
    name: 'กฎหมายแรงงาน',
    color: '#7c3aed',
  })

  const department1 = await findOrInsert('departments', { code: 'ENV' }, {
    name: 'แผนกสิ่งแวดล้อม',
    code: 'ENV',
  })
  const department2 = await findOrInsert('departments', { code: 'ADM' }, {
    name: 'แผนกบริหาร',
    code: 'ADM',
  })

  const law = await findOrInsert('laws', { law_code: 'ENV-001' }, {
    law_code: 'ENV-001',
    title: 'พระราชบัญญัติควบคุมมลพิษทางน้ำ',
    status: 'active',
    priority: 'high',
    category_id: category1.id,
  })

  await findOrInsert('law_department_mapping', { law_id: law.id, department_id: department1.id }, {
    law_id: law.id,
    department_id: department1.id,
  })

  const task = await findOrInsert('tasks', { task_code: 'TASK-001' }, {
    task_code: 'TASK-001',
    title: 'ตรวจสอบการปฏิบัติตามกฎหมาย ENV-001',
    status: 'pending_approval',
    department_id: department1.id,
    jorpor_approved: false,
  })

  await findOrInsert('compliance_records', { task_id: task.id }, {
    compliance_status: 'compliant',
    compliance_score: 92,
    department_id: department1.id,
    task_id: task.id,
    law_id: law.id,
    evaluation_year: 2026,
  })

  await findOrInsert('ai_analyses', { law_id: law.id }, {
    law_id: law.id,
    analysis_source: 'manual',
    raw_analysis: 'บทวิเคราะห์สรุป: ตรวจสอบการปฏิบัติตามกฎหมายสิ่งแวดล้อมและจัดทำแผนป้องกันที่เหมาะสม',
    where_to_do: 'ทุกพื้นที่ปฏิบัติงานที่เกี่ยวข้องกับการจัดการมลพิษ',
    what_to_do: [
      'ตรวจสอบระบบบำบัดน้ำเสีย',
      'จัดทำแผนป้องกันมลพิษ',
      'อบรมพนักงานเกี่ยวกับการจัดการของเสีย'
    ],
    is_approved: true,
    created_by: 'System',
  })

  console.log('Sample data seeded successfully.')
})()
