import { useState, useRef, useCallback } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useBrand } from '../../contexts/BrandContext'
import { useBrandTokens } from '../../hooks/useBrandTokens'
import Header from '../../components/Header/Header'
import Toast from '../../components/Toast/Toast'
import ConfirmSheet from '../../components/ConfirmSheet/ConfirmSheet'
import styles from './Settings.module.css'

import { Toggle } from './components/Toggle/Toggle'
import { SettingRow } from './components/SettingRow/SettingRow'
import { SegmentControl } from './components/SegmentControl/SegmentControl'
import { SectionHeader } from './components/SectionHeader/SectionHeader'

import { TemplateModal } from './modals/TemplateModal/TemplateModal'
import { ReceiptSettingsModal } from './modals/ReceiptSettingsModal/ReceiptSettingsModal'
import { InvoiceSettingsModal } from './modals/InvoiceSettingsModal/InvoiceSettingsModal'
import BottomNav from '../../components/BottomNav/BottomNav'


export default function Settings({ onMenuClick, isPremium=false, onUpgrade=()=>{} }) {
  const { settings, updateSetting, updateMany, resetSettings } = useSettings()
  const { brand } = useBrand()
  const [toastMsg,setToastMsg]=useState('')
  const [templateModal,setTemplateModal]=useState(false)
  const [invoiceModal,setInvoiceModal]=useState(false)
  const [receiptModal,setReceiptModal]=useState(false)
  const [clearConfirm,setClearConfirm]=useState(false)
  const [resetConfirm,setResetConfirm]=useState(false)
  const toastTimer=useRef(null)
  const showToast=useCallback(msg=>{setToastMsg(msg);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToastMsg(''),2400)},[])
  const isDark=settings.theme==='dark'

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />
      <div className={styles.scrollArea}>
        <SectionHeader icon="palette" label="Appearance" />
        <SettingRow icon="dark_mode" label="Dark Mode" sub={isDark?'Dark theme active':'Light theme active'}>
          <Toggle value={isDark} onChange={v=>updateSetting('theme',v?'dark':'light')} />
        </SettingRow>

        <SectionHeader icon="receipt_long" label="Invoice & Receipt" />
        <SettingRow icon="tune" label="Invoice Settings" sub={`${settings.invoiceCurrency} · ${settings.invoicePrefix} · Due ${settings.invoiceDueDays}d`} onClick={()=>setInvoiceModal(true)} chevron />
        <SettingRow icon="request_quote" label="Receipt Settings" sub="Prefix, footer text and receipt defaults" onClick={()=>setReceiptModal(true)} chevron />
        <SettingRow 
          icon="description" 
          label="Templates" 
          sub="Choose your preferred invoice and receipt designs" 
          value={settings.invoiceTemplate} 
          onClick={()=>setTemplateModal(true)} 
          chevron 
        />

        <SectionHeader icon="notifications" label="Notifications" />
        <SettingRow icon="alarm" label="Overdue Tasks" sub="Alert when tasks pass their due date">
          <Toggle value={settings.notifyOverdueTasks} onChange={v=>updateSetting('notifyOverdueTasks',v)} />
        </SettingRow>
        <SettingRow icon="cake" label="Customer Birthdays" sub="Remind you a day before">
          <Toggle value={settings.notifyUpcomingBirthdays} onChange={v=>updateSetting('notifyUpcomingBirthdays',v)} />
        </SettingRow>
        <SettingRow icon="money_off" label="Unpaid Invoices" sub="Alert for invoices past due date">
          <Toggle value={settings.notifyUnpaidInvoices} onChange={v=>updateSetting('notifyUnpaidInvoices',v)} />
        </SettingRow>

        <SectionHeader icon="storage" label="Data" />
        <SettingRow icon="restart_alt" label="Reset All Settings" sub="Restore defaults. Your customers and orders are safe." onClick={()=>setResetConfirm(true)} chevron danger />
        <SettingRow icon="delete_forever" label="Clear All Data" sub="Permanently delete everything" onClick={()=>setClearConfirm(true)} chevron divider={false} danger />
        <div style={{ height:32 }} />
      </div>

      <TemplateModal
        isOpen={templateModal}
        currentTemplate={settings.invoiceTemplate}
        colourId={brand.colourId}
        onClose={() => setTemplateModal(false)}
        onSelect={v => {
          updateMany({ invoiceTemplate: v, receiptTemplate: v })  // ← saves to both
          showToast('Template selected')
        }}
      />
      {invoiceModal&&<InvoiceSettingsModal onBack={()=>setInvoiceModal(false)} showToast={showToast} />}
      {receiptModal&&<ReceiptSettingsModal onBack={()=>setReceiptModal(false)} showToast={showToast} />}
      <ConfirmSheet open={clearConfirm} title="Delete All Data?" onConfirm={()=>{localStorage.clear();setClearConfirm(false);showToast('Cleared')}} onCancel={()=>setClearConfirm(false)} />
      <ConfirmSheet open={resetConfirm} title="Reset All Settings?" onConfirm={()=>{resetSettings();setResetConfirm(false);showToast('Settings reset')}} onCancel={()=>setResetConfirm(false)} />
      <Toast message={toastMsg} />
      <BottomNav></BottomNav>
    </div>
  )
}
