// src/services/customerService.js
// ─────────────────────────────────────────────────────────────
// All Firestore calls for customers live here.
// Data path: users/{uid}/customers/{customerId}
//
// This keeps Firebase completely out of your components.
// Orders and tasks follow the exact same pattern — just swap
// 'customers' for 'orders' or 'tasks' and copy this file.
// ─────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Path helpers ──────────────────────────────────────────────

/** Returns the Firestore collection ref for a user's customers */
function customersRef(uid) {
  return collection(db, 'users', uid, 'customers')
}

/** Returns a single customer document ref */
function customerDoc(uid, customerId) {
  return doc(db, 'users', uid, 'customers', customerId)
}

// ── CRUD ─────────────────────────────────────────────────────

/**
 * Add a new customer.
 * @param {string} uid  - Firebase Auth user ID
 * @param {object} data - Customer fields (name, phone, email, etc.)
 * @returns {Promise<string>} The new Firestore document ID
 */
export async function addCustomer(uid, data) {
  const ref = await addDoc(customersRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Fetch a single customer by ID.
 * @returns {Promise<object|null>}
 */
export async function getCustomer(uid, customerId) {
  const snap = await getDoc(customerDoc(uid, customerId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Fetch all customers once (one-time read).
 * Prefer subscribeToCustomers for live UI updates.
 * @returns {Promise<object[]>}
 */
export async function getAllCustomers(uid) {
  const q    = query(customersRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/**
 * Update an existing customer.
 * @param {object} data - Partial fields to update
 */
export async function updateCustomer(uid, customerId, data) {
  await updateDoc(customerDoc(uid, customerId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a customer document.
 */
export async function deleteCustomer(uid, customerId) {
  await deleteDoc(customerDoc(uid, customerId))
}

// ── Real-time listener ────────────────────────────────────────

/**
 * Subscribe to live customer updates.
 * Call the returned unsubscribe function in your useEffect cleanup.
 *
 * Usage:
 *   const unsub = subscribeToCustomers(uid, (customers) => setCustomers(customers))
 *   return () => unsub()
 *
 * @param {string}   uid      - Firebase Auth user ID
 * @param {function} callback - Called with the latest customer array on every change
 * @param {function} onError  - Optional error handler
 * @returns {function} Firestore unsubscribe function
 */
export function subscribeToCustomers(uid, callback, onError) {
  const q = query(customersRef(uid), orderBy('createdAt', 'desc'))

  return onSnapshot(
    q,
    (snap) => {
      const customers = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      callback(customers)
    },
    (err) => {
      console.error('[customerService] snapshot error:', err)
      onError?.(err)
    }
  )
}
