import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  subscribeToInvoices,
  addInvoice        as fsAddInvoice,
  updateInvoiceStatus as fsUpdateInvoiceStatus,
  deleteInvoice     as fsDeleteInvoice,
} from '../services/invoiceService'

// Per-customer localStorage keys (measurements + orders — unchanged)
const measKey   = (id) => `tailorbook_measurements_${id}`
const ordersKey = (id) => `tailorbook_orders_${id}`

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function persist(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) }
  catch { /* ignore */ }
}

export function useCustomerData(customerId) {
  const { user } = useAuth()

  const [measurements, setMeasurements] = useState([])
  const [orders, setOrders]             = useState([])
  const [invoices, setInvoices]         = useState([])

  // ── Load measurements + orders from localStorage (unchanged) ──
  useEffect(() => {
    if (!customerId) return
    setMeasurements(load(measKey(customerId)))
    setOrders(load(ordersKey(customerId)))
  }, [customerId])

  // ── Subscribe to invoices from Firestore ──────────────────
  // Real-time listener: fires immediately with cached data,
  // updates live whenever another device writes.
  // Cleans up when customerId or user changes.
  useEffect(() => {
    if (!user || !customerId) {
      setInvoices([])
      return
    }

    const unsub = subscribeToInvoices(
      user.uid,
      customerId,
      (data) => setInvoices(data),
      (err)  => console.error('[useCustomerData] invoices:', err)
    )

    return unsub
  }, [user, customerId])

  // ── MEASUREMENTS (localStorage — unchanged) ───────────────
  const saveMeasurement = useCallback((entry) => {
    setMeasurements(prev => {
      const next = [entry, ...prev]
      persist(measKey(customerId), next)
      return next
    })
  }, [customerId])

  const deleteMeasurement = useCallback((id) => {
    setMeasurements(prev => {
      const next = prev.filter(m => String(m.id) !== String(id))
      persist(measKey(customerId), next)
      return next
    })
  }, [customerId])

  // ── ORDERS (localStorage — unchanged) ────────────────────
  const saveOrder = useCallback((order) => {
    setOrders(prev => {
      const next = [order, ...prev]
      persist(ordersKey(customerId), next)
      return next
    })
  }, [customerId])

  const updateOrderStatus = useCallback((id, status) => {
    setOrders(prev => {
      const next = prev.map(o => String(o.id) === String(id) ? { ...o, status } : o)
      persist(ordersKey(customerId), next)
      return next
    })
  }, [customerId])

  const deleteOrder = useCallback((id) => {
    setOrders(prev => {
      const next = prev.filter(o => String(o.id) !== String(id))
      persist(ordersKey(customerId), next)
      return next
    })
  }, [customerId])

  // ── INVOICES (Firestore) ──────────────────────────────────

  // saveInvoice — called from CustomerDetail's generateInvoice handler.
  // Writes to Firestore; the live listener updates `invoices` state automatically.
  const saveInvoice = useCallback(async (invoice) => {
    if (!user || !customerId) return
    try {
      await fsAddInvoice(user.uid, customerId, invoice)
    } catch (err) {
      console.error('[useCustomerData] saveInvoice:', err)
      throw err
    }
  }, [user, customerId])

  // updateInvoiceStatus — called when user marks paid/unpaid from InvoiceView.
  // Optimistic update is NOT needed here — the Firestore listener is fast enough.
  const updateInvoiceStatus = useCallback(async (id, status) => {
    if (!user || !customerId) return
    try {
      await fsUpdateInvoiceStatus(user.uid, customerId, String(id), status)
    } catch (err) {
      console.error('[useCustomerData] updateInvoiceStatus:', err)
      throw err
    }
  }, [user, customerId])

  // deleteInvoice — called from InvoiceView's delete button.
  const deleteInvoice = useCallback(async (id) => {
    if (!user || !customerId) return
    try {
      await fsDeleteInvoice(user.uid, customerId, String(id))
    } catch (err) {
      console.error('[useCustomerData] deleteInvoice:', err)
      throw err
    }
  }, [user, customerId])

  return {
    measurements, saveMeasurement, deleteMeasurement,
    orders, saveOrder, updateOrderStatus, deleteOrder,
    invoices, saveInvoice, updateInvoiceStatus, deleteInvoice,
  }
}
