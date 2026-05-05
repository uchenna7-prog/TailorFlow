import { useState, useRef } from 'react'
import { useBrandTokens } from '../../../../hooks/useBrandTokens'
import { useBrand } from '../../../../contexts/BrandContext'

import Header from '../../../../components/Header/Header'

import { INVOICE_TEMPLATE_GROUPS } from '../../datas/invoiceTemplateGroups'
import { RECEIPT_TEMPLATE_GROUPS } from '../../datas/receiptTemplateGroups'
import {
  CUSTOMER_SAMPLE_DATA,
  INVOICE_SAMPLE_DATA,
  RECEIPT_SAMPLE_DATA,
  getBrandSampleData,
} from '../../datas/sampleDatas'

import styles from './TemplateModal.module.css'


export function TemplateModal({
  isOpen,
  currentInvoiceTemplate,
  currentReceiptTemplate,
  colourId,
  onClose,
  onSelect,
}) {
  const { brand } = useBrand()
  const modalRef = useRef(null)


  const [selectedInvoiceTemplate, setSelectedInvoiceTemplate] = useState(
    currentInvoiceTemplate || 'invoiceTemplate1'
  )
  const [selectedReceiptTemplate, setSelectedReceiptTemplate] = useState(
    currentReceiptTemplate || 'receiptTemplate1'
  )
  const [activeTab, setActiveTab] = useState('invoice')
  const [inActiveTab, setInActiveTab] = useState("receipt")

  useBrandTokens(colourId, modalRef)

  if (!isOpen) return null

  const tabs = {
    invoice: {
      label: 'Invoice',
      icon: 'receipt_long',
      templateGroups: INVOICE_TEMPLATE_GROUPS,
      selectedId: selectedInvoiceTemplate,
      onSelectTemplate: setSelectedInvoiceTemplate,
      getSampleProps: () => ({
        invoice: INVOICE_SAMPLE_DATA,
        customer: CUSTOMER_SAMPLE_DATA,
        brand: getBrandSampleData(brand),
      }),
    },
    receipt: {
      label: 'Receipt',
      icon: 'payments',
      templateGroups: RECEIPT_TEMPLATE_GROUPS,
      selectedId: selectedReceiptTemplate,
      onSelectTemplate: setSelectedReceiptTemplate,
      getSampleProps: () => ({
        receipt: RECEIPT_SAMPLE_DATA,
        customer: CUSTOMER_SAMPLE_DATA,
        brand: getBrandSampleData(brand),
      }),
    },
  }

  const currentTab = tabs[activeTab]
  const nonCurrentTab = tabs[inActiveTab]

  function handleConfirmSelection() {
    onSelect({
      invoiceTemplate: selectedInvoiceTemplate,
      receiptTemplate: selectedReceiptTemplate,
    })
    onClose()
  }


  return (
    <div className={styles.templateModalContainer} ref={modalRef}>

      <Header
        type="back"
        title="Templates"
        onBackClick={onClose}
        customActions={[{ label: 'Select', onClick: handleConfirmSelection }]}
      />

 
      <div className={styles.tabRow}>
        {Object.entries(tabs).map(([tabKey, tab]) => (
          <button
            key={tabKey}
            className={`${styles.tabButton} ${activeTab === tabKey ? styles.tabButtonActive : ''}`}
            onClick={() => {

              if(tabKey=="invoice"){

                setActiveTab("invoice")
                setInActiveTab("receipt")
              }

              else{

                setActiveTab("receipt")
                setInActiveTab("invoice")

              }   
              

            }

            
              
            
            }
          >
            <span className="mi" style={{ fontSize: '1rem' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>


      <div className={styles.templateList}>
        {currentTab.templateGroups.map((group, groupIndex) => (
          <div key={group.groupLabel}>

            {/* Group header */}
            <div className={`${styles.groupHeader} ${groupIndex === 0 ? styles.groupHeaderFirst : ''}`}>
              <div className={styles.groupHeaderText}>
                <span className={styles.groupName}>{group.groupLabel}</span>
                {group.groupDescription && (
                  <span className={styles.groupSubtitle}>{group.groupDescription}</span>
                )}
              </div>
            </div>

            {/* Templates in this group */}
            <div className={styles.groupTemplateGrid}>
              {group.templates.map(template => {
                const isSelected = currentTab.selectedId === template.id
                

                return (
                  <div
                    key={template.id}
                    className={styles.templateCard}
                    onClick={() => {

                      let templateNumber = 0
                      let invoiceTemplate = ""
                      let receiptTemplate = ""

                      if (currentTab.label==="Invoice"){

                        templateNumber = template.id.replace("invoiceTemplate","")
                        invoiceTemplate = template.id
                        receiptTemplate = "receiptTemplate" + templateNumber
                        currentTab.onSelectTemplate(template.id)
                        nonCurrentTab.onSelectTemplate(receiptTemplate)
                      }

                      else{

                        templateNumber = template.id.replace("receiptTemplate","")
                        receiptTemplate = template.id
                        invoiceTemplate = "invoiceTemplate" + templateNumber
                        currentTab.onSelectTemplate(template.id)
                        nonCurrentTab.onSelectTemplate(invoiceTemplate)

                      }

                    }
                    }
                  >
                    {/* Preview */}
                    <div className={`${styles.templatePreview} ${isSelected ? styles.templatePreviewSelected : ''}`}>
                      <template.Component {...currentTab.getSampleProps()} />
                    </div>

                    <div className={styles.templateLabelRow}>

                      <div className={`${styles.radioCircle} ${isSelected ? styles.radioCircleSelected : ''}`} />
                      <div className={styles.templateTextGroup}>
                        <span className={styles.templateName}>{template.label}</span>
                        {template.description && (
                          <span className={styles.templateSubtitle}>{template.description}</span>
                        )}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}