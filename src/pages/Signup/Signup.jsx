import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile } from 'firebase/auth'
import styles from './Signup.module.css'

const STEPS = [
  { id: 'account',  label: 'Account',  icon: 'lock' },
  { id: 'personal', label: 'Personal', icon: 'person' },
  { id: 'brand',    label: 'Brand',    icon: 'storefront' },
]

function Field({ label, hint, error, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint && !error && <p className={styles.fieldHint}>{hint}</p>}
      {error && <p className={styles.fieldError}><span className="mi" style={{ fontSize: '0.75rem' }}>error</span>{error}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', icon, rightEl }) {
  return (
    <div className={styles.inputWrap}>
      {icon && <span className={`mi ${styles.inputIcon}`}>{icon}</span>}
      <input
        className={`${styles.textInput} ${icon ? styles.textInputWithIcon : ''}`}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {rightEl && <div className={styles.inputRight}>{rightEl}</div>}
    </div>
  )
}

function SegmentControl({ options, value, onChange }) {
  return (
    <div className={styles.segment}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.segBtn} ${value === opt.value ? styles.segActive : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function StepAccount({ data, onChange, errors }) {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Create your account</div>
        <div className={styles.stepIntroSub}>Your login details for TailorFlow</div>
      </div>

      <Field label="Email Address" error={errors.email}>
        <TextInput type="email" value={data.email} onChange={v => onChange('email', v)} placeholder="you@email.com" icon="mail" />
      </Field>

      <Field label="Password" hint="At least 8 characters" error={errors.password}>
        <TextInput
          type={showPass ? 'text' : 'password'}
          value={data.password}
          onChange={v => onChange('password', v)}
          placeholder="Create a password"
          icon="lock"
          rightEl={
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(p => !p)}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>
                {showPass ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          }
        />
      </Field>

      <Field label="Confirm Password" error={errors.confirmPassword}>
        <TextInput
          type={showConfirm ? 'text' : 'password'}
          value={data.confirmPassword}
          onChange={v => onChange('confirmPassword', v)}
          placeholder="Repeat your password"
          icon="lock_outline"
          rightEl={
            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
              <span className="mi" style={{ fontSize: '1.1rem', color: 'var(--text3)' }}>
                {showConfirm ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          }
        />
      </Field>
    </div>
  )
}

function StepPersonal({ data, onChange, errors }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Tell us about you</div>
        <div className={styles.stepIntroSub}>Basic info shown on your profile</div>
      </div>
      <Field label="Full Name" error={errors.fullName}>
        <TextInput value={data.fullName} onChange={v => onChange('fullName', v)} placeholder="e.g. Amara Okonkwo" icon="badge" />
      </Field>
      <Field label="Phone Number" error={errors.phone}>
        <TextInput type="tel" value={data.phone} onChange={v => onChange('phone', v)} placeholder="+234 800 000 0000" icon="call" />
      </Field>
      <Field label="City" error={errors.city}>
        <TextInput value={data.city} onChange={v => onChange('city', v)} placeholder="e.g. Lagos" icon="location_on" />
      </Field>
      <Field label="Country" error={errors.country}>
        <TextInput value={data.country} onChange={v => onChange('country', v)} placeholder="e.g. Nigeria" icon="public" />
      </Field>
    </div>
  )
}

function StepBrand({ data, onChange, errors }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepIntro}>
        <div className={styles.stepIntroTitle}>Your brand</div>
        <div className={styles.stepIntroSub}>Used on invoices and your profile. You can update these later.</div>
      </div>
      <Field label="Shop / Brand Name" error={errors.brandName}>
        <TextInput value={data.brandName} onChange={v => onChange('brandName', v)} placeholder="e.g. Stitched by Amara" icon="store" />
      </Field>
      <Field label="Tagline" hint="Optional.">
        <TextInput value={data.brandTagline} onChange={v => onChange('brandTagline', v)} placeholder="e.g. Crafted with love, fitted for you" icon="format_quote" />
      </Field>
      <Field label="Business Phone" hint="Optional.">
        <TextInput type="tel" value={data.brandPhone} onChange={v => onChange('brandPhone', v)} placeholder="+234 800 000 0000" icon="call" />
      </Field>
      <Field label="Business Address" hint="Shown on invoices. Optional.">
        <TextInput value={data.brandAddress} onChange={v => onChange('brandAddress', v)} placeholder="12 Tailor Street, Ikeja, Lagos" icon="location_on" />
      </Field>
      <Field label="Preferred Currency">
        <SegmentControl
          options={[
            { label: '₦ Naira',  value: '₦' },
            { label: '$ Dollar', value: '$' },
            { label: '£ Pound',  value: '£' },
            { label: '€ Euro',   value: '€' },
          ]}
          value={data.invoiceCurrency}
          onChange={v => onChange('invoiceCurrency', v)}
        />
      </Field>
    </div>
  )
}

