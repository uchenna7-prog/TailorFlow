// src/pages/CustomerBodyMeasurements/CustomerBodyMeasurements.jsx

import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate }       from 'react-router-dom'
import { useCustomers }                 from '../../contexts/CustomerContext'
import Header                           from '../../components/Header/Header'
import styles                           from './CustomerBodyMeasurements.module.css'

// ── Male measurement image imports ────────────────────────────
import aboveKneeMaleImg           from '../../assets/aboveKneeMale.jpg'
import ankleMaleImg               from '../../assets/ankleMale.jpg'
import armHoleMaleImg             from '../../assets/armHoleMale.jpg'
import armLengthMaleImg           from '../../assets/armLengthMale.jpg'
import belowKneeMaleImg           from '../../assets/belowKneeMale.jpg'
import bicepsMaleImg              from '../../assets/bicepsMale.jpg'
import calfMaleImg                from '../../assets/calfMale.jpg'
import calfToAnkleMaleImg         from '../../assets/calfToAnkleMale.jpg'
import chestMaleImg               from '../../assets/chestMale.jpg'
import coatSleeveLengthMaleImg    from '../../assets/coatSleeveLengthMale.jpg'
import coatWaistMaleImg           from '../../assets/coatWaistMale.jpg'
import crossBackMaleImg           from '../../assets/crossBackMale.jpg'
import crotchMaleImg              from '../../assets/crotchMale.jpg'
import crotchToKneeMaleImg        from '../../assets/crotchToKneeMale.jpg'
import flyMaleImg                 from '../../assets/flyMale.jpg'
import halfShoulderMaleImg        from '../../assets/halfShoulderMale.jpg'
import hipMaleImg                 from '../../assets/hipMale.jpg'
import inseamMaleImg              from '../../assets/inseamMale.jpg'
import jacketLengthMaleImg        from '../../assets/jacketLengthMale.jpg'
import kneeToCalfMaleImg          from '../../assets/kneeToCalfMale.jpg'
import neckMaleImg                from '../../assets/neckMale.jpg'
import pantsLengthMaleImg         from '../../assets/pantsLengthMale.jpg'
import seatMaleImg                from '../../assets/seatMale.jpg'
import shirtLengthMaleImg         from '../../assets/shirtLengthMale.jpg'
import shortsLengthMaleImg        from '../../assets/shortsLengthMale.jpg'
import shoulderWidthMaleImg       from '../../assets/shoulderWidthMale.jpg'
import sleeveLengthForSuitMaleImg from '../../assets/sleeveLengthForSuitMale.jpg'
import sleeveLengthMaleImg        from '../../assets/sleeveLengthMale.jpg'
import thighsMaleImg              from '../../assets/thighsMale.jpg'
import waistMaleImg               from '../../assets/waistMale.jpg'
import waistToAnkleMaleImg        from '../../assets/waistToAnkleMale.jpg'
import wristMaleImg               from '../../assets/wristMale.jpg'

// ── Female measurement image imports ──────────────────────────
import blouseLengthFemaleImg  from '../../assets/female/blouseLengthFemale.jpg'
import fullHeightFemaleImg    from '../../assets/female/fullHeightFemale.jpg'
import kurthiHeightFemaleImg  from '../../assets/female/kurthiHeightFemale.jpg'
import shirtLengthFemaleImg   from '../../assets/female/shirtLengthFemale.jpg'
import upperChestFemaleImg    from '../../assets/female/upperChestFemale.jpg'

// ── Measurement definitions (keep in sync with Customers.jsx) ─
const MALE_MEASUREMENTS = [
  'Neck', 'Shoulder Width', 'Half Shoulder', 'Chest', 'Cross Back',
  'Waist', 'Hip', 'Seat', 'Shirt Length', 'Sleeve Length', 'Arm Length',
  'Arm Hole', 'Biceps', 'Wrist', 'Thighs', 'Crotch', 'Crotch To Knee',
  'Above Knee', 'Below Knee', 'Knee To Calf', 'Calf', 'Calf To Ankle',
  'Ankle', 'Waist To Ankle', 'Inseam', 'Pants Length', 'Shorts Length',
  'Fly', 'Jacket Length', 'Coat Sleeve', 'Coat Waist',
]

// NOTE: Only update MALE_MEASUREMENT_IMAGES and MALE_MEASUREMENTS when new images are added.
const MALE_MEASUREMENT_IMAGES = {
  'Neck':           neckMaleImg,
  'Shoulder Width': shoulderWidthMaleImg,
  'Half Shoulder':  halfShoulderMaleImg,
  'Chest':          chestMaleImg,
  'Cross Back':     crossBackMaleImg,
  'Waist':          waistMaleImg,
  'Hip':            hipMaleImg,
  'Seat':           seatMaleImg,
  'Shirt Length':   shirtLengthMaleImg,
  'Sleeve Length':  sleeveLengthMaleImg,
  'Arm Length':     armLengthMaleImg,
  'Arm Hole':       armHoleMaleImg,
  'Biceps':         bicepsMaleImg,
  'Wrist':          wristMaleImg,
  'Thighs':         thighsMaleImg,
  'Crotch':         crotchMaleImg,
  'Crotch To Knee': crotchToKneeMaleImg,
  'Above Knee':     aboveKneeMaleImg,
  'Below Knee':     belowKneeMaleImg,
  'Knee To Calf':   kneeToCalfMaleImg,
  'Calf':           calfMaleImg,
  'Calf To Ankle':  calfToAnkleMaleImg,
  'Ankle':          ankleMaleImg,
  'Waist To Ankle': waistToAnkleMaleImg,
  'Inseam':         inseamMaleImg,
  'Pants Length':   pantsLengthMaleImg,
  'Shorts Length':  shortsLengthMaleImg,
  'Fly':            flyMaleImg,
  'Jacket Length':  jacketLengthMaleImg,
  'Coat Sleeve':    sleeveLengthForSuitMaleImg,
  'Coat Waist':     coatWaistMaleImg,
}

