import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CUST_KEY = 'tailorbook_customers'

const CustomerContext = createContext(null)

export function CustomerProvider({ children }) {
  const [customers, setCustomers] = useState([])

  // Load once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUST_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        // wipe legacy seed
        if (saved.length === 1 && saved[0].id === 1 && saved[0].name === 'Uchendu Daniel') {
          localStorage.removeItem(CUST_KEY)
          setCustomers([])
        } else {
          setCustomers(saved)
        }
      }
    } catch {
      setCustomers([])
    }
  }, [])

  // Persist whenever customers changes
  useEffect(() => {
    try { localStorage.setItem(CUST_KEY, JSON.stringify(customers)) }
    catch { /* ignore */ }
  }, [customers])

  const addCustomer = useCallback((customer) => {
    setCustomers(prev => [customer, ...prev])
  }, [])

  const updateCustomer = useCallback((id, updates) => {
    setCustomers(prev => prev.map(c => String(c.id) === String(id) ? { ...c, ...updates } : c))
  }, [])

  const deleteCustomer = useCallback((id) => {
    setCustomers(prev => prev.filter(c => String(c.id) !== String(id)))
  }, [])

  const getCustomer = useCallback((id) => {
    return customers.find(c => String(c.id) === String(id)) ?? null
  }, [customers])

  return (
    <CustomerContext.Provider value={{ customers, addCustomer, updateCustomer, deleteCustomer, getCustomer }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomers() {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error('useCustomers must be used inside CustomerProvider')
  return ctx
}
