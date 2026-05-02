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

function apptCol(uid) {
  return collection(db, 'users', uid, 'appointments')
}

function apptDoc(uid, id) {
  return doc(db, 'users', uid, 'appointments', id)
}

// ── Real-time listener ────────────────────────────────────────
export function subscribeToAppointments(uid, onData, onError) {
  const q = query(apptCol(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      onData(data)
    },
    onError
  )
}

// ── Create ────────────────────────────────────────────────────
export async function createAppointment(uid, apptData) {
  return addDoc(apptCol(uid), {
    ...apptData,
    createdAt: serverTimestamp(),
  })
}

// ── Update ────────────────────────────────────────────────────
export async function updateAppointment(uid, id, updates) {
  return updateDoc(apptDoc(uid, id), updates)
}

// ── Delete ────────────────────────────────────────────────────
export async function deleteAppointment(uid, id) {
  return deleteDoc(apptDoc(uid, id))
}
