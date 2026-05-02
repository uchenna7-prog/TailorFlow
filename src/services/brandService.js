// src/services/brandService.js
// Syncs brand/settings data to Firestore so the public portfolio page can read it.
// Data path: users/{uid}/publicProfile/brand
//
// NOTE: brandLogo is intentionally excluded from Firestore writes.
// Base64 logos easily exceed Firestore's 1MB document limit and cause
// the entire setDoc to fail silently. The logo is kept in localStorage
// only (via SettingsContext) and is not needed by the public Portfolio page
// since Portfolio reads it from the brand doc — if you want logo on portfolio,
// upload it to Firebase Storage instead and store the download URL.

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { DEFAULT_COLOUR_ID } from '../config/brandPalette'

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
    // ── Core brand ──
    brandName:      settings.brandName      || '',
    brandTagline:   settings.brandTagline   || '',
    brandColourId:  settings.brandColourId  || DEFAULT_COLOUR_ID,
    brandColour:    settings.brandColour    || '#3737d4',
    // brandLogo intentionally omitted — base64 strings exceed Firestore's
    // 1MB document limit and cause the entire write to fail.
    // Store logo via Firebase Storage and save the download URL instead.
    brandPhone:     settings.brandPhone     || '',
    brandEmail:     settings.brandEmail     || '',
    brandAddress:   settings.brandAddress   || '',
    brandWebsite:   settings.brandWebsite   || '',

    // ── Business info ──
    brandFoundedYear:       settings.brandFoundedYear       || '',
    brandTurnaround:        settings.brandTurnaround        || '',
    brandServiceArea:       settings.brandServiceArea       || '',
    brandAvailability:      settings.brandAvailability      || 'open',
    brandAvailableUntil:    settings.brandAvailableUntil    || '',
    brandStyleStatement:    settings.brandStyleStatement    || '',
    brandFeaturedTechnique: settings.brandFeaturedTechnique || '',
    brandMilestone:         settings.brandMilestone         || '',
    brandSocials:           settings.brandSocials           || [],

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
