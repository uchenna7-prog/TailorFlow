// src/pages/Customers/Customers.jsx
import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { useCustomerData } from '../../hooks/useCustomerData'
import Header from '../../components/Header/Header'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import Toast from '../../components/Toast/Toast'

// ✅ Correct import paths
import MeasurementsTab from './tabs/MeasurementsTab'
import OrdersTab from './tabs/OrdersTab'
import InvoiceTab from './tabs/InvoiceTab'

import { MdArrowBack } from 'react-icons/md' // back button from Material Icons
import { AiFillDelete } from 'react-icons/ai' // delete icon

const Customers = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { customers } = useCustomers()
  const customer = useCustomerData(id)

  const [activeTab, setActiveTab] = useState('measurements')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    // handle delete logic here
    setShowConfirm(false)
  }

  return (
    <div className="page">
      <Header>
        {/* ✅ Back button */}
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <MdArrowBack size={24} />
        </button>
        <h1>{customer?.name}</h1>
      </Header>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'measurements' ? 'active' : ''}
          onClick={() => setActiveTab('measurements')}
        >
          Measurements
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={activeTab === 'invoice' ? 'active' : ''}
          onClick={() => setActiveTab('invoice')}
        >
          Invoice
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'measurements' && <MeasurementsTab customer={customer} />}
        {activeTab === 'orders' && <OrdersTab customer={customer} />}
        {activeTab === 'invoice' && <InvoiceTab customer={customer} />}
      </div>

      {/* Delete button */}
      <button
        className="delete-button"
        style={{ color: 'red' }}
        onClick={() => setShowConfirm(true)}
      >
        <AiFillDelete size={20} />
        Delete
      </button>

      {/* Confirm modal */}
      {showConfirm && (
        <ConfirmSheet
          message="Are you sure you want to delete this customer?"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <Toast />
    </div>
  )
}

export default Customers
