import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider }     from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { BrandProvider }    from './contexts/BrandContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { OrdersProvider }   from './contexts/OrdersContext'
import { TaskProvider }     from './contexts/TaskContext'
import { InvoiceProvider }  from './contexts/InvoiceContext'
import { PremiumProvider }  from './contexts/PremiumContext'
import App from './App'
import './index.css'

// Provider order matters — each provider can only use contexts
// from providers that wrap it:
//
//  AuthProvider      → Firebase session (no dependencies)
//  SettingsProvider  → localStorage (no dependencies)
//  BrandProvider     → reads SettingsContext
//  PremiumProvider   → reads AuthContext (user.uid) → Firestore
//  CustomerProvider  → reads AuthContext (user.uid)
//  OrdersProvider    → reads AuthContext + CustomerContext
//  TaskProvider      → reads AuthContext (user.uid)
//  InvoiceProvider   → reads AuthContext + SettingsContext + CustomerContext

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
                      <App />
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
