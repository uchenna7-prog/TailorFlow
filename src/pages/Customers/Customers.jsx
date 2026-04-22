import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../../contexts/CustomerContext'
import { usePremium }   from '../../contexts/PremiumContext'
import Header from '../../components/Header/Header'
import styles from './Customers.module.css'

// ── Male measurement image imports ────────────────────────────
import aboveKneeMaleImg       from '../../assets/maleMeasurementImages/aboveKneeMale.jpg'
import ankleMaleImg           from '../../assets/maleMeasurementImages/ankleMale.jpg'
import armHoleMaleImg         from '../../assets/maleMeasurementImages/armHoleMale.jpg'
import armLengthMaleImg       from '../../assets/maleMeasurementImages/armLengthMale.jpg'
import belowKneeMaleImg       from '../../assets/maleMeasurementImages/belowKneeMale.jpg'
import bicepsMaleImg          from '../../assets/maleMeasurementImages/bicepsMale.jpg'
import calfMaleImg            from '../../assets/maleMeasurementImages/calfMale.jpg'
import calfToAnkleMaleImg     from '../../assets/maleMeasurementImages/calfToAnkleMale.jpg'
import chestMaleImg           from '../../assets/maleMeasurementImages/chestMale.jpg'
import coatSleeveLengthMaleImg from '../../assets/maleMeasurementImages/coatSleeveLengthMale.jpg'
import coatWaistMaleImg       from '../../assets/maleMeasurementImages/coatWaistMale.jpg'
import crossBackMaleImg       from '../../assets/maleMeasurementImages/crossBackMale.jpg'
import crotchMaleImg          from '../../assets/maleMeasurementImages/crotchMale.jpg'
import crotchToKneeMaleImg    from '../../assets/maleMeasurementImages/crotchToKneeMale.jpg'
import flyMaleImg             from '../../assets/maleMeasurementImages/flyMale.jpg'
import halfShoulderMaleImg    from '../../assets/maleMeasurementImages/halfShoulderMale.jpg'
import hipMaleImg             from '../../assets/maleMeasurementImages/hipMale.jpg'
import inseamMaleImg          from '../../assets/maleMeasurementImages/inseamMale.jpg'
import jacketLengthMaleImg    from '../../assets/maleMeasurementImages/jacketLengthMale.jpg'
import kneeToCalfMaleImg      from '../../assets/maleMeasurementImages/kneeToCalfMale.jpg'
import neckMaleImg            from '../../assets/maleMeasurementImages/neckMale.jpg'
import pantsLengthMaleImg     from '../../assets/maleMeasurementImages/pantsLengthMale.jpg'
import seatMaleImg            from '../../assets/maleMeasurementImages/seatMale.jpg'
import shirtLengthMaleImg     from '../../assets/maleMeasurementImages/shirtLengthMale.jpg'
import shortsLengthMaleImg    from '../../assets/maleMeasurementImages/shortsLengthMale.jpg'
import shoulderWidthMaleImg   from '../../assets/maleMeasurementImages/shoulderWidthMale.jpg'
import sleeveLengthForSuitMaleImg from '../../assets/maleMeasurementImages/sleeveLengthForSuitMale.jpg'
import sleeveLengthMaleImg    from '../../assets/maleMeasurementImages/sleeveLengthMale.jpg'
import thighsMaleImg          from '../../assets/maleMeasurementImages/thighsMale.jpg'
import waistMaleImg           from '../../assets/maleMeasurementImages/waistMale.jpg'
import waistToAnkleMaleImg    from '../../assets/maleMeasurementImages/waistToAnkleMale.jpg'
import wristMaleImg           from '../../assets/maleMeasurementImages/wristMale.jpg'

