import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import SideBar from './components/SideBar/SideBar'
import Home from './pages/Home/Home'
import Customers from './pages/Customers/Customers'
import CustomerDetail from './pages/CustomerDetail/CustomerDetail'
import Tasks from './pages/Tasks/Tasks'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Routes>
        <Route path="/"              element={<Home         onMenuClick={() => setSidebarOpen(true)} />} />
        <Route path="/customers"     element={<Customers    onMenuClick={() => setSidebarOpen(true)} />} />
        <Route path="/tasks"         element={<Tasks        onMenuClick={() => setSidebarOpen(true)} />} />
        <Route path="/customers/:id" element={
          <ErrorBoundary>
            <CustomerDetail onMenuClick={() => setSidebarOpen(true)} />
          </ErrorBoundary>
        } />
      </Routes>
    </>
  )
}

export default App
