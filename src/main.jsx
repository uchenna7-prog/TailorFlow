import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider }     from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { BrandProvider }    from './contexts/BrandContext'
import { CustomerProvider } from './contexts/CustomerContext'
import { OrdersProvider }   from './contexts/OrdersContext'
import { TaskProvider }     from './contexts/TaskContext'
import App from './App'
import './index.css'

// Provider order matters — each provider can only use contexts
// from providers that wrap it:
//
//  AuthProvider      → Firebase session (no dependencies)
//  SettingsProvider  → localStorage (no dependencies)
//  BrandProvider     → reads SettingsContext
//  CustomerProvider  → reads AuthContext (user.uid)
//  OrdersProvider    → reads AuthContext (user.uid)
//  TaskProvider      → reads AuthContext (user.uid)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <BrandProvider>
            <CustomerProvider>
              <OrdersProvider>
                <TaskProvider>
                  <App />
                </TaskProvider>
              </OrdersProvider>
            </CustomerProvider>
          </BrandProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
