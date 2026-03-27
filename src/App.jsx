import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import SideBar from './components/SideBar/SideBar'
import Home from './pages/Home/Home'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar  = () => setSidebarOpen(true)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-shell">
      {/* Sidebar — receives open state and close handler */}
      <SideBar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main content area */}
      <div className="app-content">
        {/* Header — receives open handler to trigger sidebar */}
        <Header onMenuClick={openSidebar} />

        {/* Page routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Add more routes here as you build more pages:
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/settings" element={<Settings />} />
          */}
        </Routes>
      </div>
    </div>
  )
}

export default App
