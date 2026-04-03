// src/contexts/InvoiceContext.jsx
// ─────────────────────────────────────────────────────────────
// Combines:
//   • currentInvoice / brand / template  (customisable invoice)
//   • allInvoices real-time subscription (global invoice list)
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth }      from './AuthContext'
import { useSettings }  from './SettingsContext'
import { useCustomers } from './CustomerContext'
import { subscribeToInvoices } from '../services/invoiceService'

const InvoiceContext = createContext()

export function InvoiceProvider({ children }) {
  const { user }      = useAuth()
  const { settings }  = useSettings()
  const { customers } = useCustomers()

  // ── Customisable invoice (unchanged from original) ────────
  const [currentInvoice, setCurrentInvoice] = useState(null)

  // ── Real-time all-invoices subscription ───────────────────
  const [allInvoices, setAllInvoices] = useState([])
  const unsubsRef = useRef({})

  useEffect(() => {
    Object.values(unsubsRef.current).forEach(u => u())
    unsubsRef.current = {}

    if (!user || !customers.length) {
      setAllInvoices([])
      return
    }

    const invoiceMap = {}

    customers.forEach(customer => {
      const unsub = subscribeToInvoices(
        user.uid,
        customer.id,
        (invoices) => {
          invoiceMap[customer.id] = invoices.map(inv => ({
            ...inv,
            customerName: inv.customerName || customer.name,
            customerId:   customer.id,
          }))
          const flat = Object.values(invoiceMap)
            .flat()
            .sort((a, b) => {
              const aTime = a.createdAt?.toMillis?.() ?? 0
              const bTime = b.createdAt?.toMillis?.() ?? 0
              return bTime - aTime
            })
          setAllInvoices([...flat])
        },
        (err) => console.error('[InvoiceContext]', customer.id, err)
      )
      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  return (
    <InvoiceContext.Provider
      value={{
        // ── Customisable invoice ──────────────────────────
        currentInvoice,
        setCurrentInvoice,
        template: settings.invoiceTemplate,
        brand: {
          name:    settings.brandName,
          logo:    settings.brandLogo,
          colour:  settings.brandColour,
          phone:   settings.brandPhone,
          email:   settings.brandEmail,
          address: settings.brandAddress,
          website: settings.brandWebsite,
          tagline: settings.brandTagline,
        },
        // ── Global invoice list ───────────────────────────
        allInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

// Original hook — keeps all existing code working unchanged
export function useInvoice() {
  return useContext(InvoiceContext)
}

// Alias for components that only need allInvoices (e.g. Home)
export function useInvoices() {
  return useContext(InvoiceContext)
}
