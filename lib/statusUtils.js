const COMPLIANT_STATUSES = new Set(['c', 'compliant', 'complete', 'completed'])
const NON_COMPLIANT_STATUSES = new Set(['nc', 'non_compliant', 'non-compliant'])

export function normalizeComplianceStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (COMPLIANT_STATUSES.has(normalized)) return 'compliant'
  if (NON_COMPLIANT_STATUSES.has(normalized)) return 'non_compliant'
  if (normalized === 'partial') return 'partial'
  if (normalized === 'pending') return 'pending'

  return normalized || 'not_evaluated'
}

export function isCompliantStatus(status) {
  return normalizeComplianceStatus(status) === 'compliant'
}

export function isNonCompliantStatus(status) {
  return normalizeComplianceStatus(status) === 'non_compliant'
}

export function toLawDbComplianceStatus(status) {
  const normalized = normalizeComplianceStatus(status)

  if (normalized === 'compliant') return 'C'
  if (normalized === 'non_compliant') return 'NC'

  return normalized
}