// ── Female measurement image imports ──────────────────────────
// Upper body
import neckFemaleImg                            from '../../assets/femaleMeasurementImages/neckFemale.jpg'
import frontNeckDepthFemaleImg                  from '../../assets/femaleMeasurementImages/frontNeckDepthFemale.jpg'
import backNeckDepthFemaleImg                   from '../../assets/femaleMeasurementImages/backNeckDepthFemale.jpg'
import shoulderFemaleImg                        from '../../assets/femaleMeasurementImages/shoulderFemale.jpg'
import halfShoulderFemaleImg                    from '../../assets/femaleMeasurementImages/halfShoulderFemale.jpg'
import frontShoulderFemaleImg                   from '../../assets/femaleMeasurementImages/frontShoulderFemale.jpg'
import backShoulderFemaleImg                    from '../../assets/femaleMeasurementImages/backShoulderFemale.jpg'
import shoulderToApexFemaleImg                  from '../../assets/femaleMeasurementImages/shoulderToApexFemale.jpg'
import apexToApexFemaleImg                      from '../../assets/femaleMeasurementImages/apexToApexFemale.jpg'
import upperChestFemaleImg                      from '../../assets/femaleMeasurementImages/upperChestFemale.jpg'
import bustFemaleImg                            from '../../assets/femaleMeasurementImages/bustFemale.jpg'
import chestFemaleImg                           from '../../assets/femaleMeasurementImages/chestFemale.jpg'
import blouseChestFemaleImg                     from '../../assets/femaleMeasurementImages/blouseChestFemale.jpg'
import blouseBelowBustFemaleImg                 from '../../assets/femaleMeasurementImages/blouseBelowBust.jpg'
import armHoleFemaleImg                         from '../../assets/femaleMeasurementImages/armHoleFemale.jpg'
import bicepsFemaleImg                          from '../../assets/femaleMeasurementImages/bicepsFemale.jpg'
import armLengthFemaleImg                       from '../../assets/femaleMeasurementImages/armLengthFemale.jpg'
import elbowLengthFemaleImg                     from '../../assets/femaleMeasurementImages/elbowLengthFemale.jpg'
import sleeveLengthHalfFemaleImg                from '../../assets/femaleMeasurementImages/sleeveLengthHalfFemale.jpg'
import capSleeveFemaleImg                       from '../../assets/femaleMeasurementImages/capSleeveFemale.jpg'
import capSleeveCircularFemaleImg               from '../../assets/femaleMeasurementImages/capSleeveCircularFemale.jpg'
import elbowCircularFemaleImg                   from '../../assets/femaleMeasurementImages/elbowCircularFemale.jpg'
import threeFourthSleeveLengthFemaleImg         from '../../assets/femaleMeasurementImages/threeFourthSleeveLengthFemale.jpg'
import threeFourthSleeveLengthCircularFemaleImg from '../../assets/femaleMeasurementImages/threeFourthSleeveLengthCircularFemale.jpg'
import fullSleeveLengthFemaleImg                from '../../assets/femaleMeasurementImages/fullSleeveLengthFemale.jpg'
import fullSleeveLengthCircularFemaleImg        from '../../assets/femaleMeasurementImages/fullSleeveLengthCircularFemale.jpg'
import wristFemaleImg                           from '../../assets/femaleMeasurementImages/wristFemale.jpg'
// Mid body
import stomachFemaleImg                         from '../../assets/femaleMeasurementImages/stomachFemale.jpg'
import waistFemaleImg                           from '../../assets/femaleMeasurementImages/waistFemale.jpg'
import blouseLengthFemaleImg                    from '../../assets/femaleMeasurementImages/blouseLengthFemale.jpg'
import shirtLengthFemaleImg                     from '../../assets/femaleMeasurementImages/shirtLengthFemale.jpg'
import stomachLengthFemaleImg                   from '../../assets/femaleMeasurementImages/stomachLengthFemale.jpg'
import waistLengthFemaleImg                     from '../../assets/femaleMeasurementImages/waistLengthFemale.jpg'
// Lower body
import hipFemaleImg                             from '../../assets/femaleMeasurementImages/hipFemale.jpg'
import hipLengthFemaleImg                       from '../../assets/femaleMeasurementImages/hipLengthFemale.jpg'
import crotchFemaleImg                          from '../../assets/femaleMeasurementImages/crotchFemale.jpg'
import thighFemaleImg                           from '../../assets/femaleMeasurementImages/thighFemale.jpg'
import thighLengthFemaleImg                     from '../../assets/femaleMeasurementImages/thighLengthFemale.jpg'
import kneeLengthFemaleImg                      from '../../assets/femaleMeasurementImages/kneeLengthFemale.jpg'
import calfFemaleImg                            from '../../assets/femaleMeasurementImages/calfFemale.jpg'
import calfToAnkleFemaleImg                     from '../../assets/femaleMeasurementImages/calfToAnkleFemale.jpg'
import ankleFemaleImg                           from '../../assets/femaleMeasurementImages/ankleFemale.jpg'
import wristToAnkleFemaleImg                    from '../../assets/femaleMeasurementImages/wristToAnkleFemale.jpg'
import fullHeightFemaleImg                      from '../../assets/femaleMeasurementImages/fullHeightFemale.jpg'
import kurthiHeightFemaleImg                    from '../../assets/femaleMeasurementImages/kurthiHeightFemale.jpg'

function getInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getBirthdayStr(birthday) {
  if (!birthday) return ''
  const today = new Date()
  const [month, day] = birthday.split('-').map(Number)
  if (today.getMonth() + 1 === month && today.getDate() === day) return '🎂 Today!'
  const d = new Date(2000, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function Toast({ message }) {
  return <div className={`${styles.toast} ${message ? styles.toastShow : ''}`}>{message}</div>
}

function ConfirmSheet({ customer, onConfirm, onCancel }) {
  if (!customer) return null
  return (
    <div className={styles.confirmOverlay} onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmSheet}>
        <h4>Delete Client?</h4>
        <p>"{customer.name}" will be permanently removed.</p>
        <div className={styles.confirmActions}>
          <button className={styles.btnConfirmDel} onClick={onConfirm}>Delete</button>
          <button className={styles.btnConfirmCancel} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Premium Gate Bottom Sheet ─────────────────────────────────
function PremiumSheet({ onClose }) {
  return (
    <div className={styles.confirmOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.confirmSheet}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span className="mi" style={{ fontSize: '2.5rem', color: 'var(--accent)' }}>workspace_premium</span>
        </div>
        <h4 style={{ textAlign: 'center' }}>Premium Feature</h4>
        <p style={{ textAlign: 'center' }}>
          Uploading client profile photos is a Premium feature. Upgrade to TailorFlow Pro to unlock photo uploads, branded invoices, and more.
        </p>
        <div className={styles.confirmActions}>
          <button
            className={styles.btnConfirmDel}
            style={{ background: 'var(--accent)' }}
            onClick={onClose}
          >
            <span className="mi" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: 6 }}>workspace_premium</span>
            Upgrade to Pro
          </button>
          <button className={styles.btnConfirmCancel} onClick={onClose}>Maybe Later</button>
        </div>
      </div>
    </div>
  )
}

// ── Country Code Picker ───────────────────────────────────────
const DEFAULT_COUNTRY = { name: 'Nigeria', dial_code: '+234', flag: '🇳🇬' }

function CountryCodePicker({ selected, onSelect }) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch countries once when dropdown opens for the first time
  useEffect(() => {
    if (!open || countries.length > 0) return
    setLoading(true)
    fetch('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2')
      .then(r => r.json())
      .then(data => {
        const list = []
        data.forEach(c => {
          const root   = c.idd?.root || ''
          const suffix = c.idd?.suffixes
          if (!root) return
          // Some countries have multiple suffixes (e.g. +1 for US/CA)
          const suffixes = Array.isArray(suffix) && suffix.length === 1 ? suffix : (suffix || [''])
          suffixes.forEach(s => {
            const dial_code = root + s
            list.push({
              name:      c.name?.common || '',
              dial_code,
              flag:      c.flag || '',
              cca2:      c.cca2 || '',
            })
          })
        })
        // Sort alphabetically
        list.sort((a, b) => a.name.localeCompare(b.name))
        setCountries(list)
      })
      .catch(() => {
        // On failure, just leave countries empty — fallback handled below
      })
      .finally(() => setLoading(false))
  }, [open, countries.length])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const filtered = search.trim()
    ? countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial_code.includes(search)
      )
    : countries

  const handleSelect = (country) => {
    onSelect(country)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className={styles.ccPickerWrap} ref={dropdownRef}>
      <button
        type="button"
        className={styles.ccBtn}
        onClick={() => setOpen(v => !v)}
      >
        <span className={styles.ccFlag}>{selected.flag}</span>
        <span className={styles.ccCode}>{selected.dial_code}</span>
        <span className="mi" style={{ fontSize: '0.9rem', color: 'var(--text3)' }}>expand_more</span>
      </button>

      {open && (
        <div className={styles.ccDropdown}>
          <div className={styles.ccSearchWrap}>
            <span className="mi" style={{ fontSize: '1rem', color: 'var(--text3)' }}>search</span>
            <input
              autoFocus
              type="text"
              placeholder="Search country or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.ccSearchInput}
            />
          </div>
          <div className={styles.ccList}>
            {loading && (
              <div className={styles.ccListEmpty}>Loading countries…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className={styles.ccListEmpty}>No results</div>
            )}
            {!loading && filtered.map((c, i) => (
              <button
                key={`${c.cca2}-${c.dial_code}-${i}`}
                type="button"
                className={`${styles.ccOption} ${selected.dial_code === c.dial_code && selected.name === c.name ? styles.ccOptionActive : ''}`}
                onClick={() => handleSelect(c)}
              >
                <span className={styles.ccFlag}>{c.flag}</span>
                <span className={styles.ccOptionName}>{c.name}</span>
                <span className={styles.ccOptionCode}>{c.dial_code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Phone number formatting/validation helper ─────────────────
/**
 * Given the raw local number the user typed and the country object,
 * returns the final phone string to store, or null if invalid.
 *
 * Rules:
 * - If the user typed 11 digits AND the first digit is '0'  → strip the leading 0, store as dialCode + remaining 10 digits
 * - If the user typed 10 digits → store as dialCode + 10 digits
 * - Anything else → invalid
 */
function buildPhoneNumber(localNumber, countryDialCode) {
  const digits = localNumber.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${countryDialCode} ${digits.slice(1)}`
  }
  if (digits.length === 10) {
    return `${countryDialCode} ${digits}`
  }
  return null // invalid
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

// ── Male measurements ordered top → middle → lower body ──────
const MALE_MEASUREMENTS = [
  // ── Upper body (neck down to wrist) ──
  'Neck', 'Shoulder Width', 'Half Shoulder', 'Chest', 'Cross Back',
  'Arm Hole', 'Biceps', 'Arm Length', 'Sleeve Length', 'Coat Sleeve', 'Wrist',
  'Shirt Length', 'Jacket Length',
  // ── Mid body (waist, core, outerwear waist) ──
  'Waist', 'Hip', 'Seat', 'Coat Waist',
  'Crotch', 'Fly', 'Inseam',
  // ── Lower body (legs to feet) ──
  'Thighs', 'Crotch To Knee', 'Above Knee', 'Below Knee',
  'Knee To Calf', 'Calf', 'Calf To Ankle', 'Ankle',
  'Waist To Ankle', 'Pants Length', 'Shorts Length',
]

const MALE_MEASUREMENT_IMAGES = {
  // ── Upper body ──
  'Neck':           neckMaleImg,
  'Shoulder Width': shoulderWidthMaleImg,
  'Half Shoulder':  halfShoulderMaleImg,
  'Chest':          chestMaleImg,
  'Cross Back':     crossBackMaleImg,
  'Arm Hole':       armHoleMaleImg,
  'Biceps':         bicepsMaleImg,
  'Arm Length':     armLengthMaleImg,
  'Sleeve Length':  sleeveLengthMaleImg,
  'Coat Sleeve':    sleeveLengthForSuitMaleImg,
  'Wrist':          wristMaleImg,
  'Shirt Length':   shirtLengthMaleImg,
  'Jacket Length':  jacketLengthMaleImg,
  // ── Mid body ──
  'Waist':          waistMaleImg,
  'Hip':            hipMaleImg,
  'Seat':           seatMaleImg,
  'Coat Waist':     coatWaistMaleImg,
  'Crotch':         crotchMaleImg,
  'Fly':            flyMaleImg,
  'Inseam':         inseamMaleImg,
  // ── Lower body ──
  'Thighs':         thighsMaleImg,
  'Crotch To Knee': crotchToKneeMaleImg,
  'Above Knee':     aboveKneeMaleImg,
  'Below Knee':     belowKneeMaleImg,
  'Knee To Calf':   kneeToCalfMaleImg,
  'Calf':           calfMaleImg,
  'Calf To Ankle':  calfToAnkleMaleImg,
  'Ankle':          ankleMaleImg,
  'Waist To Ankle': waistToAnkleMaleImg,
  'Pants Length':   pantsLengthMaleImg,
  'Shorts Length':  shortsLengthMaleImg,
}

// ── Female measurements ordered top → middle → lower body ────
const FEMALE_MEASUREMENTS = [
  // ── Upper body ──
  'Neck', 'Front Neck Depth', 'Back Neck Depth',
  'Shoulder', 'Half Shoulder', 'Front Shoulder', 'Back Shoulder',
  'Shoulder To Apex', 'Apex To Apex',
  'Upper Chest', 'Bust', 'Chest', 'Blouse Chest', 'Blouse Below Bust',
  'Arm Hole', 'Biceps', 'Arm Length',
  'Elbow Length', 'Sleeve Length Half',
  'Cap Sleeve', 'Cap Sleeve Circular',
  'Elbow Circular',
  'Three Fourth Sleeve Length', 'Three Fourth Sleeve Length Circular',
  'Full Sleeve Length', 'Full Sleeve Length Circular',
  'Wrist',
  // ── Mid body ──
  'Stomach', 'Waist',
  'Blouse Length', 'Shirt Length', 'Stomach Length', 'Waist Length',
  // ── Lower body ──
  'Hip', 'Hip Length', 'Crotch',
  'Thigh', 'Thigh Length', 'Knee Length',
  'Calf', 'Calf To Ankle', 'Ankle',
  'Wrist To Ankle', 'Full Height', 'Kurthi Height',
]

const FEMALE_MEASUREMENT_IMAGES = {
  // ── Upper body ──
  'Neck':                                    neckFemaleImg,
  'Front Neck Depth':                        frontNeckDepthFemaleImg,
  'Back Neck Depth':                         backNeckDepthFemaleImg,
  'Shoulder':                                shoulderFemaleImg,
  'Half Shoulder':                           halfShoulderFemaleImg,
  'Front Shoulder':                          frontShoulderFemaleImg,
  'Back Shoulder':                           backShoulderFemaleImg,
  'Shoulder To Apex':                        shoulderToApexFemaleImg,
  'Apex To Apex':                            apexToApexFemaleImg,
  'Upper Chest':                             upperChestFemaleImg,
  'Bust':                                    bustFemaleImg,
  'Chest':                                   chestFemaleImg,
  'Blouse Chest':                            blouseChestFemaleImg,
  'Blouse Below Bust':                       blouseBelowBustFemaleImg,
  'Arm Hole':                                armHoleFemaleImg,
  'Biceps':                                  bicepsFemaleImg,
  'Arm Length':                              armLengthFemaleImg,
  'Elbow Length':                            elbowLengthFemaleImg,
  'Sleeve Length Half':                      sleeveLengthHalfFemaleImg,
  'Cap Sleeve':                              capSleeveFemaleImg,
  'Cap Sleeve Circular':                     capSleeveCircularFemaleImg,
  'Elbow Circular':                          elbowCircularFemaleImg,
  'Three Fourth Sleeve Length':              threeFourthSleeveLengthFemaleImg,
  'Three Fourth Sleeve Length Circular':     threeFourthSleeveLengthCircularFemaleImg,
  'Full Sleeve Length':                      fullSleeveLengthFemaleImg,
  'Full Sleeve Length Circular':             fullSleeveLengthCircularFemaleImg,
  'Wrist':                                   wristFemaleImg,
  // ── Mid body ──
  'Stomach':                                 stomachFemaleImg,
  'Waist':                                   waistFemaleImg,
  'Blouse Length':                           blouseLengthFemaleImg,
  'Shirt Length':                            shirtLengthFemaleImg,
  'Stomach Length':                          stomachLengthFemaleImg,
  'Waist Length':                            waistLengthFemaleImg,
  // ── Lower body ──
  'Hip':                                     hipFemaleImg,
  'Hip Length':                              hipLengthFemaleImg,
  'Crotch':                                  crotchFemaleImg,
  'Thigh':                                   thighFemaleImg,
  'Thigh Length':                            thighLengthFemaleImg,
  'Knee Length':                             kneeLengthFemaleImg,
  'Calf':                                    calfFemaleImg,
  'Calf To Ankle':                           calfToAnkleFemaleImg,
  'Ankle':                                   ankleFemaleImg,
  'Wrist To Ankle':                          wristToAnkleFemaleImg,
  'Full Height':                             fullHeightFemaleImg,
  'Kurthi Height':                           kurthiHeightFemaleImg,
}


function AddCustomerForm({ isOpen, onClose, onSave, isPremium }) {
  const [formTab, setFormTab]         = useState('personal')
  const [name, setName]               = useState('')
  const [localPhone, setLocalPhone]   = useState('')
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY)
  const [phoneType, setPhoneType]     = useState('Mobile')
  const [sex, setSex]                 = useState('')
  const [bdayDay, setBdayDay]         = useState('')
  const [bdayMonth, setBdayMonth]     = useState('')
  const [email, setEmail]             = useState('')
  const [address, setAddress]         = useState('')
  const [notes, setNotes]             = useState('')
  const [photo, setPhoto]             = useState(null)
  const [showPremiumSheet, setShowPremiumSheet] = useState(false)
  const fileInputRef = useRef(null)

  const [bodyMeasurements, setBodyMeasurements] = useState({})
  const [customFields, setCustomFields]         = useState([])
  const [sexError, setSexError]                 = useState(false)
  const [formInlineMsg, setFormInlineMsg]       = useState(null) // { text, ok }
  const formInlineMsgTimer                      = useRef(null)

  const initials         = getInitials(name) || '+'
  const measureFields    = sex === 'Female' ? FEMALE_MEASUREMENTS : MALE_MEASUREMENTS
  const hasMeasurements  = Object.values(bodyMeasurements).some(v => v !== '' && v !== undefined && v !== '0' && v !== 0)
    || customFields.some(f => f.label.trim() && f.value !== '')

  const showInlineMsg = (text, ok = true) => {
    setFormInlineMsg({ text, ok })
    clearTimeout(formInlineMsgTimer.current)
    formInlineMsgTimer.current = setTimeout(() => setFormInlineMsg(null), 2600)
  }

  const handlePhotoPicker = () => {
    if (!isPremium) { setShowPremiumSheet(true); return }
    fileInputRef.current?.click()
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const updateBodyMeasure = (field, val) => {
    setBodyMeasurements(prev => ({ ...prev, [field]: val }))
  }

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { id: Date.now(), label: '', value: '' }])
  }

  const updateCustomField = (id, key, val) => {
    setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: val } : f))
  }

  const removeCustomField = (id) => {
    setCustomFields(prev => prev.filter(f => f.id !== id))
  }

  const handleClose = () => {
    setName(''); setLocalPhone(''); setSelectedCountry(DEFAULT_COUNTRY)
    setPhoneType('Mobile'); setSex('')
    setBdayDay(''); setBdayMonth(''); setEmail(''); setAddress('')
    setNotes(''); setPhoto(null); setBodyMeasurements({}); setCustomFields([])
    setFormTab('personal'); setSexError(false); setFormInlineMsg(null)
    clearTimeout(formInlineMsgTimer.current)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  const handleSave = () => {
    // ── Phase 1: Personal Info tab ─────────────────────────────
    if (formTab === 'personal') {
      if (!name)  { showInlineMsg('Name is required', false); return }
      if (!sex)   { setSexError(true); showInlineMsg('Please select a sex', false); return }
      const builtPhone = buildPhoneNumber(localPhone, selectedCountry.dial_code)
      if (!localPhone.trim()) { showInlineMsg('Phone number is required', false); return }
      if (builtPhone === null) { showInlineMsg('Phone must be 10 digits (or 11 starting with 0)', false); return }
      // All personal validations passed — show inline success and advance to body tab
      showInlineMsg('Personal info saved ✓', true)
      setFormTab('body')
      return
    }

    // ── Phase 2: Body Measurements tab ─────────────────────────
    const allBody = { ...bodyMeasurements }
    customFields.forEach(f => { if (f.label.trim()) allBody[f.label.trim()] = f.value })
    const birthday = bdayMonth && bdayDay ? `${bdayMonth}-${bdayDay}` : ''
    const builtPhone = buildPhoneNumber(localPhone, selectedCountry.dial_code)
    if (localPhone.trim() && builtPhone === null) {
      onSave({ name, phone: '__INVALID_PHONE__', phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements: allBody })
      return
    }
    const phone = builtPhone || ''
    onSave({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements: allBody })
    handleClose()
  }

  const handleSkip = () => {
    // Save without any body measurements
    const birthday = bdayMonth && bdayDay ? `${bdayMonth}-${bdayDay}` : ''
    const builtPhone = buildPhoneNumber(localPhone, selectedCountry.dial_code)
    const phone = builtPhone || ''
    onSave({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements: {} })
    handleClose()
  }

  // Live phone digit count for hint
  const phoneDigits = localPhone.replace(/\D/g, '')
  const phoneHint = (() => {
    if (!phoneDigits) return null
    if (phoneDigits.length === 11 && phoneDigits.startsWith('0')) return { ok: true, msg: 'Leading 0 will be removed when saving' }
    if (phoneDigits.length === 10) return { ok: true, msg: 'Valid' }
    if (phoneDigits.length > 11) return { ok: false, msg: 'Too many digits' }
    if (phoneDigits.length === 11 && !phoneDigits.startsWith('0')) return { ok: false, msg: '11-digit numbers must start with 0' }
    return { ok: false, msg: `${10 - phoneDigits.length} more digit${10 - phoneDigits.length !== 1 ? 's' : ''} needed` }
  })()

  return (
    <>
      <div className={`${styles.formOverlay} ${isOpen ? styles.formOverlayOpen : ''}`}>
        <Header 
          type="back" 
          title="New Customer" 
          onBackClick={handleClose} 
          customActions={[
            formTab === 'personal'
              ? { label: 'Save', onClick: handleSave, color: 'var(--accent)' }
              : hasMeasurements
                ? { label: 'Save', onClick: handleSave, color: 'var(--accent)' }
                : { label: 'Skip', onClick: handleSkip, color: 'var(--text2)' }
          ]}
        />

        <div className={styles.formTabs}>
          <button className={`${styles.formTab} ${formTab === 'personal' ? styles.formTabActive : ''}`} onClick={() => setFormTab('personal')}>Personal Info</button>
          <button className={`${styles.formTab} ${formTab === 'body' ? styles.formTabActive : ''}`} onClick={() => setFormTab('body')}>Body Measurements</button>
        </div>

        {/* Inline status banner */}
        {formInlineMsg && (
          <div className={`${styles.formInlineMsg} ${formInlineMsg.ok ? styles.formInlineMsgOk : styles.formInlineMsgErr}`}>
            <span className="mi" style={{ fontSize: '0.95rem' }}>{formInlineMsg.ok ? 'check_circle' : 'error_outline'}</span>
            {formInlineMsg.text}
          </div>
        )}

        <div className={styles.formBody}>
          {formTab === 'personal' && (
            <>
              <div className={styles.photoPicker} onClick={handlePhotoPicker} style={{ position: 'relative' }}>
                {photo
                  ? <img src={photo} alt="Profile" className={styles.photoPreview} />
                  : <div className={styles.photoInitials}>{initials}</div>
                }
                <div className={styles.camBadge}>
                  {isPremium
                    ? <span className="mi" style={{ fontSize:'0.9rem' }}>photo_camera</span>
                    : <span className="mi" style={{ fontSize:'0.9rem' }}>lock</span>
                  }
                </div>
                {isPremium && (
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Full Name *</label>
                <input type="text" className={styles.formInput} placeholder="e.g. Uchendu Daniel" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Sex *
                  {sexError && <span style={{ color: 'var(--danger)', marginLeft: 6, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>Required</span>}
                </label>
                <div className={styles.sexRow}>
                  {['Male', 'Female'].map(s => (
                    <button
                      key={s}
                      className={`${styles.sexChip} ${sex === s ? styles.sexChipActive : ''} ${sexError && !sex ? styles.sexChipError : ''}`}
                      onClick={() => { setSex(s); setSexError(false) }}
                    >{s}</button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Birthday (Day & Month)</label>
                <div className={styles.inputRow}>
                  <select className={styles.formInput} value={bdayDay} onChange={e => setBdayDay(e.target.value)}>
                    <option value="">Day</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className={styles.formInput} value={bdayMonth} onChange={e => setBdayMonth(e.target.value)}>
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* ── Phone Number with Country Code ── */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Phone Number *</label>
                <div className={styles.phoneRow}>
                  <CountryCodePicker
                    selected={selectedCountry}
                    onSelect={setSelectedCountry}
                  />
                  <input
                    type="tel"
                    className={`${styles.formInput} ${styles.phoneInput}`}
                    placeholder="e.g. 09078117654"
                    inputMode="tel"
                    value={localPhone}
                    onChange={e => setLocalPhone(e.target.value)}
                  />
                </div>
                {phoneHint && (
                  <div className={styles.phoneHint} style={{ color: phoneHint.ok ? 'var(--accent)' : 'var(--danger)' }}>
                    {phoneHint.msg}
                  </div>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Phone Type</label>
                <select className={styles.formInput} value={phoneType} onChange={e => setPhoneType(e.target.value)}>
                  <option>Mobile</option><option>Home</option><option>Work</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Email Address</label>
                <input type="email" className={styles.formInput} placeholder="Optional" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Address</label>
                <input type="text" className={styles.formInput} placeholder="Optional" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

            </>
          )}

          {formTab === 'body' && (
            <>
              {!sex && (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:'0.85rem' }}>
                  Please select a sex on the Personal Info tab first.
                </div>
              )}
              {sex && (
                <>
                  <p style={{ fontSize:'0.65rem', fontWeight:800, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
                    {sex === 'Female' ? 'Female' : 'Male'} body measurements (inches)
                  </p>
                  {measureFields.map((field, idx) => {
                    const imgMap = sex === 'Male' ? MALE_MEASUREMENT_IMAGES : FEMALE_MEASUREMENT_IMAGES
                    const imgSrc = imgMap[field] || null
                    const isLastImgField = imgSrc &&
                      !measureFields.slice(idx + 1).some(f => imgMap[f])
                    if (imgSrc) {
                      return (
                        <div
                          key={field}
                          className={`${styles.measureImgRow} ${isLastImgField ? styles.measureImgRowLast : ''}`}
                        >
                          <img src={imgSrc} alt={field} className={styles.measureImg} />
                          <div className={styles.measureImgRight}>
                            <label className={styles.inputLabel}>{field}</label>
                            <input
                              type="number"
                              className={styles.formInput}
                              placeholder="0"
                              inputMode="decimal"
                              value={bodyMeasurements[field] || ''}
                              onChange={e => updateBodyMeasure(field, e.target.value)}
                            />
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={field} className={styles.inputGroup}>
                        <label className={styles.inputLabel}>{field}</label>
                        <input
                          type="number"
                          className={styles.formInput}
                          placeholder="0"
                          inputMode="decimal"
                          value={bodyMeasurements[field] || ''}
                          onChange={e => updateBodyMeasure(field, e.target.value)}
                        />
                      </div>
                    )
                  })}
                  {customFields.map(f => (
                    <div key={f.id} className={styles.customFieldRow}>
                      <div className={styles.customFieldInputs}>
                        <input type="text" className={styles.formInput} placeholder="Field name" value={f.label} onChange={e => updateCustomField(f.id, 'label', e.target.value)} />
                        <input type="number" className={styles.formInput} placeholder="0" inputMode="decimal" value={f.value} onChange={e => updateCustomField(f.id, 'value', e.target.value)} />
                      </div>
                      <button className={styles.removeCustomBtn} onClick={() => removeCustomField(f.id)}>
                        <span className="mi" style={{ fontSize: '1.2rem' }}>remove_circle_outline</span>
                      </button>
                    </div>
                  ))}
                  <button className={styles.addCustomFieldBtn} onClick={addCustomField}>
                    <span className="mi" style={{ fontSize: '1rem' }}>add</span> Add Custom Field
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showPremiumSheet && <PremiumSheet onClose={() => setShowPremiumSheet(false)} />}
    </>
  )
}

// ── Customer list item (list-style, same pattern as orders) ──
function CustomerCard({ customer, onDelete, onOpen, isLast }) {
  const initials = getInitials(customer.name)
  const bdayStr  = getBirthdayStr(customer.birthday)

  return (
    <div
      className={`${styles.custListItem} ${isLast ? styles.custListItemLast : ''}`}
      onClick={onOpen}
    >
      {/* Left: grey outer box with white inner box / avatar */}
      <div className={styles.custListOuter}>
        <div className={styles.custListInner}>
          {customer.photo
            ? <img src={customer.photo} alt={customer.name} className={styles.custListPhoto} />
            : <span className={styles.custListInitials}>{initials}</span>
          }
        </div>
      </div>

      {/* Info */}
      <div className={styles.custListInfo}>
        <div className={styles.custListName}>{customer.name}</div>
        {customer.phone && (
          <div className={styles.custListMeta}>{customer.phone}{bdayStr ? ` · ${bdayStr}` : ''}</div>
        )}
        {customer.email && (
          <div className={styles.custListMeta}>{customer.email}</div>
        )}
      </div>

      {/* Right: delete + chevron */}
      <div className={styles.custListActions}>
        <button
          className={styles.custDeleteBtn}
          onClick={e => { e.stopPropagation(); onDelete(customer) }}
        >
          <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>delete_outline</span>
        </button>
        <span className="mi" style={{ color: 'var(--text3)', fontSize: '1.1rem' }}>chevron_right</span>
      </div>
    </div>
  )
}

export default function Customers({ onMenuClick }) {
  const navigate = useNavigate()
  const { customers, addCustomer, deleteCustomer } = useCustomers()
  const { isPremium } = usePremium()

  const [query,        setQuery]        = useState('')
  const [formOpen,     setFormOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toastMsg,     setToastMsg]     = useState('')
  const [sortMode,     setSortMode]     = useState('date')   // 'date' | 'alpha'
  const [filterOpen,   setFilterOpen]   = useState(false)
  const toastTimer = useRef(null)

  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2400)
  }

  const handleSave = async ({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements }) => {
    if (!name)  { showToast('Name is required'); return }
    if (!phone) { showToast('Phone number is required'); return }
    if (phone === '__INVALID_PHONE__') { showToast('Phone number must be 10 digits (or 11 starting with 0)'); return }
    const today = new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    const hasMeasurements = Object.keys(bodyMeasurements || {}).length > 0
    try {
      await addCustomer({ name, phone, phoneType, sex, birthday, email, address, notes, photo, bodyMeasurements, date: today })
      showToast(hasMeasurements ? `${name} saved with measurements ✓` : `${name} added — no measurements saved`)
    } catch (err) {
      showToast(`ERROR: ${err?.code || err?.message || String(err)}`)
    }
  }

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return
    deleteCustomer(deleteTarget.id)
    showToast(`${deleteTarget.name} deleted`)
    setDeleteTarget(null)
  }

  const filtered = query.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone && c.phone.includes(query)))
    : customers

  const sectionLabel = customers.length === 0 ? '' : filtered.length === customers.length
    ? 'All Clients'
    : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`

  // ── Build grouped list based on sort mode ──────────────────
  const grouped = (() => {
    if (sortMode === 'alpha') {
      // Sort A-Z, group by first letter
      const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      return sorted.reduce((acc, c) => {
        const key = c.name.trim()[0]?.toUpperCase() || '#'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    } else {
      // Sort newest first, group by date added
      const sorted = [...filtered].sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0)
        const db = b.date ? new Date(b.date) : new Date(0)
        return db - da
      })
      return sorted.reduce((acc, c) => {
        const key = c.date || 'Unknown Date'
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
      }, {})
    }
  })()

  const selectSort = (mode) => {
    setSortMode(mode)
    setFilterOpen(false)
  }

  return (
    <div className={styles.page}>
      <Header onMenuClick={onMenuClick} />

      {/* Search bar + filter button */}
      <div className={styles.searchContainer}>
        <div className={styles.searchRow}>
          <div className={styles.searchBox}>
            <span className="mi" style={{ color:'var(--text3)', fontSize:'1.1rem' }}>search</span>
            <input type="text" placeholder="Search clients…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button
            className={`${styles.filterBtn} ${sortMode !== 'date' ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterOpen(v => !v)}
          >
            <span className="mi" style={{ fontSize: '1.3rem' }}>tune</span>
          </button>
        </div>

        {/* Filter dropdown */}
        {filterOpen && (
          <div className={styles.filterDropdown}>
            <div className={styles.filterDropdownTitle}>Sort by</div>
            <button
              className={`${styles.filterOption} ${sortMode === 'date' ? styles.filterOptionActive : ''}`}
              onClick={() => selectSort('date')}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>calendar_today</span>
              <span>Date Added</span>
              {sortMode === 'date' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
            <button
              className={`${styles.filterOption} ${sortMode === 'alpha' ? styles.filterOptionActive : ''}`}
              onClick={() => selectSort('alpha')}
            >
              <span className="mi" style={{ fontSize: '1.1rem' }}>sort_by_alpha</span>
              <span>Alphabetically (A–Z)</span>
              {sortMode === 'alpha' && <span className="mi" style={{ fontSize: '1rem', marginLeft: 'auto', color: 'var(--accent)' }}>check</span>}
            </button>
          </div>
        )}
      </div>

      {sectionLabel && <div className={styles.sectionLabel}>{sectionLabel}</div>}

      <div className={styles.scrollArea} onClick={() => filterOpen && setFilterOpen(false)}>
        {customers.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)' }}>person_outline</span></div>
            <p>No customer yet.</p>
            <span>Tap + to add your first customer</span>
          </div>
        )}
        {customers.length > 0 && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)' }}>search_off</span></div>
            <p>No matches found.</p>
            <span>Try a different name or number</span>
          </div>
        )}

        {Object.entries(grouped).map(([groupKey, groupCustomers]) => (
          <div key={groupKey} className={styles.custGroup}>
            <div className={styles.custGroupDate}>{groupKey}</div>
            <div className={styles.custGroupDivider} />

            {groupCustomers.map((c, idx) => (
              <CustomerCard
                key={c.id}
                customer={c}
                isLast={idx === groupCustomers.length - 1}
                onOpen={() => navigate(`/customers/${c.id}`)}
                onDelete={(cust) => setDeleteTarget(cust)}
              />
            ))}
          </div>
        ))}
      </div>

      <button className={styles.fab} onClick={() => setFormOpen(true)}>
        <span className="mi">add</span>
      </button>

      <AddCustomerForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        isPremium={isPremium}
      />

      <ConfirmSheet customer={deleteTarget} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />

      <Toast message={toastMsg} />
    </div>
  )
}
