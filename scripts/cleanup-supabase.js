const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .filter(Boolean)
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=')
    acc[key] = rest.join('=')
    return acc
  }, {})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function cleanup() {
  const ops = [
    await supabase.from('ai_analyses').delete().eq('summary', 'การวิเคราะห์เบื้องต้นระบุว่ามาตรการควบคุมมลพิษยังต้องติดตามอย่างต่อเนื่อง'),
    await supabase.from('compliance_records').delete().eq('law_id', 1),
    await supabase.from('tasks').delete().eq('task_code', 'TASK-001'),
    await supabase.from('law_department_mapping').delete().eq('law_id', 1),
    await supabase.from('laws').delete().eq('law_code', 'ENV-001'),
    await supabase.from('departments').delete().in('code', ['ENV', 'ADM']),
    await supabase.from('law_categories').delete().in('name', ['กฎหมายสิ่งแวดล้อม', 'กฎหมายแรงงาน']),
  ]
  for (const res of ops) {
    if (res.error) console.error('cleanup error', res.error.message)
  }
  console.log('Cleanup done')
}
cleanup()
