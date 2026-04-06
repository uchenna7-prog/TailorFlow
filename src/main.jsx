import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider }            from './contexts/AuthContext'
import { SettingsProvider }        from './contexts/SettingsContext'
import { BrandProvider }           from './contexts/BrandContext'
import { CustomerProvider }        from './contexts/CustomerContext'
import { OrdersProvider }          from './contexts/OrdersContext'
import { TaskProvider }            from './contexts/TaskContext'
import { InvoiceProvider }         from './contexts/InvoiceContext'
import { PaymentProvider }         from './contexts/PaymentContext'
import { AppointmentProvider }     from './contexts/AppointmentContext'
import { NotificationProvider }    from './contexts/NotificationContext'
import { PremiumProvider }         from './contexts/PremiumContext'
import App from './App'
import './index.css'

// Provider order — each provider can only use contexts from providers that wrap it:
//
//  AuthProvider          → Firebase session (no dependencies)
//  SettingsProvider      → localStorage (no dependencies)
//  BrandProvider         → reads SettingsContext
//  PremiumProvider       → reads AuthContext
//  CustomerProvider      → reads AuthContext
//  OrdersProvider        → reads AuthContext + CustomerContext
//  TaskProvider          → reads AuthContext
//  InvoiceProvider       → reads AuthContext + SettingsContext + CustomerContext
//  PaymentProvider       → reads AuthContext + CustomerContext
//  AppointmentProvider   → reads AuthContext
//  NotificationProvider  → reads Orders, Invoices, Tasks, Appointments, Customers

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <BrandProvider>
            <PremiumProvider>
              <CustomerProvider>
                <OrdersProvider>
                  <TaskProvider>
                    <InvoiceProvider>
                      <PaymentProvider>
                        <AppointmentProvider>
                          <NotificationProvider>
                            <App />
                          </NotificationProvider>
                        </AppointmentProvider>
                      </PaymentProvider>
                    </InvoiceProvider>
                  </TaskProvider>
                </OrdersProvider>
              </CustomerProvider>
            </PremiumProvider>
          </BrandProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// ── Register Service Worker (PWA) ─────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err))
  })
}
