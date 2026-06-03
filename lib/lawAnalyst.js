/**
 * SHE Law Analyst Skill
 * ดึงข้อมูลสำคัญจากข้อความกฎหมายตามรูปแบบที่กำหนด
 * เพื่อนำไปกรอกทะเบียนกฎหมาย (F-259) แบบประเมินความสอดคล้อง เป็นต้น
 */

export const lawAnalystPrompt = `คุณเป็น SHE Law Analyst ที่มีหน้าที่อ่านและสรุปสาระสำคัญของกฎหมายด้านความปลอดภัย อาชีวอนามัย และสภาพแวดล้อมในการทำงาน (SHE)

ตอบเป็นภาษาไทยเสมอ ไม่ใช้ emoji ไม่ใช้ภาษาตลาด เขียนให้กระชับและตรงประเด็นเหมือนเอกสารราชการ

เมื่อได้รับข้อความกฎหมาย ให้ดึงข้อมูลต่อไปนี้ออกมาให้ครบ:

**1. ข้อมูลพื้นฐาน**
- ชื่อกฎหมายฉบับเต็ม
- ประเภท (พ.ร.บ. / กฎกระทรวง / ประกาศกระทรวง / ประกาศกรม / ระเบียบ)
- กระทรวง / กรมที่ออกกฎหมาย
- วันที่ประกาศในราชกิจจานุเบกษา
- วันที่บังคับใช้ (อาจต่างจากวันประกาศ)
- สถานะ: มีผลบังคับใช้ / ยกเลิก / แก้ไขเพิ่มเติมฉบับใด

**2. สรุปสาระสำคัญ** (2-5 ประโยค)
อธิบายว่ากฎหมายฉบับนี้บังคับให้ทำอะไร ครอบคลุมใครบ้าง วัตถุประสงค์

**3. ข้อกำหนดที่นายจ้าง/บริษัทต้องปฏิบัติ**
แยกเป็นรายข้อ ระบุให้ชัดว่า:
- ต้องทำอะไร
- กรอบเวลา (ถ้ามี)
- เงื่อนไข (ถ้ามี)

**4. ผู้รับผิดชอบ**
ระบุว่าใครต้องเป็นผู้ดำเนินการ

**5. เอกสาร/แบบฟอร์มที่เกี่ยวข้อง**
ระบุชื่อแบบฟอร์ม รหัสเอกสาร และหน่วยงานที่ต้องจัดส่ง

**6. ความถี่การตรวจสอบ**
ระบุว่าต้องติดตามหรือตรวจสอบบ่อยแค่ไหน

รูปแบบผลลัพธ์:
\`\`\`
ชื่อกฎหมาย: [ชื่อเต็ม]
ประเภท: [ประเภท]
กระทรวง/กรม: [ชื่อหน่วยงาน]
วันที่ประกาศ: [วัน เดือน ปี]
วันที่บังคับใช้: [วัน เดือน ปี]
สถานะ: [สถานะ]

สรุปสาระสำคัญ:
[2-5 ประโยค]

ข้อกำหนดที่ต้องปฏิบัติ:
1. [ข้อกำหนด — กรอบเวลา — เงื่อนไข]
2. ...

ผู้รับผิดชอบ:
[ตำแหน่ง/หน่วยงาน]

เอกสาร/แบบฟอร์มที่เกี่ยวข้อง:
[ชื่อแบบฟอร์ม — ส่งที่ไหน]

ความถี่การตรวจสอบ:
[รอบการติดตาม]

หมายเหตุ:
[สิ่งที่ควรระวัง]
\`\`\`

กรณีที่กฎหมายมีหลายมาตรา ให้แยกสรุปตามมาตรา แต่รวมข้อมูลพื้นฐาน

ถ้าข้อมูลใดไม่ปรากฏในข้อความที่ให้มา ให้ระบุว่า "ไม่ระบุในข้อความที่ให้มา"`

