// src/services/paymentService.js
// ─────────────────────────────────────────────────────────────
// Firestore CRUD for the payments subcollection.
// Path: users/{uid}/customers/{customerId}/payments/{paymentId}
// ─────────────────────────────────────────────────────────────

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function paymentsRef(uid, customerId) {
  return collection(db, 'users', uid, 'customers', customerId, 'payments')
}

function paymentDoc(uid, customerId, paymentId) {
  return doc(db, 'users', uid, 'customers', customerId, 'payments', paymentId)
}

// ── Subscribe ─────────────────────────────────────────────────
export function subscribeToPayments(uid, customerId, onData, onError) {
  const q = query(paymentsRef(uid, customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    onError
  )
}

// ── Create ────────────────────────────────────────────────────
export async function createPayment(uid, customerId, data) {
  return addDoc(paymentsRef(uid, customerId), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

// ── Update ────────────────────────────────────────────────────
export async function updatePayment(uid, customerId, paymentId, data) {
  return updateDoc(paymentDoc(uid, customerId, paymentId), data)
}

// ── Delete ────────────────────────────────────────────────────
export async function deletePayment(uid, customerId, paymentId) {
  return deleteDoc(paymentDoc(uid, customerId, paymentId))
}