const FEMALE_MEASUREMENTS = [
  'Bust', 'Waist', 'Hip', 'Shoulder Width', 'Dress Length',
  'Sleeve Length', 'Neck', 'Thigh', 'Knee', 'Skirt Length',
  'Trouser Waist', 'Inseam', 'Blouse Length', 'Under Bust', 'Armhole',
  'Shirt Length', 'Full Height', 'Kurthi Height',
]

const FEMALE_MEASUREMENT_IMAGES = {
  'Bust':          upperChestFemaleImg,
  'Blouse Length': blouseLengthFemaleImg,
  'Shirt Length':  shirtLengthFemaleImg,
  'Full Height':   fullHeightFemaleImg,
  'Kurthi Height': kurthiHeightFemaleImg,
}

// ── Export helper ─────────────────────────────────────────────
function exportMeasurements(customer, entries) {
  const lines = [
    `Body Measurements — ${customer.name}`,
    customer.sex ? `Sex: ${customer.sex}` : '',
    '',
    ...entries.map(({ field, value }) => `${field}: ${value}″`),
  ].filter(l => l !== null)
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${customer.name.replace(/\s+/g, '_')}_measurements.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CustomerBodyMeasurements({ onMenuClick }) {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { getCustomer } = useCustomers()

  const [isScrolled, setIsScrolled] = useState(false)
  const topSentinelRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (topSentinelRef.current) observer.observe(topSentinelRef.current)
    return () => observer.disconnect()
  }, [])

  const customer = getCustomer(id)
  if (!customer) return null

  const sex              = customer.sex || ''
  const bodyMeasurements = customer.bodyMeasurements || {}

  // Determine the canonical field order for this customer's sex
  const orderedFields = sex === 'Female' ? FEMALE_MEASUREMENTS : MALE_MEASUREMENTS
  const imgMap        = sex === 'Female' ? FEMALE_MEASUREMENT_IMAGES : MALE_MEASUREMENT_IMAGES

  // Only show fields the customer actually has a value for.
  // Also collect any custom fields not in the canonical list.
  const knownEntries = orderedFields
    .filter(f => bodyMeasurements[f] !== undefined && bodyMeasurements[f] !== '')
    .map(f => ({ field: f, value: bodyMeasurements[f] }))

  const knownSet     = new Set(orderedFields)
  const customEntries = Object.entries(bodyMeasurements)
    .filter(([k, v]) => !knownSet.has(k) && v !== undefined && v !== '')
    .map(([k, v]) => ({ field: k, value: v }))

  const allEntries = [...knownEntries, ...customEntries]
  const isEmpty    = allEntries.length === 0

  const handleExport = () => exportMeasurements(customer, allEntries)

  return (
    <div className={styles.page}>
      <div ref={topSentinelRef} className={styles.sentinel} />

      <div className={styles.navHeader}>
        <Header
          type="back"
          title={isScrolled ? customer.name : 'Body Measurements'}
          customActions={[
            {
              icon:     'edit',
              onClick:  () => navigate(`/customers/edit/${id}`),
              outlined: true,
            },
            {
              icon:     'ios_share',
              onClick:  isEmpty ? undefined : handleExport,
              outlined: true,
              color:    isEmpty ? 'var(--text3)' : undefined,
            },
          ]}
        />
      </div>

      {/* Customer identity strip — mirrors CustomerDetail header style */}
      <div className={styles.identityStrip}>
        <div className={styles.stripName}>
          {customer.name}{sex ? ` (${sex})` : ''}
        </div>
        <div className={styles.stripSub}>Full body measurements · inches</div>
      </div>

      <div className={styles.scrollArea}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <span className="mi" style={{ fontSize: '3rem', color: 'var(--text3)', opacity: 0.3 }}>
              straighten
            </span>
            <p>No body measurements recorded.</p>
            <span>
              Open the customer's profile and tap{' '}
              <strong>Edit</strong> to add measurements.
            </span>
          </div>
        ) : (
          <div className={styles.list}>
            {allEntries.map(({ field, value }, idx) => {
              const imgSrc = imgMap[field] || null

              if (imgSrc) {
                // Detect last image-row so we can drop the divider
                const isLastImgRow = !allEntries
                  .slice(idx + 1)
                  .some(e => imgMap[e.field])

                return (
                  <div
                    key={field}
                    className={`${styles.imgRow} ${isLastImgRow && customEntries.length === 0 ? styles.imgRowLast : ''}`}
                  >
                    <img src={imgSrc} alt={field} className={styles.measureImg} />
                    <div className={styles.imgRowRight}>
                      <div className={styles.fieldLabel}>{field}</div>
                      <div className={styles.fieldValue}>{value}<span className={styles.unit}>″</span></div>
                    </div>
                  </div>
                )
              }

              // Text-only row (no image)
              const isLast = idx === allEntries.length - 1
              return (
                <div
                  key={field}
                  className={`${styles.textRow} ${isLast ? styles.textRowLast : ''}`}
                >
                  <div className={styles.fieldLabel}>{field}</div>
                  <div className={styles.fieldValue}>{value}<span className={styles.unit}>″</span></div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
