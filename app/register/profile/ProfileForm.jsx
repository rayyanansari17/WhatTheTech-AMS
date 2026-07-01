'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { sendWelcomeEmail } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { SearchableCombobox } from '@/components/ui/searchable-combobox'
import TagInput from '@/components/ui/tag-input'
import FileUpload from '@/components/ui/file-upload'
import ProgressSidebar from '@/components/participant/ProgressSidebar'
import { Card, CardContent } from '@/components/ui/card'
import {
  TRACKS, ROLE_TYPES, DEGREE_TYPES, YEARS_OF_STUDY, GRADUATION_YEARS
} from '@/lib/constants'
import { validateGitHub, validateLinkedIn, validatePhone } from '@/lib/utils'
import { AlertCircle, Check, ChevronDown, User, Briefcase, Link2, GraduationCap, Phone, HelpCircle, FileCheck, Sparkles } from 'lucide-react'
import TopNav from '@/components/layout/TopNav'
import { TermsModal } from '@/components/TermsModal'
import toast from 'react-hot-toast'
import HelpDialog from '@/components/onboarding/HelpDialog'

// ─── Location data ────────────────────────────────────────────────────────────

const INDIA_STATES = [
  'Andaman & Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
  'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
]

const CITIES_BY_STATE = {
  'Andaman & Nicobar Islands': ['Port Blair'],
  'Andhra Pradesh': ['Vijayawada', 'Visakhapatnam', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga'],
  'Chandigarh': ['Chandigarh'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg'],
  'Dadra & Nagar Haveli and Daman & Diu': ['Silvassa', 'Daman', 'Diu'],
  'Delhi': ['New Delhi', 'Delhi', 'Noida', 'Dwarka'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Gandhinagar', 'Jamnagar'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Sonipat', 'Rohtak'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  'Karnataka': ['Bangalore', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Davangere'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Navi Mumbai', 'Thane', 'Solapur', 'Kolhapur'],
  'Manipur': ['Imphal'],
  'Meghalaya': ['Shillong'],
  'Mizoram': ['Aizawl'],
  'Nagaland': ['Kohima', 'Dimapur'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur'],
  'Puducherry': ['Puducherry'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Chandigarh'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  'Sikkim': ['Gangtok'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode'],
  'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'],
  'Tripura': ['Agartala'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Noida', 'Bareilly', 'Moradabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Howrah'],
}

// ─── Field of study ───────────────────────────────────────────────────────────

const FIELDS_OF_STUDY = [
  'Computer Science and Engineering', 'Information Technology',
  'Electronics and Communication Engineering', 'Electrical Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering',
  'Aerospace Engineering', 'Biotechnology', 'Bioinformatics', 'Data Science',
  'Artificial Intelligence and Machine Learning', 'Cybersecurity',
  'Software Engineering', 'Physics', 'Mathematics', 'Statistics', 'Chemistry',
  'Biology', 'Commerce / Business Administration', 'Economics', 'Finance',
  'Marketing', 'Management', 'Law', 'Medicine / MBBS', 'Pharmacy',
  'Architecture', 'Design', 'Media and Communication', 'Psychology',
  'Sociology', 'Political Science', 'History', 'English Literature', 'Other',
]

// ─── Skills autocomplete list ─────────────────────────────────────────────────

const SKILL_SUGGESTIONS = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express.js', 'Django',
  'Flask', 'FastAPI', 'Spring Boot', 'Laravel', 'Ruby on Rails', 'Python',
  'JavaScript', 'TypeScript', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust',
  'Kotlin', 'Swift', 'PHP', 'Ruby', 'Scala', 'R', 'MATLAB', 'HTML', 'CSS',
  'Tailwind CSS', 'Bootstrap', 'GraphQL', 'REST API', 'SQL', 'MySQL',
  'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase', 'AWS', 'Azure',
  'Google Cloud', 'Docker', 'Kubernetes', 'Git', 'Linux', 'Machine Learning',
  'Deep Learning', 'TensorFlow', 'PyTorch', 'Computer Vision', 'NLP',
  'Data Science', 'Pandas', 'NumPy', 'Scikit-learn', 'Figma', 'Adobe XD',
  'UI/UX Design', 'Blockchain', 'Web3', 'Solidity', 'Unity', 'Unreal Engine',
  'Android Development', 'iOS Development', 'Flutter', 'React Native',
]

const DRAFT_KEY = 'wtt_profile_draft'
const GITHUB_PREFIX = 'https://github.com/'
const LINKEDIN_PREFIX = 'https://linkedin.com/in/'

const SECTION_ORDER = ['about', 'experience', 'links', 'education', 'contact', 'additional', 'agreements']

const FIELD_TO_SECTION = {
  full_name: 'about', bio: 'about', gender: 'about', age: 'about',
  dietary_preference: 'about', dietary_restrictions: 'about',
  role_type: 'experience', skills: 'experience', year_of_study: 'additional',
  github: 'links', linkedin: 'links',
  degree_type: 'education', institution: 'education', currently_studying: 'education',
  field_of_study: 'education', year_of_graduation: 'education',
  phone: 'contact', emergency_contact: 'contact', city: 'contact',
  state: 'contact', country: 'contact',
  first_hackathon: 'additional', year_of_study: 'additional', track_preference: 'additional',
  code_of_conduct: 'agreements', privacy_policy: 'agreements', terms_conditions: 'agreements',
  email_updates: 'agreements', twitter_follow_confirmed: 'agreements',
}

// ─── Save button - stays "Saved ✓" until parent marks section dirty ───────────

function SaveButton({ onSave, isSaved }) {
  const [saving, setSaving] = useState(false)

  async function handle() {
    if (saving || isSaved) return
    setSaving(true)
    try { onSave() } catch {}
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={saving || isSaved}
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white rounded-full transition-colors ${
        isSaved ? 'bg-green-600 cursor-default' : saving ? 'bg-green-600 cursor-default' : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {saving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {saving ? 'Saving...' : isSaved ? 'Saved ✓' : 'Save'}
    </button>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FormError({ message }) {
  if (!message) return null
  return (
    <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />{message}
    </p>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, isOpen, isComplete, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick() }}
      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isComplete ? 'bg-green-50 dark:bg-green-950/30' : 'bg-accent'}`}>
        <Icon className={`w-4.5 h-4.5 ${isComplete ? 'text-green-600' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isComplete && <Check className="w-4 h-4 text-green-500" />}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </button>
  )
}

function AccordionSection({ id, icon, title, subtitle, isOpen, isComplete, onToggle, onSave, isSaved, children }) {
  return (
    <Card className="overflow-hidden">
      <SectionHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        isOpen={isOpen}
        isComplete={isComplete}
        onClick={() => onToggle(id)}
      />
      {isOpen && (
        <CardContent className="pt-0 px-4 pb-4 border-t border-border/50">
          <div className="pt-4 space-y-4">
            {children}
            <div className="flex justify-end pt-1">
              <SaveButton onSave={onSave} isSaved={isSaved} />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileForm() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openSection, setOpenSection] = useState('about')
  const [user, setUser] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploaded, setResumeUploaded] = useState(null)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [fieldOfStudyOther, setFieldOfStudyOther] = useState('')
  const [linksSaved, setLinksSaved] = useState(false)
  const [savedSections, setSavedSections] = useState({})
  const [isParsing, setIsParsing] = useState(false)
  const [parseResult, setParseResult] = useState(null)
  const [autofillHighlights, setAutofillHighlights] = useState({})
  const [showTermsModal, setShowTermsModal] = useState(false)

  const [form, setForm] = useState({
    full_name: '', bio: '', gender: '', age: '', dietary_preference: '', dietary_restrictions: '',
    role_type: [], skills: [], github: GITHUB_PREFIX, linkedin: LINKEDIN_PREFIX,
    degree_type: '', institution: '', currently_studying: true, field_of_study: '', year_of_graduation: '',
    phone: '', emergency_contact: '', city: '', state: '', country: 'India',
    first_hackathon: '', year_of_study: '', track_preference: '',
    code_of_conduct: false, privacy_policy: false, terms_conditions: false,
    email_updates: '', twitter_follow_confirmed: false, community_joined: false,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/register'); return }
      setUser(user)

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      let loaded = null

      if (profile) {
        // Strip +91 prefix from phone for display in the 10-digit field
        const rawPhone = profile.phone || ''
        const displayPhone = rawPhone.startsWith('+91') ? rawPhone.slice(3) : rawPhone

        loaded = {
          full_name: profile.full_name || user.user_metadata?.full_name || '',
          bio: profile.bio || '',
          gender: profile.gender || '',
          age: profile.age || '',
          dietary_preference: profile.dietary_preference || '',
          dietary_restrictions: profile.dietary_restrictions === 'None' ? '' : (profile.dietary_restrictions || ''),
          role_type: profile.role_type ? profile.role_type.split(',').filter(Boolean) : [],
          skills: profile.skills || [],
          github: profile.github || GITHUB_PREFIX,
          linkedin: profile.linkedin || LINKEDIN_PREFIX,
          degree_type: profile.degree_type || '',
          institution: profile.institution || '',
          currently_studying: profile.currently_studying ?? true,
          field_of_study: profile.field_of_study || '',
          year_of_graduation: profile.year_of_graduation || '',
          phone: displayPhone,
          emergency_contact: profile.emergency_contact || '',
          city: profile.city || '',
          state: profile.state || '',
          country: profile.country || 'India',
          first_hackathon: profile.first_hackathon === true ? 'yes' : profile.first_hackathon === false ? 'no' : '',
          year_of_study: profile.year_of_study || '',
          track_preference: profile.track_preference || '',
          code_of_conduct: profile.code_of_conduct || false,
          privacy_policy: profile.privacy_policy || false,
          terms_conditions: profile.terms_conditions || false,
          email_updates: profile.email_updates === true ? 'yes' : profile.email_updates === false ? 'no' : '',
          twitter_follow_confirmed: profile.twitter_follow_confirmed || false,
          community_joined: profile.community_joined || false,
        }

        if (loaded.field_of_study && !FIELDS_OF_STUDY.includes(loaded.field_of_study)) {
          setFieldOfStudyOther(loaded.field_of_study)
          loaded.field_of_study = 'Other'
        }

        if (profile.resume_url) setResumeUploaded(profile.resume_url)
      } else {
        loaded = { full_name: user.user_metadata?.full_name || '' }
      }

      // Restore draft if profile not yet complete
      if (!profile?.profile_complete) {
        try {
          const raw = localStorage.getItem(DRAFT_KEY)
          if (raw) {
            const draft = JSON.parse(raw)
            setForm(prev => ({ ...prev, ...loaded, ...draft }))
            toast('Draft restored', { icon: '📋', duration: 3000 })
            setLoading(false)
            return
          }
        } catch {}
      }

      setForm(prev => ({ ...prev, ...loaded }))
      setLoading(false)
    }
    load()
  }, [])

  function markDirty(section) {
    if (section) setSavedSections(prev => ({ ...prev, [section]: false }))
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    if (field === 'github' || field === 'linkedin') setLinksSaved(false)
    markDirty(FIELD_TO_SECTION[field])
  }

  function handleSectionSave(id) {
    saveDraftForSection(id)
    setSavedSections(prev => ({ ...prev, [id]: true }))
    const next = SECTION_ORDER[SECTION_ORDER.indexOf(id) + 1]
    setOpenSection(next || null)
    // Last section saved on desktop — scroll to Save & Continue button in sidebar
    if (!next && window.innerWidth >= 1024) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 150)
    }
  }

  function touch(field) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function fieldError(field) {
    return (submitAttempted || touched[field]) ? errors[field] : ''
  }

  function toggleRole(role) {
    setForm(prev => ({
      ...prev,
      role_type: prev.role_type.includes(role)
        ? prev.role_type.filter(r => r !== role)
        : [...prev.role_type, role],
    }))
    markDirty('experience')
  }

  function toggleSection(id) {
    setOpenSection(prev => prev === id ? null : id)
  }

  function saveDraftForSection(sectionId) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
    if (sectionId === 'links') setLinksSaved(true)
  }

  async function handleResumeUpload(file) {
    setResumeFile(file)
    if (!file) return

    setIsParsing(true)
    setParseResult(null)
    try {
      const fd = new FormData()
      fd.append('resume', file)

      const res = await fetch('/api/parse-resume', { method: 'POST', body: fd })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        toast.error(errBody.error || 'Could not read your resume. Please fill in manually.')
        return
      }

      const { data } = await res.json()
      if (!data) {
        toast.error('Resume parsed but no data could be extracted.')
        return
      }

      const isEffectivelyEmpty = (field) => {
        if (field === 'github') return !form.github || form.github === GITHUB_PREFIX
        if (field === 'linkedin') return !form.linkedin || form.linkedin === LINKEDIN_PREFIX
        if (Array.isArray(form[field])) return form[field].length === 0
        return !form[field] || form[field] === ''
      }

      // Parser now outputs form-ready values  -  no mapping needed
      const fieldMap = {
        full_name:        data.full_name,
        bio:              data.bio,
        phone:            data.phone,
        institution:      data.institution,
        degree_type:      data.degree_type,
        field_of_study:   data.field_of_study,
        github:           data.github,
        linkedin:         data.linkedin,
        year_of_study:    data.year_of_study,
      }

      const filledFields = []
      let delay = 0

      function scheduleField(field, value, applyFn) {
        const fn = applyFn || (() => set(field, value))
        setTimeout(() => {
          fn()
          setAutofillHighlights(prev => ({ ...prev, [field]: true }))
          setTimeout(() => setAutofillHighlights(prev => ({ ...prev, [field]: false })), 3000)
        }, delay)
        filledFields.push(field)
        delay += 150
      }

      // Simple scalar fields
      for (const [field, value] of Object.entries(fieldMap)) {
        if (value && isEffectivelyEmpty(field)) {
          scheduleField(field, value)
        }
      }

      // year_of_graduation  -  only fill for alumni (currently_studying: false)
      // For active students, year_of_study (inferred) is enough
      if (data.year_of_graduation && data.year_of_study === 'alumni' && isEffectivelyEmpty('year_of_graduation')) {
        const gradValue = data.year_of_graduation
        scheduleField('year_of_graduation', gradValue, () => {
          setForm(prev => ({ ...prev, currently_studying: false, year_of_graduation: gradValue }))
          markDirty('education')
        })
      }

      // role_type  -  add inferred roles; skip any already selected
      if (data.role_type?.length > 0 && isEffectivelyEmpty('role_type')) {
        const rolesToAdd = data.role_type
        scheduleField('role_type', rolesToAdd, () => set('role_type', rolesToAdd))
      }

      // skills  -  only fill if empty, cap at 6
      if (data.skills?.length > 0 && isEffectivelyEmpty('skills')) {
        const skillsToAdd = data.skills.slice(0, 6)
        scheduleField('skills', skillsToAdd, () => set('skills', skillsToAdd))
      }

      if (filledFields.length > 0) {
        setParseResult({ filled: filledFields.length, fields: filledFields })
        setTimeout(() => {
          const priority = ['education', 'about', 'links', 'contact', 'experience']
          const filledSections = [...new Set(filledFields.map(f => FIELD_TO_SECTION[f]).filter(Boolean))]
          const firstSection = priority.find(s => filledSections.includes(s))
          if (firstSection && firstSection !== 'experience') setOpenSection(firstSection)
        }, 1200)
      } else {
        toast('Resume uploaded but no new fields could be auto-filled.', { icon: 'ℹ️' })
      }
    } catch (err) {
      console.error('Autofill error:', err)
      toast.error('Something went wrong reading your resume. Please fill in manually.')
    } finally {
      setIsParsing(false)
    }
  }

  // Derived
  const githubUsername = form.github.startsWith(GITHUB_PREFIX)
    ? form.github.slice(GITHUB_PREFIX.length)
    : form.github
  const linkedinUsername = form.linkedin.startsWith(LINKEDIN_PREFIX)
    ? form.linkedin.slice(LINKEDIN_PREFIX.length)
    : form.linkedin

  const githubFilled = githubUsername.trim().length > 0
  const linkedinFilled = linkedinUsername.trim().length > 0
  const resolvedFieldOfStudy = form.field_of_study === 'Other' ? fieldOfStudyOther : form.field_of_study
  const cityOptions = form.state ? (CITIES_BY_STATE[form.state] || []) : Object.values(CITIES_BY_STATE).flat().sort()

  // ─── Completion checks ────────────────────────────────────────────────────

  const completedSections = []

  if (form.full_name && form.bio && form.gender && form.age && form.dietary_preference)
    completedSections.push('about')

  if (form.role_type.length > 0 && form.skills.length > 0)
    completedSections.push('experience')

  completedSections.push('links')

  if (form.degree_type && form.institution && resolvedFieldOfStudy)
    completedSections.push('education')

  if (form.phone && validatePhone(form.phone) && form.city && form.state && form.country)
    completedSections.push('contact')

  if (form.first_hackathon && form.year_of_study && form.track_preference)
    completedSections.push('additional')

  if (form.code_of_conduct && form.privacy_policy && form.terms_conditions && form.twitter_follow_confirmed)
    completedSections.push('agreements')

  // ─── Validation ────────────────────────────────────────────────────────────

  function validateAll() {
    const errs = {}

    if (!form.full_name || form.full_name.trim().length < 3 || !/^[a-zA-Z\s]+$/.test(form.full_name))
      errs.full_name = 'Please enter your full name (letters only)'
    if (!form.phone || !/^\d{10}$/.test(form.phone))
      errs.phone = 'Enter a valid 10-digit phone number'
    if (!form.age) errs.age = 'Age must be between 16 and 40'
    else if (parseInt(form.age) < 16 || parseInt(form.age) > 40) errs.age = 'Age must be between 16 and 40'
    if (!form.gender) errs.gender = 'Please select your gender'
    if (!form.city || form.city.trim().length < 2) errs.city = 'Please select your city'
    if (!form.state) errs.state = 'Please select your state'
    if (!form.country) errs.country = 'Please select your country'

    if (form.emergency_contact && !/^\d{10}$/.test(form.emergency_contact))
      errs.emergency_contact = 'Enter a valid 10-digit number'
    else if (form.emergency_contact && form.emergency_contact === form.phone)
      errs.emergency_contact = 'Must be different from your phone number'

    if (!form.institution || form.institution.trim().length < 3) errs.institution = 'Please enter your institution name'
    if (!form.degree_type) errs.degree_type = 'Please select your degree type'
    if (!resolvedFieldOfStudy || resolvedFieldOfStudy.trim().length < 2) errs.field_of_study = 'Please enter your field of study'
    if (!form.year_of_study) errs.year_of_study = 'Please select your year of study'
    if (!form.currently_studying) {
      const yr = parseInt(form.year_of_graduation)
      if (!form.year_of_graduation || yr < 2024 || yr > 2030)
        errs.year_of_graduation = 'Enter a valid graduation year between 2024 and 2030'
    }

    if (githubFilled && !validateGitHub(form.github))
      errs.github = 'Enter a valid GitHub username'
    if (linkedinFilled && !validateLinkedIn(form.linkedin))
      errs.linkedin = 'Enter a valid LinkedIn username'

    if (form.role_type.length === 0) errs.role_type = 'Please select your role'
    if (form.skills.length === 0) errs.skills = 'Please add at least one skill'
    else if (form.skills.length > 6) errs.skills = 'Maximum 6 skills allowed'

    if (!form.dietary_preference) errs.dietary_preference = 'Please select your dietary preference'
    if (!form.bio) errs.bio = 'Please write a short bio'

    if (!form.first_hackathon) errs.first_hackathon = 'Required'
    if (!form.track_preference) errs.track_preference = 'Select a track'

    if (!form.code_of_conduct) errs.code_of_conduct = 'You must agree to the code of conduct'
    if (!form.privacy_policy) errs.privacy_policy = 'You must agree to the privacy policy'
    if (!form.terms_conditions) errs.terms_conditions = 'You must agree to the terms and conditions'
    if (!form.twitter_follow_confirmed) errs.twitter_follow_confirmed = 'Please follow us on Twitter/X'

    setErrors(errs)
    return errs
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitAttempted(true)
    const errs = validateAll()
    if (Object.keys(errs).length > 0) {
      toast.error('Please complete all required fields')
      const SECTION_FIELDS = {
        about: ['full_name', 'bio', 'gender', 'age', 'dietary_preference'],
        experience: ['role_type', 'skills'],
        links: ['github', 'linkedin'],
        education: ['degree_type', 'institution', 'field_of_study', 'year_of_study', 'year_of_graduation'],
        contact: ['phone', 'city', 'state', 'country'],
        additional: ['first_hackathon', 'track_preference'],
        agreements: ['code_of_conduct', 'privacy_policy', 'terms_conditions', 'twitter_follow_confirmed'],
      }
      const sectionOrder = ['about', 'experience', 'links', 'education', 'contact', 'additional', 'agreements']
      const firstSection = sectionOrder.find(s => SECTION_FIELDS[s].some(f => errs[f]))
      if (firstSection) {
        setOpenSection(firstSection)
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
      }
      return
    }

    // Read first-touch UTM cookie (set on landing page or AMS root)
    let utmData = {}
    try {
      const raw = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('ff_utm='))
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw.slice('ff_utm='.length)))
        utmData = { utm_source: parsed.s || null, utm_medium: parsed.m || null, utm_campaign: parsed.c || null }
      }
    } catch {}

    setSaving(true)
    try {
      let resume_url = resumeUploaded || null

      if (resumeFile) {
        try {
          const fd = new FormData()
          fd.append('file', resumeFile)
          const res = await fetch('/api/upload-resume', { method: 'POST', body: fd })
          const data = await res.json()
          if (res.ok && data.url) {
            resume_url = data.url
          } else {
            toast.error('Resume upload failed - profile saved without it. Re-upload later.')
          }
        } catch {
          toast.error('Resume upload failed - profile saved without it. Re-upload later.')
        }
      }

      const profileData = {
        email: user.email,
        full_name: form.full_name,
        bio: form.bio,
        gender: form.gender,
        age: parseInt(form.age),
        dietary_preference: form.dietary_preference,
        dietary_restrictions: form.dietary_restrictions.trim() || 'None',
        role_type: form.role_type.join(','),
        skills: form.skills,
        github: githubFilled ? form.github : '',
        linkedin: linkedinFilled ? form.linkedin : '',
        resume_url,
        degree_type: form.degree_type,
        institution: form.institution,
        currently_studying: form.currently_studying,
        field_of_study: resolvedFieldOfStudy,
        year_of_graduation: form.currently_studying ? null : form.year_of_graduation,
        // Store phone with +91 prefix
        phone: form.phone ? '+91' + form.phone : '',
        emergency_contact: form.emergency_contact,
        city: form.city,
        state: form.state,
        country: form.country,
        first_hackathon: form.first_hackathon === 'yes',
        year_of_study: form.year_of_study,
        track_preference: form.track_preference,
        code_of_conduct: form.code_of_conduct,
        privacy_policy: form.privacy_policy,
        terms_conditions: form.terms_conditions,
        email_updates: form.email_updates === 'yes',
        twitter_follow_confirmed: form.twitter_follow_confirmed,
        community_joined: form.community_joined,
        profile_complete: true,
      }

      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profileData, ...utmData })
      if (error) throw error

      try { localStorage.removeItem(DRAFT_KEY) } catch {}

      await sendWelcomeEmail({
        to: user.email,
        userId: user.id,
        name: form.full_name || user.email.split('@')[0],
      }).catch(console.error)

      // Create T&C participation contract via econtracts.ai (non-blocking)
      fetch('/api/contracts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.full_name, acceptedAt: new Date().toISOString() }),
      }).catch(err => console.error('[contracts] T&C contract failed:', err))

      toast.success('Profile saved! Redirecting to team setup...')
      setTimeout(() => router.push('/register/team'), 1000)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 overflow-x-hidden">
      <TermsModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        alreadyAccepted={form.terms_conditions}
        onAccept={async () => {
          set('terms_conditions', true)
          setShowTermsModal(false)
        }}
      />

      <TopNav showUser user={user} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-28 lg:pb-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-foreground">Complete Your Profile</h1>
            <HelpDialog
              title="How to complete your profile"
              sections={[
                {
                  icon: <FileCheck className="w-4 h-4" />,
                  heading: '7 sections to complete',
                  body: 'Fill out About, Experience, Links, Education, Contact, Additional, and Agreements. Each section has its own Save button - your progress is auto-saved as you go.',
                },
                {
                  icon: <Sparkles className="w-4 h-4" />,
                  heading: 'AI resume upload',
                  body: 'Upload your PDF resume at the top and we\'ll auto-fill most fields for you in seconds. You can review and edit everything after.',
                },
                {
                  icon: <Check className="w-4 h-4" />,
                  heading: 'Finishing up',
                  body: 'Once all 7 sections are saved, click "Save & Continue" to move on to the team setup step.',
                },
              ]}
            />
          </div>
          <p className="text-muted-foreground mt-1">Tell us about yourself. Fill all sections to proceed.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="flex-1 min-w-0 w-full space-y-3">

            {/* Resume Autofill Card */}
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Auto-fill your profile with your resume</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Upload your resume and we'll instantly fill in your name, education, skills, role, and bio  -  you can review and edit everything afterwards.
                    </p>
                    <div className="mt-3">
                      <FileUpload value={resumeFile} onChange={handleResumeUpload} label="Upload your resume" />
                      {resumeUploaded && !resumeFile && (
                        <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Resume already uploaded
                        </p>
                      )}
                      {isParsing && (
                        <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 animate-pulse">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Reading your resume and filling your details...</span>
                        </div>
                      )}
                      {parseResult && !isParsing && (
                        <div className="flex items-start gap-3 mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2 duration-500">
                          <span className="text-green-500 text-lg flex-shrink-0">✨</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                              {parseResult.filled} field{parseResult.filled !== 1 ? 's' : ''} filled from your resume!
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                              Fields highlighted in green were auto-filled. Review and complete the rest below.
                            </p>
                          </div>
                          <button type="button" onClick={() => setParseResult(null)} className="ml-auto text-green-400 hover:text-green-600 text-lg leading-none flex-shrink-0">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 1: About */}
            <AccordionSection
              id="about" icon={User} title="About You" isOpen={openSection === 'about'}
              isComplete={completedSections.includes('about')}
              subtitle="Personal details and bio"
              onToggle={toggleSection} onSave={() => handleSectionSave('about')} isSaved={savedSections.about === true}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Full Name *</Label>
                  <Input className={`mt-1.5 transition-all duration-500 ${autofillHighlights.full_name ? 'bg-green-50 dark:bg-green-950/30 !border-green-400 ring-1 ring-green-400' : ''}`} value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    onBlur={() => touch('full_name')} placeholder="Your full name" error={!!fieldError('full_name')} />
                  <FormError message={fieldError('full_name')} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Email</Label>
                  <div className="relative mt-1.5">
                    <Input value={user?.email || ''} readOnly className="pr-24 bg-muted/50 text-muted-foreground" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                      ✓ Verified
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <Label>Bio *</Label>
                <Textarea className={`mt-1.5 transition-all duration-500 ${autofillHighlights.bio ? 'bg-green-50 dark:bg-green-950/30 !border-green-400 ring-1 ring-green-400' : ''}`} value={form.bio} onChange={e => set('bio', e.target.value)}
                  onBlur={() => touch('bio')}
                  placeholder="Tell us about yourself - things you're good at, what drives you, interesting projects you've built."
                  error={!!fieldError('bio')} rows={4} />
                <FormError message={fieldError('bio')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={v => set('gender', v)}>
                    <SelectTrigger className="mt-1.5" error={!!fieldError('gender')}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError message={fieldError('gender')} />
                </div>
                <div>
                  <Label>Age *</Label>
                  <Input className="mt-1.5" type="number" min={16} max={40} value={form.age}
                    onChange={e => set('age', e.target.value)} onBlur={() => touch('age')}
                    placeholder="Your age" error={!!fieldError('age')} />
                  <FormError message={fieldError('age')} />
                </div>
              </div>
              <div>
                <Label>Dietary Preference *</Label>
                <RadioGroup value={form.dietary_preference} onValueChange={v => set('dietary_preference', v)} className="flex gap-4 mt-2">
                  {['Veg', 'Non-Veg'].map(opt => (
                    <Label key={opt} className="flex items-center gap-2 cursor-pointer font-normal">
                      <RadioGroupItem value={opt} />{opt}
                    </Label>
                  ))}
                </RadioGroup>
                <FormError message={fieldError('dietary_preference')} />
              </div>
              <div>
                <Label>Dietary Restrictions / Allergies</Label>
                <Input className="mt-1.5" value={form.dietary_restrictions}
                  onChange={e => set('dietary_restrictions', e.target.value)}
                  placeholder="Leave empty if none" />
              </div>
            </AccordionSection>

            {/* Section 2: Experience */}
            <AccordionSection
              id="experience" icon={Briefcase} title="Experience" isOpen={openSection === 'experience'}
              isComplete={completedSections.includes('experience')}
              subtitle="Your role and skills"
              onToggle={toggleSection} onSave={() => handleSectionSave('experience')} isSaved={savedSections.experience === true}
            >
              <div>
                <Label>Role Type * <span className="text-xs font-normal text-muted-foreground">(select all that apply)</span></Label>
                <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 rounded-md transition-all duration-500 ${autofillHighlights.role_type ? 'outline outline-2 outline-green-400 p-1 bg-green-50 dark:bg-green-950/30' : ''}`}>
                  {ROLE_TYPES.map(role => (
                    <label key={role.value}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                        form.role_type.includes(role.value)
                          ? 'border-primary bg-accent text-primary font-medium'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}>
                      <Checkbox checked={form.role_type.includes(role.value)}
                        onCheckedChange={() => toggleRole(role.value)} className="shrink-0" />
                      {role.label}
                    </label>
                  ))}
                </div>
                <FormError message={fieldError('role_type')} />
              </div>
              <div>
                <Label>Skills * <span className="text-xs font-normal text-muted-foreground">(up to 6 tags)</span></Label>
                <div className={`mt-1.5 rounded-md transition-all duration-500 ${autofillHighlights.skills ? 'ring-1 ring-green-400 bg-green-50 dark:bg-green-950/30' : ''}`}>
                  <TagInput
                    value={form.skills}
                    onChange={v => set('skills', v)}
                    max={6}
                    placeholder="Type a skill and press Enter..."
                    suggestions={SKILL_SUGGESTIONS}
                  />
                </div>
                <FormError message={fieldError('skills')} />
              </div>
            </AccordionSection>

            {/* Section 3: Links */}
            <AccordionSection
              id="links" icon={Link2} title="Links" isOpen={openSection === 'links'}
              isComplete={completedSections.includes('links')}
              subtitle="GitHub and LinkedIn profiles"
              onToggle={toggleSection} onSave={() => handleSectionSave('links')} isSaved={savedSections.links === true}
            >
              {/* GitHub - split prefix input */}
              <div>
                <Label>GitHub Profile</Label>
                <div className={`flex mt-1.5 rounded-md border overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all duration-500 ${fieldError('github') ? 'border-destructive' : autofillHighlights.github ? 'border-green-400 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-400' : 'border-input focus-within:border-primary'}`}>
                  <span className="flex items-center px-3 text-xs text-muted-foreground bg-muted/50 border-r border-input flex-shrink-0 select-none whitespace-nowrap">
                    github.com/
                  </span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={e => set('github', e.target.value ? GITHUB_PREFIX + e.target.value : GITHUB_PREFIX)}
                    onBlur={() => touch('github')}
                    placeholder="username"
                    className="flex-1 min-w-0 px-3 py-2 text-sm font-bold bg-transparent outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                  {githubFilled && linksSaved && validateGitHub(form.github) && (
                    <span className="flex items-center pr-3 text-green-500 text-xs flex-shrink-0">✓</span>
                  )}
                </div>
                <FormError message={fieldError('github')} />
              </div>

              {/* LinkedIn - split prefix input */}
              <div>
                <Label>LinkedIn Profile</Label>
                <div className={`flex mt-1.5 rounded-md border overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all duration-500 ${fieldError('linkedin') ? 'border-destructive' : autofillHighlights.linkedin ? 'border-green-400 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-400' : 'border-input focus-within:border-primary'}`}>
                  <span className="flex items-center px-3 text-xs text-muted-foreground bg-muted/50 border-r border-input flex-shrink-0 select-none whitespace-nowrap">
                    linkedin.com/in/
                  </span>
                  <input
                    type="text"
                    value={linkedinUsername}
                    onChange={e => set('linkedin', e.target.value ? LINKEDIN_PREFIX + e.target.value : LINKEDIN_PREFIX)}
                    onBlur={() => touch('linkedin')}
                    placeholder="username"
                    className="flex-1 min-w-0 px-3 py-2 text-sm font-bold bg-transparent outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                  {linkedinFilled && linksSaved && validateLinkedIn(form.linkedin) && (
                    <span className="flex items-center pr-3 text-green-500 text-xs flex-shrink-0">✓</span>
                  )}
                </div>
                <FormError message={fieldError('linkedin')} />
              </div>
            </AccordionSection>

            {/* Section 4: Education */}
            <AccordionSection
              id="education" icon={GraduationCap} title="Education" isOpen={openSection === 'education'}
              isComplete={completedSections.includes('education')}
              subtitle="Your degree and institution"
              onToggle={toggleSection} onSave={() => handleSectionSave('education')} isSaved={savedSections.education === true}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Degree Type *</Label>
                  <Select value={form.degree_type} onValueChange={v => set('degree_type', v)}>
                    <SelectTrigger className={`mt-1.5 transition-all duration-500 ${autofillHighlights.degree_type ? 'bg-green-50 dark:bg-green-950/30 !border-green-400 ring-1 ring-green-400' : ''}`} error={!!fieldError('degree_type')}><SelectValue placeholder="Select degree" /></SelectTrigger>
                    <SelectContent>
                      {DEGREE_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormError message={fieldError('degree_type')} />
                </div>
                <div>
                  <Label>Field of Study *</Label>
                  <SearchableCombobox
                    className={`mt-1.5 transition-all duration-500 ${autofillHighlights.field_of_study ? 'bg-green-50 dark:bg-green-950/30 ring-1 ring-green-400 rounded-md' : ''}`}
                    options={FIELDS_OF_STUDY}
                    value={form.field_of_study}
                    onChange={v => set('field_of_study', v)}
                    placeholder="Select field of study"
                    searchPlaceholder="Search fields..."
                    error={!!fieldError('field_of_study')}
                  />
                  {form.field_of_study === 'Other' && (
                    <Input className="mt-2" value={fieldOfStudyOther}
                      onChange={e => { setFieldOfStudyOther(e.target.value); markDirty('education') }}
                      placeholder="Specify your field of study" />
                  )}
                  <FormError message={fieldError('field_of_study')} />
                </div>
              </div>
              <div>
                <Label>Educational Institution *</Label>
                <Input className={`mt-1.5 transition-all duration-500 ${autofillHighlights.institution ? 'bg-green-50 dark:bg-green-950/30 !border-green-400 ring-1 ring-green-400' : ''}`} value={form.institution} onChange={e => set('institution', e.target.value)}
                  onBlur={() => touch('institution')} placeholder="Your college / university" error={!!fieldError('institution')} />
                <FormError message={fieldError('institution')} />
              </div>
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <Checkbox checked={form.currently_studying} onCheckedChange={v => set('currently_studying', v)} />
                  <span className="text-sm text-foreground">I am currently studying here</span>
                </label>
              </div>
              {!form.currently_studying && (
                <div>
                  <Label>Year of Graduation</Label>
                  <Select value={form.year_of_graduation} onValueChange={v => set('year_of_graduation', v)}>
                    <SelectTrigger className={`mt-1.5 transition-all duration-500 ${autofillHighlights.year_of_graduation ? 'bg-green-50 dark:bg-green-950/30 !border-green-400 ring-1 ring-green-400' : ''}`}><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {GRADUATION_YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AccordionSection>

            {/* Section 5: Contact */}
            <AccordionSection
              id="contact" icon={Phone} title="Contact" isOpen={openSection === 'contact'}
              isComplete={completedSections.includes('contact')}
              subtitle="Phone, city and emergency contact"
              onToggle={toggleSection} onSave={() => handleSectionSave('contact')} isSaved={savedSections.contact === true}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number * <span className="text-xs font-normal text-muted-foreground">(India)</span></Label>
                  {/* +91 flag prefix group */}
                  <div className={`flex mt-1.5 rounded-md border overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-all duration-500 ${fieldError('phone') ? 'border-destructive' : autofillHighlights.phone ? 'border-green-400 bg-green-50 dark:bg-green-950/30 ring-1 ring-green-400' : 'border-input focus-within:border-primary'}`}>
                    <div className="flex items-center gap-1.5 px-3 bg-muted/50 border-r border-input flex-shrink-0 text-sm text-muted-foreground select-none">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={() => touch('phone')}
                      placeholder="10-digit number"
                      maxLength={10}
                      className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                  <FormError message={fieldError('phone')} />
                </div>
                <div>
                  <Label>Emergency Contact <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
                  <Input className="mt-1.5" type="tel" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)}
                    onBlur={() => touch('emergency_contact')} placeholder="10-digit number" maxLength={10} error={!!fieldError('emergency_contact')} />
                  <FormError message={fieldError('emergency_contact')} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>State *</Label>
                  <SearchableCombobox
                    className="mt-1.5"
                    options={INDIA_STATES}
                    value={form.state}
                    onChange={v => {
                      const newCities = CITIES_BY_STATE[v] || []
                      setForm(prev => ({
                        ...prev,
                        state: v,
                        city: prev.city && newCities.includes(prev.city) ? prev.city : '',
                      }))
                      setTouched(prev => ({ ...prev, state: true }))
                      if (errors.state) setErrors(prev => ({ ...prev, state: '' }))
                    }}
                    placeholder="Select state"
                    searchPlaceholder="Search states..."
                    error={!!fieldError('state')}
                  />
                  <FormError message={fieldError('state')} />
                </div>
                <div>
                  <Label>City *</Label>
                  <SearchableCombobox
                    className="mt-1.5"
                    options={cityOptions}
                    value={form.city}
                    onChange={v => set('city', v)}
                    placeholder={form.state ? 'Select city' : 'Select state first'}
                    searchPlaceholder="Search cities..."
                    error={!!fieldError('city')}
                  />
                  <FormError message={fieldError('city')} />
                </div>
              </div>
              <div>
                <Label>Country of Residence *</Label>
                <Select value={form.country} onValueChange={v => set('country', v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionSection>

            {/* Section 6: Additional */}
            <AccordionSection
              id="additional" icon={HelpCircle} title="Additional Questions" isOpen={openSection === 'additional'}
              isComplete={completedSections.includes('additional')}
              subtitle="Track preference and hackathon details"
              onToggle={toggleSection} onSave={() => handleSectionSave('additional')} isSaved={savedSections.additional === true}
            >
              <div>
                <Label>Is this your first hackathon? *</Label>
                <RadioGroup value={form.first_hackathon} onValueChange={v => set('first_hackathon', v)} className="flex gap-4 mt-2">
                  {[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }].map(opt => (
                    <Label key={opt.value} className="flex items-center gap-2 cursor-pointer font-normal">
                      <RadioGroupItem value={opt.value} />{opt.label}
                    </Label>
                  ))}
                </RadioGroup>
                <FormError message={fieldError('first_hackathon')} />
              </div>
              <div>
                <Label>Year of Study *</Label>
                <RadioGroup value={form.year_of_study} onValueChange={v => set('year_of_study', v)}
                  className={`flex flex-wrap gap-2 mt-2 rounded-md transition-all duration-500 ${autofillHighlights.year_of_study ? 'outline outline-2 outline-green-400 p-1 bg-green-50 dark:bg-green-950/30' : ''}`}>
                  {YEARS_OF_STUDY.map(y => (
                    <Label key={y.value}
                      className={`flex items-center gap-2 cursor-pointer font-normal px-3 py-2 rounded-lg border transition-all ${
                        form.year_of_study === y.value ? 'border-primary bg-accent text-primary' : 'border-border hover:border-primary/50'
                      }`}>
                      <RadioGroupItem value={y.value} className="sr-only" />{y.label}
                    </Label>
                  ))}
                </RadioGroup>
                <FormError message={fieldError('year_of_study')} />
              </div>
              <div>
                <Label>Track Preference *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {TRACKS.map(track => (
                    <label key={track.value}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                        form.track_preference === track.value
                          ? 'border-primary bg-accent text-primary font-medium'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}>
                      <RadioGroup value={form.track_preference} onValueChange={v => set('track_preference', v)}>
                        <RadioGroupItem value={track.value} />
                      </RadioGroup>
                      {track.label}
                    </label>
                  ))}
                </div>
                <FormError message={fieldError('track_preference')} />
              </div>
            </AccordionSection>

            {/* Section 7: Agreements */}
            <AccordionSection
              id="agreements" icon={FileCheck} title="Agreements & Community" isOpen={openSection === 'agreements'}
              isComplete={completedSections.includes('agreements')}
              subtitle="Code of conduct and community channels"
              onToggle={toggleSection} onSave={() => handleSectionSave('agreements')} isSaved={savedSections.agreements === true}
            >
              <div className="space-y-4">
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.code_of_conduct} onCheckedChange={v => set('code_of_conduct', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have read and agree to the{' '}
                      <a href="/code-of-conduct" className="text-green-600 hover:underline font-medium">Code of Conduct</a>
                      <span className="text-destructive ml-1">*</span>
                    </span>
                  </label>
                  <FormError message={fieldError('code_of_conduct')} />
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.privacy_policy} onCheckedChange={v => set('privacy_policy', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have read and agree to the{' '}
                      <a href="/privacy-policy" className="text-green-600 hover:underline font-medium">Privacy Policy</a>
                      <span className="text-destructive ml-1">*</span>
                    </span>
                  </label>
                  <FormError message={fieldError('privacy_policy')} />
                </div>

                <div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={form.terms_conditions}
                      onCheckedChange={() => { if (!form.terms_conditions) setShowTermsModal(true) }}
                      className="mt-0.5 cursor-pointer"
                    />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-green-600 hover:underline font-medium"
                      >
                        Terms & Conditions
                      </button>
                      <span className="text-destructive ml-1">*</span>
                      {form.terms_conditions && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <Check className="w-3 h-3" /> Accepted
                        </span>
                      )}
                    </span>
                  </div>
                  <FormError message={fieldError('terms_conditions')} />
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.twitter_follow_confirmed} onCheckedChange={v => set('twitter_follow_confirmed', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      Follow us on{' '}
                      <a href="https://x.com/_foundersfest" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Twitter/X</a>
                      {' '}and{' '}
                      <a href="https://www.instagram.com/founders.fest/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Instagram</a>
                      {' '}for announcements, prize updates, and live event communication.
                      <span className="text-destructive ml-1">*</span>
                    </span>
                  </label>
                  <FormError message={fieldError('twitter_follow_confirmed')} />
                </div>

                <div>
                  <Label>Email Updates</Label>
                  <RadioGroup value={form.email_updates} onValueChange={v => set('email_updates', v)} className="flex gap-4 mt-2">
                    {[{ value: 'yes', label: 'Yes, keep me updated' }, { value: 'no', label: 'No thanks' }].map(opt => (
                      <Label key={opt.value} className="flex items-center gap-2 cursor-pointer font-normal">
                        <RadioGroupItem value={opt.value} />{opt.label}
                      </Label>
                    ))}
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-1">Get occasional emails about events, career opportunities, and announcements.</p>
                </div>

              </div>
            </AccordionSection>

            {/* Mobile submit - inline below last section */}
            <div className="lg:hidden pt-2 pb-6">
              <Button className="w-full shadow-lg" size="lg" onClick={handleSubmit} loading={saving}>
                Save & Continue ({completedSections.length}/7 complete)
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-20">
              <ProgressSidebar
                completedSections={completedSections}
                onSubmit={handleSubmit}
                loading={saving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