function ProgressBar({ current, total }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill} style={{ width: `${((current + 1) / total) * 100}%` }} />
    </div>
  )
}

function StepDots({ steps, current }) {
  return (
    <div className={styles.stepDots}>
      {steps.map((s, i) => (
        <div
          key={s.id}
          className={`${styles.stepDot} ${i === current ? styles.stepDotActive : ''} ${i < current ? styles.stepDotDone : ''}`}
        >
          {i < current
            ? <span className="mi" style={{ fontSize: '0.75rem', color: '#000' }}>check</span>
            : <span className="mi" style={{ fontSize: '0.75rem' }}>{s.icon}</span>
          }
        </div>
      ))}
    </div>
  )
}

function validateStep(stepId, data) {
  const errors = {}
  if (stepId === 'account') {
    if (!data.email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Enter a valid email'
    if (!data.password) errors.password = 'Password is required'
    else if (data.password.length < 8) errors.password = 'Must be at least 8 characters'
    if (!data.confirmPassword) errors.confirmPassword = 'Please confirm your password'
    else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  }
  if (stepId === 'personal') {
    if (!data.fullName.trim()) errors.fullName = 'Full name is required'
    if (!data.phone.trim()) errors.phone = 'Phone number is required'
  }
  if (stepId === 'brand') {
    if (!data.brandName.trim()) errors.brandName = 'Brand name is required'
  }
  return errors
}

const INITIAL = {
  email: '', password: '', confirmPassword: '',
  fullName: '', phone: '', city: '', country: '',
  brandName: '', brandTagline: '', brandPhone: '', brandAddress: '',
  invoiceCurrency: '₦',
}

export default function Signup() {
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const [step,      setStep]      = useState(0)
  const [data,      setData]      = useState(INITIAL)
  const [errors,    setErrors]    = useState({})
  const [authError, setAuthError] = useState('')
  const [loading,   setLoading]   = useState(false)

  const currentStep = STEPS[step]

  const handleChange = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
    setErrors(prev => { const e = { ...prev }; delete e[key]; return e })
  }, [])

  const handleNext = async () => {
    const errs = validateStep(currentStep.id, data)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      return
    }

    // ── Final step: create Firebase account ──────────────────
    setLoading(true)
    setAuthError('')
    try {
      const cred = await signup(data.email.trim(), data.password)

      // Save first name as displayName so Home.jsx shows it correctly
      const firstName = data.fullName.trim().split(' ')[0]
      await updateProfile(cred.user, { displayName: firstName })

      // TODO: save profile/brand data to Firestore here if needed
      navigate('/', { replace: true })
    } catch (err) {
      setAuthError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => { setErrors({}); setStep(s => s - 1) }
  const isLast = step === STEPS.length - 1

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        {step > 0
          ? <button className={styles.topBack} onClick={handleBack} type="button">
              <span className="mi">arrow_back</span>
            </button>
          : <div className={styles.topBack} />
        }
        <div className={styles.topLogo}>
          <span className="mi" style={{ fontSize: '1.3rem', color: 'var(--accent)' }}>content_cut</span>
          <span className={styles.topLogoText}>TailorFlow</span>
        </div>
        <div className={styles.topBack} />
      </div>

      <ProgressBar current={step} total={STEPS.length} />

      <div className={styles.scrollArea}>
        <StepDots steps={STEPS} current={step} />

        <div className={styles.stepMeta}>
          <span className={styles.stepCounter}>Step {step + 1} of {STEPS.length}</span>
        </div>

        {currentStep.id === 'account'  && <StepAccount  data={data} onChange={handleChange} errors={errors} />}
        {currentStep.id === 'personal' && <StepPersonal data={data} onChange={handleChange} errors={errors} />}
        {currentStep.id === 'brand'    && <StepBrand    data={data} onChange={handleChange} errors={errors} />}

        {authError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', textAlign: 'center', marginBottom: 12 }}>
            {authError}
          </div>
        )}

        <button className={styles.ctaBtn} onClick={handleNext} type="button" disabled={loading}>
          {loading ? 'Creating account…' : isLast ? 'Create Account' : 'Continue'}
          {!loading && (
            <span className="mi" style={{ fontSize: '1.1rem' }}>
              {isLast ? 'check' : 'arrow_forward'}
            </span>
          )}
        </button>

        {step === 0 && (
          <p className={styles.loginPrompt}>
            Already have an account?{' '}
            <button type="button" className={styles.loginLink} onClick={() => navigate('/login')}>
              Log in
            </button>
          </p>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered. Try logging in.'
    case 'auth/invalid-email':        return 'Enter a valid email address.'
    case 'auth/weak-password':        return 'Password must be at least 6 characters.'
    case 'auth/network-request-failed': return 'Network error. Check your connection.'
    default: return 'Something went wrong. Please try again.'
  }
}