/**
 * สร้าง prompt สำหรับ Claude ในการวิเคราะห์กฎหมาย
 */
export function createLawAnalysisPrompt(lawText) {
  return `${lawAnalystPrompt}

ข้อความกฎหมาย:
"""
${lawText}
"""

โปรดวิเคราะห์และส่งคืนผลลัพธ์ตามรูปแบบที่กำหนด`
}

/**
 * Parse ผลลัพธ์จาก Claude API
 */
export function parseLawAnalysisResult(content) {
  const result = {
    title: '',
    type: '',
    ministry: '',
    announcedDate: '',
    effectiveDate: '',
    status: '',
    summary: '',
    requirements: [],
    responsible: '',
    documents: '',
    checkFrequency: '',
    remarks: ''
  }

  const lines = content.split('\n')
  let currentSection = null
  let requirementsList = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('ชื่อกฎหมาย:')) {
      result.title = trimmed.replace('ชื่อกฎหมาย:', '').trim()
    } else if (trimmed.startsWith('ประเภท:')) {
      result.type = trimmed.replace('ประเภท:', '').trim()
    } else if (trimmed.startsWith('กระทรวง/กรม:')) {
      result.ministry = trimmed.replace('กระทรวง/กรม:', '').trim()
    } else if (trimmed.startsWith('วันที่ประกาศ:')) {
      result.announcedDate = trimmed.replace('วันที่ประกาศ:', '').trim()
    } else if (trimmed.startsWith('วันที่บังคับใช้:')) {
      result.effectiveDate = trimmed.replace('วันที่บังคับใช้:', '').trim()
    } else if (trimmed.startsWith('สถานะ:')) {
      result.status = trimmed.replace('สถานะ:', '').trim()
    } else if (trimmed.startsWith('สรุปสาระสำคัญ:')) {
      currentSection = 'summary'
    } else if (trimmed.startsWith('ข้อกำหนดที่ต้องปฏิบัติ:')) {
      currentSection = 'requirements'
    } else if (trimmed.startsWith('ผู้รับผิดชอบ:')) {
      currentSection = 'responsible'
      result.responsible = ''
    } else if (trimmed.startsWith('เอกสาร/แบบฟอร์มที่เกี่ยวข้อง:')) {
      currentSection = 'documents'
      result.documents = ''
    } else if (trimmed.startsWith('ความถี่การตรวจสอบ:')) {
      currentSection = 'frequency'
      result.checkFrequency = ''
    } else if (trimmed.startsWith('หมายเหตุ:')) {
      currentSection = 'remarks'
      result.remarks = ''
    } else if (trimmed && !trimmed.includes(':')) {
      // Add to current section
      if (currentSection === 'summary') {
        result.summary += (result.summary ? ' ' : '') + trimmed
      } else if (currentSection === 'requirements' && trimmed.match(/^\d+\./)) {
        requirementsList.push(trimmed)
      } else if (currentSection === 'responsible') {
        result.responsible += (result.responsible ? ' ' : '') + trimmed
      } else if (currentSection === 'documents') {
        result.documents += (result.documents ? ' ' : '') + trimmed
      } else if (currentSection === 'frequency') {
        result.checkFrequency += (result.checkFrequency ? ' ' : '') + trimmed
      } else if (currentSection === 'remarks') {
        result.remarks += (result.remarks ? ' ' : '') + trimmed
      }
    }
  }

  result.requirements = requirementsList

  return result
}

/**
 * ส่งข้อความกฎหมายไปยัง Claude API เพื่อวิเคราะห์
 */
export async function analyzeLaw(lawText) {
  try {
    const prompt = createLawAnalysisPrompt(lawText)

    const response = await fetch('/api/analyze-law', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    })

    if (!response.ok) {
      throw new Error('ไม่สามารถวิเคราะห์กฎหมาย')
    }

    const data = await response.json()
    return parseLawAnalysisResult(data.analysis)
  } catch (error) {
    console.error('Error analyzing law:', error)
    throw error
  }
}
