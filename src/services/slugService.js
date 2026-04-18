// src/services/slugService.js
// Manages vanity URL slugs for portfolio pages.
//
// Firestore layout:
//   slugs/{slug}  →  { uid, createdAt }          (top-level, public readable)
//   users/{uid}/publicProfile/brand  →  { ...brandFields, portfolioSlug }
//
// The slug collection enables O(1) reverse lookup: slug → uid
// The brand doc stores the tailor's own slug so Portfolio.jsx can also
// do a direct uid lookup when a legacy UID link is used.

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── helpers ───────────────────────────────────────────────────

/**
 * Turn any string into a URL-safe slug.
 * "Stitched by Amara!" → "stitched-by-amara"
 */
export function toSlug(raw = '') {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
    .slice(0, 40)                    // max 40 chars
}

function slugDocRef(slug) {
  return doc(db, 'slugs', slug)
}

function brandDocRef(uid) {
  return doc(db, 'users', uid, 'publicProfile', 'brand')
}

// ── public API ────────────────────────────────────────────────

/**
 * Check whether a slug is already taken (by someone other than `ownerUid`).
 * Returns true if available, false if taken.
 */
export async function isSlugAvailable(slug, ownerUid) {
  if (!slug || slug.length < 3) return false
  const snap = await getDoc(slugDocRef(slug))
  if (!snap.exists()) return true
  // Allow if it already belongs to this user (no-op rename)
  return snap.data().uid === ownerUid
}

/**
 * Claim a slug for a user.
 * - Releases the old slug if there was one.
 * - Writes slugs/{slug} = { uid, createdAt }
 * - Writes portfolioSlug back to the brand doc so Portfolio.jsx can read it.
 *
 * Throws if the slug is taken by someone else.
 */
export async function claimSlug(uid, newSlug, oldSlug) {
  if (!uid || !newSlug) throw new Error('uid and newSlug are required')

  // Final availability check (double-check before write)
  const available = await isSlugAvailable(newSlug, uid)
  if (!available) throw new Error('slug_taken')

  // Release old slug if it's different
  if (oldSlug && oldSlug !== newSlug) {
    const oldSnap = await getDoc(slugDocRef(oldSlug))
    // Only delete if we own it (safety guard)
    if (oldSnap.exists() && oldSnap.data().uid === uid) {
      await deleteDoc(slugDocRef(oldSlug))
    }
  }

  // Claim new slug
  await setDoc(slugDocRef(newSlug), { uid, createdAt: serverTimestamp() })

  // Store slug on the brand doc so Portfolio.jsx can expose it
  await setDoc(brandDocRef(uid), { portfolioSlug: newSlug }, { merge: true })
}

/**
 * Resolve a slug to a uid.
 * Returns the uid string, or null if not found.
 */
export async function resolveSlug(slug) {
  if (!slug) return null
  const snap = await getDoc(slugDocRef(slug))
  return snap.exists() ? snap.data().uid : null
}

/**
 * Get the current slug saved on a user's brand doc (if any).
 */
export async function getCurrentSlug(uid) {
  if (!uid) return null
  const snap = await getDoc(brandDocRef(uid))
  if (!snap.exists()) return null
  return snap.data().portfolioSlug || null
}
