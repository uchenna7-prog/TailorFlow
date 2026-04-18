// src/services/portfolioSettingsService.js
// Stores portfolio display settings: heroImageId, footerImageId
// Path: users/{uid}/portfolioSettings/main

import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

function settingsDoc(uid) {
  return doc(db, 'users', uid, 'portfolioSettings', 'main')
}

/**
 * Save portfolio image selections.
 * Uses a local ISO timestamp instead of serverTimestamp() to avoid
 * blocking the write on a server round-trip (which hangs on slow mobile connections).
 */
export async function savePortfolioSettings(uid, settings) {
  await setDoc(settingsDoc(uid), {
    ...settings,
    updatedAt: new Date().toISOString(),
  }, { merge: true })
}

/**
 * Real-time listener for portfolio settings.
 */
export function subscribeToPortfolioSettings(uid, callback, onError) {
  return onSnapshot(
    settingsDoc(uid),
    snap => {
      if (snap.exists()) {
        const { heroImageId = null, footerImageId = null } = snap.data()
        callback({ heroImageId, footerImageId })
      } else {
        callback({ heroImageId: null, footerImageId: null })
      }
    },
    err => { console.error('[portfolioSettingsService]', err); onError?.(err) }
  )
}

/**
 * One-time fetch for portfolio settings (used by public Portfolio page).
 */
export async function getPortfolioSettings(uid) {
  const snap = await getDoc(settingsDoc(uid))
  if (!snap.exists()) return { heroImageId: null, footerImageId: null }
  const { heroImageId = null, footerImageId = null } = snap.data()
  return { heroImageId, footerImageId }
}
