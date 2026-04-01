// src/contexts/PremiumContext.jsx
// ─────────────────────────────────────────────────────────────
// Reads isPremium from Firestore: users/{uid}/settings/premium
// Free by default. Set isPremium: true in Firestore to upgrade.
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const PremiumContext = createContext(null)

export function PremiumProvider({ children }) {
  const { user } = useAuth()
  const [isPremium, setIsPremium] = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user) {
      setIsPremium(false)
      setLoading(false)
      return
    }

    // Listen to users/{uid}/settings/premium in real-time
    const ref = doc(db, 'users', user.uid, 'settings', 'premium')
    const unsub = onSnapshot(ref,
      (snap) => {
        setIsPremium(snap.exists() ? snap.data().isPremium === true : false)
        setLoading(false)
      },
      (err) => {
        console.error('[PremiumContext]', err)
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  // Call this when user successfully upgrades
  const upgradeToPremium = async () => {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'settings', 'premium')
    await setDoc(ref, { isPremium: true }, { merge: true })
  }

  return (
    <PremiumContext.Provider value={{ isPremium, loading, upgradeToPremium }}>
      {children}
    </PremiumContext.Provider>
  )
}

export function usePremium() {
  const ctx = useContext(PremiumContext)
  if (!ctx) throw new Error('usePremium must be used inside PremiumProvider')
  return ctx
}
