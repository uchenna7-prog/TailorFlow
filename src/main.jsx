import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CustomerProvider } from './contexts/CustomerContext';
import { OrdersProvider } from './contexts/OrdersContext'; // ✅ import OrdersProvider
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CustomerProvider>
        <OrdersProvider> {/* ✅ wrap with OrdersProvider */}
          <App />
        </OrdersProvider>
      </CustomerProvider>
    </BrowserRouter>
  </StrictMode>
);