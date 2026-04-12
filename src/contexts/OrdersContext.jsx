// src/contexts/OrdersContext.jsx
// ─────────────────────────────────────────────────────────────
// Provides:
//   - allOrders: flat list of every order across all customers
//     (used by Home dashboard and Orders page)
//   - getOrders(customerId): orders for one customer
//     (used by CustomerDetail)
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth }      from './AuthContext'
import { useCustomers } from './CustomerContext'
import {
  subscribeToOrders,
  addOrder          as fsAdd,
  updateOrder       as fsUpdate,
  updateOrderStatus as fsUpdateStatus,
  updateOrderStage  as fsUpdateStage,
  deleteOrder       as fsDelete,
} from '../services/orderService'

const OrdersContext = createContext(null)

export function OrdersProvider({ children }) {
  const { user }      = useAuth()
  const { customers } = useCustomers()

  // orderMap: { [customerId]: Order[] }
  const [orderMap,  setOrderMap]  = useState({})
  const unsubsRef = useRef({})

  // ── Subscribe to ALL customers' orders ────────────────────
  useEffect(() => {
    if (!user || !customers.length) {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
      setOrderMap({})
      return
    }

    const currentIds = new Set(customers.map(c => c.id))

    // Remove listeners for customers no longer in the list
    Object.keys(unsubsRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        unsubsRef.current[id]()
        delete unsubsRef.current[id]
        setOrderMap(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }
    })

    // Add listeners for new customers
    customers.forEach(customer => {
      if (unsubsRef.current[customer.id]) return

      const unsub = subscribeToOrders(
        user.uid,
        customer.id,
        (orders) => {
          setOrderMap(prev => ({
            ...prev,
            [customer.id]: orders.map(o => ({
              ...o,
              customerName: o.customerName || customer.name,
              customerId:   customer.id,
            }))
          }))
        },
        (err) => console.error('[OrdersContext]', customer.id, err)
      )

      unsubsRef.current[customer.id] = unsub
    })

    return () => {
      Object.values(unsubsRef.current).forEach(u => u())
      unsubsRef.current = {}
    }
  }, [user, customers])

  // ── Derived: flat sorted list of all orders ───────────────
  const allOrders = Object.values(orderMap)
    .flat()
    .sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0
      const bTime = b.createdAt?.toMillis?.() ?? 0
      return bTime - aTime
    })

  // ── Get orders for a single customer ─────────────────────
  const getOrders = useCallback((customerId) => {
    return orderMap[customerId] || []
  }, [orderMap])

  // ── CRUD ─────────────────────────────────────────────────

  const addOrder = useCallback(async (customerId, data) => {
    if (!user) return
    try {
      const { id: _localId, ...orderData } = data
      return await fsAdd(user.uid, customerId, orderData)
    } catch (err) {
      console.error('[OrdersContext] addOrder:', err)
      throw err
    }
  }, [user])

  const updateOrder = useCallback(async (customerId, orderId, data) => {
    if (!user) return
    try {
      await fsUpdate(user.uid, customerId, String(orderId), data)
    } catch (err) {
      console.error('[OrdersContext] updateOrder:', err)
      throw err
    }
  }, [user])

  const updateOrderStatus = useCallback(async (customerId, orderId, status) => {
    if (!user) return
    try {
      await fsUpdateStatus(user.uid, customerId, String(orderId), status)
    } catch (err) {
      console.error('[OrdersContext] updateOrderStatus:', err)
      throw err
    }
  }, [user])

  const updateOrderStage = useCallback(async (customerId, orderId, stage) => {
    if (!user) return
    try {
      await fsUpdateStage(user.uid, customerId, String(orderId), stage)
    } catch (err) {
      console.error('[OrdersContext] updateOrderStage:', err)
      throw err
    }
  }, [user])

  const deleteOrder = useCallback(async (customerId, orderId) => {
    if (!user) return
    try {
      await fsDelete(user.uid, customerId, String(orderId))
    } catch (err) {
      console.error('[OrdersContext] deleteOrder:', err)
      throw err
    }
  }, [user])

  return (
    <OrdersContext.Provider value={{
      allOrders,
      getOrders,
      addOrder,
      updateOrder,
      updateOrderStatus,
      updateOrderStage,
      deleteOrder,
    }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
