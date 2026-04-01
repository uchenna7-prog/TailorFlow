// src/services/taskService.js
// ─────────────────────────────────────────────────────────────
// Data path: users/{uid}/tasks/{taskId}
// Tasks are global to the user (not scoped per customer) so you
// can show all tasks across all customers in one list.
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
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

function tasksRef(uid) {
  return collection(db, 'users', uid, 'tasks')
}

function taskDoc(uid, taskId) {
  return doc(db, 'users', uid, 'tasks', taskId)
}

export async function addTask(uid, data) {
  const ref = await addDoc(tasksRef(uid), {
    ...data,
    done:      false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTask(uid, taskId) {
  const snap = await getDoc(taskDoc(uid, taskId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getAllTasks(uid) {
  const q    = query(tasksRef(uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

/** Fetch only incomplete tasks */
export async function getPendingTasks(uid) {
  const q    = query(tasksRef(uid), where('done', '==', false), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function updateTask(uid, taskId, data) {
  await updateDoc(taskDoc(uid, taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function toggleTask(uid, taskId, currentDone) {
  await updateDoc(taskDoc(uid, taskId), {
    done:      !currentDone,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTask(uid, taskId) {
  await deleteDoc(taskDoc(uid, taskId))
}

export function subscribeToTasks(uid, callback, onError) {
  const q = query(tasksRef(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err  => { console.error('[taskService]', err); onError?.(err) }
  )
}
