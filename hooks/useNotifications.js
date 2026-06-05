import { useState, useEffect, useCallback } from 'react'
import { fetchLatestLaws } from '../lib/royalGazette'

const STORAGE_KEY = 'lms_notifications'
const SEEN_LAWS_KEY = 'lms_seen_gazette_ids'
const LAST_CHECK_KEY = 'lms_last_gazette_check'
const SETTINGS_KEY = 'lms_notification_settings'

export const DEFAULT_SETTINGS = {
  checkFrequencyDays: 7,       // how often to auto-check gazette
  enableNewLawAlerts: true,
  enableReviewReminders: true,
}

function loadFromStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [checking, setChecking] = useState(false)

  // Load on mount
  useEffect(() => {
    setNotifications(loadFromStorage(STORAGE_KEY, []))
    setSettings({ ...DEFAULT_SETTINGS, ...loadFromStorage(SETTINGS_KEY, {}) })
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      const updated = [
        { id: Date.now(), createdAt: new Date().toISOString(), read: false, ...notification },
        ...prev,
      ].slice(0, 50) // keep latest 50
      saveToStorage(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      saveToStorage(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const markRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n)
      saveToStorage(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    saveToStorage(STORAGE_KEY, [])
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch }
      saveToStorage(SETTINGS_KEY, updated)
      return updated
    })
  }, [])

  // Check gazette for new laws
  const checkGazette = useCallback(async (force = false) => {
    if (!settings.enableNewLawAlerts) return { newCount: 0 }

    const lastCheck = loadFromStorage(LAST_CHECK_KEY, null)
    if (!force && lastCheck) {
      const daysSinceCheck = (Date.now() - new Date(lastCheck).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCheck < settings.checkFrequencyDays) return { newCount: 0, skipped: true }
    }

    setChecking(true)
    try {
      const result = await fetchLatestLaws({ limit: 20 })
      if (!result.success) return { newCount: 0, error: result.error }

      const seenIds = new Set(loadFromStorage(SEEN_LAWS_KEY, []))
      const newLaws = result.data.filter(law => !seenIds.has(law.id))

      // Save check time
      saveToStorage(LAST_CHECK_KEY, new Date().toISOString())

      if (newLaws.length > 0) {
        // Mark all current as seen
        saveToStorage(SEEN_LAWS_KEY, result.data.map(l => l.id))

        addNotification({
          type: 'new_laws',
          title: `พบกฎหมายใหม่ ${newLaws.length} ฉบับ`,
          body: newLaws.slice(0, 3).map(l => l.title).join(' • '),
          laws: newLaws,
          href: '/new-laws',
        })
        return { newCount: newLaws.length }
      } else {
        // First time setup — save seen IDs without notifying
        if (seenIds.size === 0) {
          saveToStorage(SEEN_LAWS_KEY, result.data.map(l => l.id))
        }
      }

      return { newCount: 0 }
    } finally {
      setChecking(false)
    }
  }, [settings, addNotification])

  // Auto-check on mount if due
  useEffect(() => {
    if (settings.enableNewLawAlerts) {
      checkGazette(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    notifications,
    unreadCount,
    settings,
    checking,
    addNotification,
    markRead,
    markAllRead,
    clearAll,
    updateSettings,
    checkGazette,
  }
}
