// src/services/receiptService.js
// Path: users/{uid}/customers/{customerId}/receipts/{receiptId}

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

function receiptsRef(uid, customerId) {
  return collection(db, 'users', uid, 'customers', customerId, 'receipts')
}

function receiptDoc(uid, customerId, receiptId) {
  return doc(db, 'users', uid, 'customers', customerId, 'receipts', receiptId)
}

export async function addReceipt(uid, customerId, data) {
  const { id: _localId, ...rest } = data
  const ref = await addDoc(receiptsRef(uid, customerId), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateReceiptStatus(uid, customerId, receiptId, status) {
  await updateDoc(receiptDoc(uid, customerId, receiptId), {
    status,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteReceipt(uid, customerId, receiptId) {
  await deleteDoc(receiptDoc(uid, customerId, receiptId))
}

export function subscribeToReceipts(uid, customerId, callback, onError) {
  const q = query(receiptsRef(uid, customerId), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error('[receiptService]', err); onError?.(err) }
  )
}
