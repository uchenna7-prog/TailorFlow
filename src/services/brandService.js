// src/services/brandService.js
// Syncs brand/settings data to Firestore so the public portfolio page can read it.
// Data path: users/{uid}/publicProfile/brand

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

function brandDocRef(uid) {
  return doc(db, 'users', uid, 'publicProfile', 'brand')
}

/**
 * Save brand settings to Firestore.
 * Called from SettingsContext whenever brand-related fields change.
 */
export async function saveBrandToFirestore(uid, settings) {
  if (!uid) return
  await setDoc(brandDocRef(uid), {
    brandName:    settings.brandName    || '',
    brandTagline: settings.brandTagline || '',
    brandColour:  settings.brandColour  || '#D4AF37',
    brandLogo:    settings.brandLogo    || null,
    brandPhone:   settings.brandPhone   || '',
    brandEmail:   settings.brandEmail   || '',
    brandAddress: settings.brandAddress || '',
    brandWebsite: settings.brandWebsite || '',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Read brand settings from Firestore.
 * Used by the public Portfolio page.
 */
export async function getBrandFromFirestore(uid) {
  if (!uid) return null
  const snap = await getDoc(brandDocRef(uid))
  return snap.exists() ? snap.data() : null
}
