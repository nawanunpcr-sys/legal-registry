/**
 * AI-powered law summarization
 * Extracts key points and action items from law texts
 */

export async function summarizeLaw(lawText, lawTitle = '') {
  try {
    // Check if there is an API Key provided in browser context
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null

    if (apiKey && apiKey.trim()) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert EHS (Environmental, Health, and Safety) inspector and legal analyst in Thailand. Analyze the following Thai OHS law/regulation text and extract key points. You MUST return ONLY a valid JSON string (no markdown formatting, no backticks, no wrap, just raw JSON) matching this exact format:
{
  "title": "Title of the law in Thai",
  "keyPoints": ["Key point 1 in Thai", "Key point 2 in Thai", "Key point 3 in Thai"],
  "actionItems": ["Required action item 1 for companies in Thai", "Action item 2", "Action item 3"],
  "affectedParties": ["Parties affected by this law, e.g., นายจ้าง, ลูกจ้าง, จป.วิชาชีพ"],
  "enforcementDate": "Enforcement date in Thai or 'มีผลบังคับใช้ทันทีเมื่อพ้นกำหนด 60 วัน'",
  "penalties": ["Penalties, fines or jail terms mentioned in Thai", "Penalty 2"],
  "effectiveDate": "Same as enforcement date or effective date in Thai",
  "relatedDocuments": ["Related laws or documents in Thai"],
  "summary": "Concise summary of the law in Thai",
  "lawType": "พระราชบัญญัติ or พระราชกฤษฎีกา or กฎกระทรวง or ประกาศกระทรวง or ประกาศกรม based on the contents",
  "safetyCategory": "One of these exact categories: ความปลอดภัยทั่วไป, เครื่องจักร / อุปกรณ์ / เครื่องมือ, ไฟฟ้าและอัคคีภัย, สารเคมีและวัตถุอันตราย, สิ่งแวดล้อมในการทำงาน, การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย, การก่อสร้าง, สวัสดิการและแรงงาน",
  "reviewFrequency": "ทุก 12 เดือน (if พระราชบัญญัติ) or ทุก 6 เดือน (if พระราชกฤษฎีกา or กฎกระทรวง) or ทุก 3 เดือน (if ประกาศกระทรวง or ประกาศกรม)"
}

Law Title: ${lawTitle}
Law Content: ${lawText}`
              }]
            }]
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawText = data.candidates[0].content.parts[0].text
            const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim()
            const parsedResult = JSON.parse(cleanJson)
            return parsedResult
          }
        }
        console.warn('Gemini API call returned non-200 or unexpected payload, falling back to local EHS rules engine.')
      } catch (err) {
        console.error('Error calling Gemini API:', err)
      }
    }

    // Advanced Local EHS Rules Engine Fallback
    const lawType = classifyLawType(lawText, lawTitle)
    const safetyCategory = classifySafetyCategory(lawText, lawTitle)
    const reviewFrequency = recommendReviewFrequency(lawType)

    return {
      title: lawTitle || 'กฎหมายวิเคราะห์จากระบบ',
      keyPoints: extractKeyPoints(lawText),
      actionItems: extractActionItems(lawText),
      affectedParties: extractAffectedParties(lawText),
      enforcementDate: extractEnforcementDate(lawText) || 'มีผลบังคับใช้ทันทีเมื่อพ้นกำหนดประกาศ',
      penalties: extractPenalties(lawText),
      effectiveDate: extractEffectiveDate(lawText) || 'มีผลบังคับใช้ทันทีเมื่อพ้นกำหนดประกาศ',
      relatedDocuments: extractRelatedDocuments(lawText),
      summary: generateSummary(lawText),
      lawType,
      safetyCategory,
      reviewFrequency
    }
  } catch (error) {
    console.error('Summarization error:', error)
    return null
  }
}

export function classifyLawType(text, title = '') {
  const combined = (title + ' ' + text).toLowerCase()
  if (combined.includes('พระราชบัญญัติ') || combined.includes('พ.ร.บ.') || combined.includes('พรบ.')) return 'พระราชบัญญัติ'
  if (combined.includes('พระราชกฤษฎีกา') || combined.includes('พ.ร.ฎ.') || combined.includes('พรฎ.')) return 'พระราชกฤษฎีกา'
  if (combined.includes('กฎกระทรวง')) return 'กฎกระทรวง'
  if (combined.includes('ประกาศกระทรวง')) return 'ประกาศกระทรวง'
  if (combined.includes('ประกาศกรม')) return 'ประกาศกรม'
  return 'ประกาศกระทรวง' // default fallback
}

export function classifySafetyCategory(text, title = '') {
  const combined = (title + ' ' + text).toLowerCase()
  
  if (combined.includes('เครื่องจักร') || combined.includes('ปั้นจั่น') || combined.includes('หม้อน้ำ') || combined.includes('ลิฟต์') || combined.includes('รถยก') || combined.includes('รอก') || combined.includes('อุปกรณ์') || combined.includes('เครื่องมือ')) {
    return 'เครื่องจักร / อุปกรณ์ / เครื่องมือ'
  }
  if (combined.includes('ไฟฟ้า') || combined.includes('อัคคีภัย') || combined.includes('ไฟไหม้') || combined.includes('ดับเพลิง')) {
    return 'ไฟฟ้าและอัคคีภัย'
  }
  if (combined.includes('สารเคมี') || combined.includes('วัตถุอันตราย') || combined.includes('สารพิษ') || combined.includes('เคมี')) {
    return 'สารเคมีและวัตถุอันตราย'
  }
  if (combined.includes('อับอากาศ') || combined.includes('ที่สูง') || combined.includes('ที่อันตราย') || combined.includes('นั่งร้าน') || combined.includes('ตกจากที่สูง')) {
    return 'การทำงานในที่อับอากาศ / ที่สูง / พื้นที่อันตราย'
  }
  if (combined.includes('ก่อสร้าง') || combined.includes('เขตก่อสร้าง') || combined.includes('ขุดดิน') || combined.includes('เจาะดิน')) {
    return 'การก่อสร้าง'
  }
  if (combined.includes('สวัสดิการ') || combined.includes('แรงงาน') || combined.includes('ฝึกอบรม') || combined.includes('เจ้าหน้าที่ความปลอดภัย') || combined.includes('จป.')) {
    return 'สวัสดิการและแรงงาน'
  }
  if (combined.includes('สิ่งแวดล้อม') || combined.includes('มลพิษ') || combined.includes('ขยะ') || combined.includes('น้ำเสีย') || combined.includes('อากาศเสีย')) {
    return 'สิ่งแวดล้อมในการทำงาน'
  }
  return 'ความปลอดภัยทั่วไป'
}

export function recommendReviewFrequency(lawType) {
  switch (lawType) {
    case 'พระราชบัญญัติ':
      return 'ทุก 12 เดือน'
    case 'พระราชกฤษฎีกา':
    case 'กฎกระทรวง':
      return 'ทุก 6 เดือน'
    case 'ประกาศกระทรวง':
    case 'ประกาศกรม':
    default:
      return 'ทุก 3 เดือน'
  }
}


function extractKeyPoints(text) {
  // Simpl key point extraction
  const keywordPatterns = [
    /ต้อง|must|shall|should/gi,
    /บังคับ|required|mandatory/gi,
    /สิ่งที่ห้าม|prohibited|forbidden/gi,
    /อัตราค่าปรับ|penalty|fine/gi,
  ]

  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || []
  const keyPoints = []

  sentences.forEach((sentence) => {
    keywordPatterns.forEach((pattern) => {
      if (pattern.test(sentence) && keyPoints.length < 5) {
        const cleaned = sentence.trim().replace(/\s+/g, ' ')
        if (!keyPoints.includes(cleaned) && cleaned.length > 20) {
          keyPoints.push(cleaned)
        }
      }
    })
  })

  return keyPoints.slice(0, 5)
}

function extractActionItems(text) {
  const actions = []
  const actionPhrases = [
    'ต้อง|must|shall',
    'จัดตั้ง|establish|create',
    'รายงาน|report|submit',
    'ยื่นคำขอ|apply|request',
    'เก็บรักษา|maintain|keep',
    'ดำเนินการ|implement|carry out',
  ]

  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || []

  sentences.forEach((sentence) => {
    actionPhrases.forEach((phrase) => {
      if (new RegExp(phrase, 'i').test(sentence)) {
        const cleaned = sentence.trim().replace(/\s+/g, ' ')
        if (
          actions.length < 5 &&
          cleaned.length > 20 &&
          !actions.includes(cleaned)
        ) {
          actions.push(cleaned)
        }
      }
    })
  })

  return actions.slice(0, 5)
}

function extractAffectedParties(text) {
  const parties = []
  const partyKeywords = [
    'หน่วยงาน|agency|organization',
    'บริษัท|company|corporation',
    'ประกอบการ|business|operator',
    'บุคคล|person|individual',
    'ผู้เชี่ยวชาญ|expert|specialist',
  ]

  partyKeywords.forEach((keyword) => {
    if (new RegExp(keyword, 'i').test(text)) {
      const party = keyword.split('|')[0]
      if (!parties.includes(party)) {
        parties.push(party)
      }
    }
  })

  return parties
}

function extractEnforcementDate(text) {
  // Look for date patterns
  const datePatterns = [
    /(\d{1,2})\s*(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(?:\d{4})/gi,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    /วันที่\s*(\d{1,2})\s*(\w+)\s*(\d{4})/gi,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return null
}

function extractEffectiveDate(text) {
  // Similar to enforcement date
  const patterns = [
    /เมื่อ|นับแต่|ตั้งแต่|วันที่\s*(\d{1,2})\s*(\w+)\s*(\d{4})/gi,
  ]

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      return extractEnforcementDate(text)
    }
  }

  return null
}

function extractPenalties(text) {
  const penalties = []
  const penaltyPatterns = [
    /ปรับ\s*([\d,]+)/gi,
    /ค่าปรับ\s*([\d,]+)/gi,
    /อัตราค่าปรับ\s*([\d,]+)/gi,
    /จำคุก\s*(.+?)(?=วัน|เดือน|ปี)/gi,
  ]

  penaltyPatterns.forEach((pattern) => {
    const matches = text.match(pattern)
    if (matches) {
      penalties.push(...matches)
    }
  })

  return [...new Set(penalties)].slice(0, 3)
}

function extractRelatedDocuments(text) {
  const docs = []
  const docKeywords = [
    'พระราชกฤษฎีกา',
    'ประกาศ',
    'ระเบียบ',
    'ข้อบัญญัติ',
    'ส่วนราชการ',
    'กฎ',
  ]

  docKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
      docs.push(keyword)
    }
  })

  return docs
}

function generateSummary(text) {
  // Extract first meaningful paragraph
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 50)

  if (paragraphs.length > 0) {
    return paragraphs[0].slice(0, 200) + '...'
  }

  return text.slice(0, 200) + '...'
}

/**
 * Generate compliance checklist from law
 */
export function generateComplianceChecklist(law) {
  return [
    {
      item: `ศึกษาและทำความเข้าใจ ${law.title}`,
      responsible: law.responsible_person || '-',
      deadline: 'ภายใน 7 วัน',
      status: 'pending',
    },
    {
      item: 'ประเมินความสอดคล้องปัจจุบันกับข้อกำหนด',
      responsible: 'ฝ่ายปฏิบัติการ',
      deadline: 'ภายใน 14 วัน',
      status: 'pending',
    },
    {
      item: 'จัดทำแผนการปรับปรุง (หากจำเป็น)',
      responsible: law.responsible_person || '-',
      deadline: 'ภายใน 30 วัน',
      status: 'pending',
    },
    {
      item: 'ดำเนินการตามแผน',
      responsible: 'ทุกแผนก',
      deadline: law.effective_date || 'ตามกำหนด',
      status: 'pending',
    },
    {
      item: 'ตรวจสอบและรายงานความสอดคล้อง',
      responsible: law.responsible_person || '-',
      deadline: `ทุก${law.review_frequency || 'เดือน'}`,
      status: 'pending',
    },
  ]
}
