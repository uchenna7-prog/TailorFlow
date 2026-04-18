// src/services/portfolioSettingsService.js
// Stores portfolio display settings: heroImageId, footerImageId
// Path: users/{uid}/portfolioSettings/main

import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function settingsDoc(uid) {
  return doc(db, 'users', uid, 'portfolioSettings', 'main')
}

/**
 * Save portfolio image selections.
 * @param {string} uid
 * @param {{ heroImageId: string|null, footerImageId: string|null }} settings
 */
export async function savePortfolioSettings(uid, settings) {
  await setDoc(settingsDoc(uid), {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Real-time listener for portfolio settings.
 * @param {string} uid
 * @param {(data: { heroImageId: string|null, footerImageId: string|null }) => void} callback
 * @param {(err: Error) => void} [onError]
 * @returns unsubscribe function
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
  const { getDoc } = await import('firebase/firestore')
  const snap = await getDoc(settingsDoc(uid))
  if (!snap.exists()) return { heroImageId: null, footerImageId: null }
  const { heroImageId = null, footerImageId = null } = snap.data()
  return { heroImageId, footerImageId }
}
