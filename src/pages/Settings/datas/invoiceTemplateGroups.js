import { InvoiceTemplate1 } from "../../../components/Templates/InvoiceTemplates/Template1"
import { InvoiceTemplate2 } from "../../../components/Templates/InvoiceTemplates/Template2"
import { InvoiceTemplate3 } from "../../../components/Templates/InvoiceTemplates/Template3"
import { InvoiceTemplate4 } from "../../../components/Templates/InvoiceTemplates/Template4"
import { InvoiceTemplate5 } from "../../../components/Templates/InvoiceTemplates/Template5"
import { InvoiceTemplate6 } from "../../../components/Templates/InvoiceTemplates/Template6"
import { InvoiceTemplate7 } from "../../../components/Templates/InvoiceTemplates/Template7"
import { InvoiceTemplate8 } from "../../../components/Templates/InvoiceTemplates/Template8"
import { InvoiceTemplate9 } from "../../../components/Templates/InvoiceTemplates/Template9"
import { InvoiceTemplate10 } from "../../../components/Templates/InvoiceTemplates/Template10"
import { InvoiceTemplate11 } from "../../../components/Templates/InvoiceTemplates/Template11"

export const INVOICE_TEMPLATE_GROUPS = [
  {
    groupLabel: 'Simple and Clean',
    templates: [
      { id: 'invoiceTemplate1',  
        label: '1. Centered Balance',    
        description: 'Business name in the middle with a line on each side',  
        Component: InvoiceTemplate1
      },
      { 
        id: 'invoiceTemplate2',  
        label: '2. Triple-Box Info Bar', 
        description: 'Three side-by-side boxes showing contact details',       
        Component: InvoiceTemplate2 },
      { 
        id: 'invoiceTemplate3',  
        label: '3. Dual-Column Compact', 
        description: 'From and To details placed side by side',                
        Component: InvoiceTemplate3 
      },
    ],
  },
  {
    groupLabel: 'Bold Blocks',
    templates: [
      { 
        id: 'invoiceTemplate4',  
        label: '4. Full-Bleed Banner',    
        description: 'Big colour header at the top with a logo space',     
        Component: InvoiceTemplate4 
      },
      { 
        id: 'invoiceTemplate5',  
        label: '5. Solid Top and Bottom', 
        description: 'Colour fills both the top header and the base',      
        Component: InvoiceTemplate5 
      },
      { 
        id: 'invoiceTemplate6',  
        label: '6. Slanted Header',       
        description: 'Header cuts diagonally with a matching corner fill', 
        Component: InvoiceTemplate6 
      },
    ],
  },
  {
    groupLabel: 'Clear Labels',
    templates: [
      { 
        id: 'invoiceTemplate7',  
        label: '7. Full Field Labels',  
        description: 'Sender and receiver details listed with bold labels',         
        Component: InvoiceTemplate7 
      },
      { 
        id: 'invoiceTemplate8',  
        label: '8. Side Summary Box',   
        description: 'A dedicated box on the side holds totals and client details', 
        Component: InvoiceTemplate8 
      },
    ],
  },
  {
    groupLabel: 'Info Strip',
    templates: [
      { 
        id: 'invoiceTemplate9',  
        label: '9. Three-Column Details', 
        description: 'Payment, delivery, and billing info in one row',         
        Component: InvoiceTemplate9  
      },
      { 
        id: 'invoiceTemplate10', 
        label: '10. Strip and Signature', 
        description: 'Slim info bar at the top with a sign line at the base',  
        Component: InvoiceTemplate10 },
    ],
  },
  {
    groupLabel: 'Payment Options',
    templates: [
      { 
        id: 'invoiceTemplate11', 
        label: '11. Payment Tiles', 
        description: 'Separate boxes for bank transfer, mobile money, and cash', 
        Component: InvoiceTemplate11 
      },
    ],
  },
]