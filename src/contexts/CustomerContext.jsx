import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeToCustomers,
  addCustomer    as fsAdd,
  updateCustomer as fsUpdate,
  deleteCustomer as fsDelete,
} from '../services/customerService'

const CustomerContext = createContext(null)

export function CustomerProvider({ children }) {
  const { user } = useAuth()

  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  // ── Real-time Firestore listener ──────────────────────────
  // Fires immediately with cached data, stays live for the session.
  // Clears automatically when the user logs out.
  useEffect(() => {
    if (!user) {
      setCustomers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = subscribeToCustomers(
      user.uid,
      (data) => { setCustomers(data); setLoading(false) },
      (err)  => { setError(err.message); setLoading(false) }
    )

    return unsub
  }, [user])

  // ── addCustomer ───────────────────────────────────────────
  // Same call signature as before: addCustomer(customerObject)
  // Strips any local id — Firestore generates its own.
  // The listener updates the array automatically after the write.
  const addCustomer = useCallback(async (customer) => {
    if (!user) return
    try {
      const { id: _localId, ...data } = customer
      return await fsAdd(user.uid, data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  // ── updateCustomer ────────────────────────────────────────
  // Same call signature: updateCustomer(id, updates)
  const updateCustomer = useCallback(async (id, updates) => {
    if (!user) return
    try {
      await fsUpdate(user.uid, String(id), updates)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  // ── deleteCustomer ────────────────────────────────────────
  // Same call signature: deleteCustomer(id)
  const deleteCustomer = useCallback(async (id) => {
    if (!user) return
    try {
      await fsDelete(user.uid, String(id))
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  // ── getCustomer ───────────────────────────────────────────
  // Reads from local state — no extra Firestore round-trip.
  const getCustomer = useCallback((id) => {
    return customers.find(c => String(c.id) === String(id)) ?? null
  }, [customers])

  return (
    <CustomerContext.Provider value={{
      customers,
      loading,
      error,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomer,
    }}>
      {children}
    </CustomerContext.Provider>
  )
}
export function useCustomers() {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomers must be used inside CustomerProvider')
  return ctx
}
