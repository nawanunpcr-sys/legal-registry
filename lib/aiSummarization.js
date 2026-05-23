/**
 * AI-powered law summarization
 * Extracts key points and action items from law texts
 */

export async function summarizeLaw(lawText, lawTitle = '') {
  try {
    const summary = {
      title: lawTitle,
      keyPoints: extractKeyPoints(lawText),
      actionItems: extractActionItems(lawText),
      affectedParties: extractAffectedParties(lawText),
      enforcementDate: extractEnforcementDate(lawText),
      penalties: extractPenalties(lawText),
      effectiveDate: extractEffectiveDate(lawText),
      relatedDocuments: extractRelatedDocuments(lawText),
      summary: generateSummary(lawText),
    }
    return summary
  } catch (error) {
    console.error('Summarization error:', error)
    return null
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
