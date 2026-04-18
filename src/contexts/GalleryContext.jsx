// src/contexts/GalleryContext.jsx
// ─────────────────────────────────────────────────────────────
// Provides:
//   photos       — all gallery photos (real-time from Firestore)
//   dressTypes   — { completed_works: [...], designs: [...], inspiration: [...] }
//   loading      — true while first fetch is in flight
//   error        — last error string or null
//   addPhoto     — async (photoData) => firestoreId
//   updatePhoto  — async (id, data)
//   deletePhoto  — async (id)
//   saveDressTypes — async (tabId, typesArray)  ← persists to Firestore
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeToPhotos,
  subscribeToDressTypes,
  addPhoto    as fsAddPhoto,
  updatePhoto as fsUpdatePhoto,
  deletePhoto as fsDeletePhoto,
  saveDressTypes as fsSaveDressTypes,
} from '../services/galleryService'

const GalleryContext = createContext(null)

export function GalleryProvider({ children }) {
  const { user } = useAuth()

  const [photos,     setPhotos]     = useState([])
  const [dressTypes, setDressTypes] = useState({
    completed_works: [],
    designs:         [],
    inspiration:     [],
  })
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // ── Real-time listeners ───────────────────────────────────

  useEffect(() => {
    if (!user) {
      setPhotos([])
      setDressTypes({ completed_works: [], designs: [], inspiration: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Subscribe to photos
    const unsubPhotos = subscribeToPhotos(
      user.uid,
      (data) => { setPhotos(data); setLoading(false) },
      (err)  => { setError(err.message); setLoading(false) }
    )

    // Subscribe to dress types (all three tabs at once)
    const unsubTypes = subscribeToDressTypes(
      user.uid,
      (data) => setDressTypes(data),
      (err)  => setError(err.message)
    )

    return () => {
      unsubPhotos()
      unsubTypes()
    }
  }, [user])

  // ── Photos CRUD ──────────────────────────────────────────

  const addPhoto = useCallback(async (data) => {
    if (!user) return
    try {
      // Strip any local temp id before sending to Firestore
      const { id: _localId, ...photoData } = data
      return await fsAddPhoto(user.uid, photoData)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const updatePhoto = useCallback(async (id, data) => {
    if (!user) return
    try {
      await fsUpdatePhoto(user.uid, String(id), data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  const deletePhoto = useCallback(async (id) => {
    if (!user) return
    try {
      await fsDeletePhoto(user.uid, String(id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  // ── Dress Types ──────────────────────────────────────────

  /**
   * Persist updated dress types for one tab to Firestore.
   * The real-time listener will update dressTypes state automatically.
   */
  const saveDressTypes = useCallback(async (tabId, types) => {
    if (!user) return
    try {
      await fsSaveDressTypes(user.uid, tabId, types)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  return (
    <GalleryContext.Provider value={{
      photos,
      dressTypes,
      loading,
      error,
      addPhoto,
      updatePhoto,
      deletePhoto,
      saveDressTypes,
    }}>
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery() {
  const ctx = useContext(GalleryContext)
  if (!ctx) throw new Error('useGallery must be used inside GalleryProvider')
  return ctx
}
