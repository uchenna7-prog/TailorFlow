import { useState, useRef } from "react"
import { useBrandTokens } from "../../../../hooks/useBrandTokens"
import { useBrand } from "../../../../contexts/BrandContext"
import Header from "../../../../components/Header/Header"
import styles from "./TemplateModal.module.css"
import { INVOICE_TEMPLATE_GROUPS } from "../../datas/invoiceTemplateGroups"
import { RECEIPT_TEMPLATE_GROUPS } from "../../datas/receiptTemplateGroups"
import { CUSTOMER_SAMPLE_DATA,INVOICE_SAMPLE_DATA,getBrandSampleData,RECEIPT_SAMPLE_DATA } from "../../datas/sampleDatas"

export function TemplateModal({ 
  isOpen, 
  currentInvoiceTemplate,
  currentReceiptTemplate, 
  colourId, 
  onClose, 
  onSelect 
}) {

  const [selectedInvoice, setSelectedInvoice] = useState(currentInvoiceTemplate || 'invoiceTemplate1')
  const [selectedReceipt, setSelectedReceipt] = useState(currentReceiptTemplate || 'receiptTemplate1')
  const [activeTab, setActiveTab] = useState('invoice')
  const modalRef = useRef(null)
  const {brand} = useBrand()

  useBrandTokens(colourId, modalRef)

  if (!isOpen) return null

  const templateGroups = activeTab === 'invoice' ? INVOICE_TEMPLATE_GROUPS : RECEIPT_TEMPLATE_GROUPS

  return (

    <div className={styles.modalContainer} ref={modalRef}>

      <Header
        type="back"
        title="Templates"
        onBackClick={onClose}
        customActions={[
          { 
            label: 'Select',
            onClick: () => { 
              onSelect({ invoiceTemplate: selectedInvoice, receiptTemplate: selectedReceipt }); 
              onClose() 
            } 
          }
        ]}
      />
      
      <div className={styles.tabsContainer}>

        <button
          className={`${styles.tabBtn} ${activeTab === 'invoice' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('invoice')}
        >

          <span className="mi" style={{ fontSize: '1rem' }}>receipt_long</span>
          Invoice

        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'receipt' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('receipt')}
        >

          <span className="mi" style={{ fontSize: '1rem' }}>payments</span>
          Receipt

        </button>

      </div>

      <div className={styles.templatesContainer}>

        {templateGroups.map((group, groupIndex) => (

          <div key={group.groupLabel}>

            <div className={`${styles.groupHeaderContainer} ${groupIndex === 0 ? styles.groupHeaderFirstContainer : ''}`}>

              <div className={styles.groupHeaderTextsContainer}>

                <span className={styles.groupLabel}>{group.groupLabel}</span>
                {group.groupDescription && <span className={styles.groupDescription}>{group.groupDescription}</span>}

              </div>
              
            </div>

            <div className={styles.groupTemplates}>


              {activeTab === "invoice" && group.templates.map(template => (

                  <div key={template.id} className={styles.templateContainer} onClick={() => setSelectedInvoice(template.id)}>

                    <div className={`${styles.fullPreviewContainer} ${selectedInvoice === template.id ? styles.fullPreviewActive : ''}`}>
                      
                      <template.Component 
                      invoice ={INVOICE_SAMPLE_DATA} 
                      customer={CUSTOMER_SAMPLE_DATA} 
                      brand={getBrandSampleData(brand)}/>

                    </div>

                    <div className={styles.templateInfo}>
                      
                      <div className={`${styles.radio} ${selectedInvoice === template.id ? styles.radioActive : ''}`} />

                      <div className={styles.templateLabelGroup}>
                        <span className={styles.templateLabel}>{template.label}</span>
                        {template.description && <span className={styles.templateDescription}>{template.description}</span>}
                      </div>

                    </div>
                  </div>
                )) }

                {activeTab === "receipt" && group.templates.map(template => (

                  <div key={template.id} className={styles.templateContainer} onClick={() => setSelectedReceipt(template.id)}>

                    <div className={`${styles.fullPreviewContainer} ${selectedReceipt === template.id ? styles.fullPreviewActive : ''}`}>
                      <template.Component 
                      receipt ={RECEIPT_SAMPLE_DATA} 
                      customer={CUSTOMER_SAMPLE_DATA} 
                      brand={getBrandSampleData(brand)}/>
                    </div>

                    <div className={styles.templateInfo}>

                      <div className={`${styles.radio} ${selectedReceipt === template.id ? styles.radioActive : ''}`} />

                      <div className={styles.templateLabelGroup}>
                        <span className={styles.templateLabel}>{template.label}</span>
                        {template.description && <span className={styles.templateDescription}>{template.description}</span>}
                      </div>

                    </div>
                  </div>
                )) }
            
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}