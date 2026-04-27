


export const RECEIPT_SAMPLE = {
  number: 'RCP-0001',
  date: '12 Apr 2025',
  
  orderPrice: '56200',

  payments: [
    { date: '10 Apr 2025', amount: '28100', method: 'transfer' },
    { date: '12 Apr 2025', amount: '28100', method: 'cash' },
  ],
  cumulativePaid: '56200',
}

export const getBrandSampleData = (brand) => {
  return {
    name: 'Adeola Stitches',
    ownerName: 'Adeola Fashola',
    tagline: 'Crafted with love, fitted for you',
    address: '14 Bode Thomas St, Surulere, Lagos',
    phone: '+234 801 234 5678',
    email: 'info@adeolacouture.ng',
    website: 'adeolacouture.ng',
    currency: '₦',
    footer: 'Thank you for your patronage🙏',
    showTax: false,
    taxRate: 0,
    dueDays: 14,
    accountBank: 'GTBank',
    accountNumber: '0123456789',
    accountName: 'Adeola Fashola',
    colour: brand?.colour || '#0057D7',
    colourId: brand?.colourId || 'bold-electric-blue',
  };
}; 

 export const CUSTOMER_SAMPLE_DATA = {
  name: 'Mrs. Chidinma Okafor',
  phone: '+234 801 234 5678',
  address: '22 Akin Adesola St, Victoria Island',
}

export const INVOICE_SAMPLE_DATA = {
  number: 'INV-0001',
  date: '12 Apr 2025',
  dueDate: '26 Apr 2025',
  orderDesc: 'Mrs. Chidinma Okafor Order',
  items: [
    { name: 'Custom Agbada Sewing', price: '8500' },
    { name: 'Senator Suit Stitching', price: '6200' },
    { name: 'Ankara Dress Alteration', price: '2500' },
    { name: 'Bridal Gown Fitting', price: '15000' },
    { name: 'Trouser Hemming', price: '1200' },
  ]

}