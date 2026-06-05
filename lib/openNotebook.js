/**
 * Open Notebook API Client
 * Wraps the open-notebook REST API (https://github.com/lfnovo/open-notebook)
 *
 * Default API base: http://localhost:5055
 * Auth: Bearer token via OPEN_NOTEBOOK_PASSWORD env / user setting
 */

const STORAGE_URL_KEY = 'lms_opennotebook_url'
const STORAGE_PASS_KEY = 'lms_opennotebook_password'

export const DEFAULT_URL = 'http://localhost:5055'

export function getOpenNotebookConfig() {
  if (typeof window === 'undefined') return { url: DEFAULT_URL, password: '' }
  return {
    url: localStorage.getItem(STORAGE_URL_KEY) || DEFAULT_URL,
    password: localStorage.getItem(STORAGE_PASS_KEY) || '',
  }
}

export function saveOpenNotebookConfig({ url, password }) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_URL_KEY, url || DEFAULT_URL)
  localStorage.setItem(STORAGE_PASS_KEY, password || '')
}

/**
 * Internal fetch wrapper that adds auth header and base URL
 */
async function onFetch(path, options = {}) {
  const { url, password } = getOpenNotebookConfig()
  const base = url.replace(/\/$/, '')

  const headers = {
    'Content-Type': 'application/json',
    ...(password ? { Authorization: `Bearer ${password}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${base}/api${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.text()
    let msg
    try { msg = JSON.parse(body)?.detail || body } catch { msg = body }
    throw new Error(msg || `HTTP ${res.status}`)
  }

  return res.json()
}

// ─── Health / Auth ────────────────────────────────────────────────────────────

export async function checkConnection() {
  try {
    const data = await onFetch('/config')
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

// ─── Notebooks ────────────────────────────────────────────────────────────────

export async function createNotebook({ name, description = '' }) {
  return onFetch('/notebooks', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function listNotebooks() {
  return onFetch('/notebooks')
}

export async function getNotebook(notebookId) {
  return onFetch(`/notebooks/${notebookId}`)
}

// ─── Sources ──────────────────────────────────────────────────────────────────

/**
 * Add a text source to a notebook
 * @param {string} notebookId
 * @param {string} title
 * @param {string} content   - raw law text
 * @param {boolean} embed    - enable vector embedding (default true)
 */
export async function createTextSource({ notebookId, title, content, embed = true }) {
  return onFetch('/sources', {
    method: 'POST',
    body: JSON.stringify({
      type: 'text',
      notebook_id: notebookId,
      title,
      content,
      embed,
      async_processing: false,
    }),
  })
}

/**
 * Add a URL source to a notebook
 */
export async function createUrlSource({ notebookId, title, url, embed = true }) {
  return onFetch('/sources', {
    method: 'POST',
    body: JSON.stringify({
      type: 'url',
      notebook_id: notebookId,
      title,
      url,
      embed,
      async_processing: false,
    }),
  })
}

export async function getSourceStatus(sourceId) {
  return onFetch(`/sources/${sourceId}/status`)
}

export async function getSourceInsights(sourceId) {
  return onFetch(`/sources/${sourceId}/insights`)
}

/**
 * Request AI to generate insights for a source
 */
export async function generateInsight(sourceId, insightType = 'summary') {
  return onFetch(`/sources/${sourceId}/insights`, {
    method: 'POST',
    body: JSON.stringify({ insight_type: insightType }),
  })
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

/**
 * Create a chat session bound to a notebook
 */
export async function createChatSession(notebookId) {
  return onFetch('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ notebook_id: notebookId }),
  })
}

export async function getChatSession(sessionId) {
  return onFetch(`/chat/sessions/${sessionId}`)
}

/**
 * Send a message and receive a response
 * @returns {Promise<{message: string, sources: Array}>}
 */
export async function sendChatMessage({ sessionId, message }) {
  return onFetch('/chat/execute', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message }),
  })
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function askQuestion({ query, notebookId }) {
  return onFetch('/search/ask/simple', {
    method: 'POST',
    body: JSON.stringify({ query, notebook_id: notebookId }),
  })
}

// ─── High-level helpers ───────────────────────────────────────────────────────

/**
 * Full workflow: create notebook → add source → create chat session
 * Returns { notebookId, sourceId, sessionId }
 */
export async function setupLawNotebook({ title, content, url }) {
  // 1. Create notebook
  const notebook = await createNotebook({
    name: title || 'กฎหมาย (Legal Registry)',
    description: 'สร้างโดยระบบทะเบียนกฎหมาย EHS',
  })
  const notebookId = notebook.id

  // 2. Add source (prefer URL if available, otherwise use text content)
  let source
  if (url) {
    source = await createUrlSource({ notebookId, title, url })
  } else {
    source = await createTextSource({ notebookId, title, content })
  }
  const sourceId = source.id

  // 3. Open chat session
  const session = await createChatSession(notebookId)

  return { notebookId, sourceId, sessionId: session.id }
}
