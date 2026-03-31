import { createContext, useContext, useState } from 'react'
import { useSettings } from './SettingsContext'

const InvoiceContext = createContext()

export function InvoiceProvider({ children }) {
  const { settings } = useSettings()

  const [currentInvoice, setCurrentInvoice] = useState(null)

  return (
    <InvoiceContext.Provider
      value={{
        currentInvoice,
        setCurrentInvoice,
        template: settings.invoiceTemplate,
        brand: {
          name: settings.brandName,
          logo: settings.brandLogo,
          colour: settings.brandColour,
          phone: settings.brandPhone,
          email: settings.brandEmail,
          address: settings.brandAddress,
          website: settings.brandWebsite,
          tagline: settings.brandTagline,
        }
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoice() {
  return useContext(InvoiceContext)
}