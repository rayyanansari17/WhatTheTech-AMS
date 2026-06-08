'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
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
import { AlertCircle, Check, ChevronDown, User, Briefcase, Link2, GraduationCap, Phone, HelpCircle, FileCheck, Save } from 'lucide-react'
import TopNav from '@/components/layout/TopNav'
import toast from 'react-hot-toast'

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
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Bioinformatics',
  'Data Science',
  'Artificial Intelligence and Machine Learning',
  'Cybersecurity',
  'Software Engineering',
  'Physics',
  'Mathematics',
  'Statistics',
  'Chemistry',
  'Biology',
  'Commerce / Business Administration',
  'Economics',
  'Finance',
  'Marketing',
  'Management',
  'Law',
  'Medicine / MBBS',
  'Pharmacy',
  'Architecture',
  'Design',
  'Media and Communication',
  'Psychology',
  'Sociology',
  'Political Science',
  'History',
  'English Literature',
  'Other',
]

const DRAFT_KEY = 'wtt_profile_draft'
const GITHUB_PREFIX = 'https://github.com/'
const LINKEDIN_PREFIX = 'https://linkedin.com/in/'

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
      onClick={onClick}
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

function AccordionSection({ id, icon, title, subtitle, isOpen, isComplete, onToggle, onSave, children }) {
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
              <Button type="button" variant="outline" size="sm" onClick={onSave} className="gap-1.5 text-xs h-8">
                <Save className="w-3 h-3" /> Save Progress
              </Button>
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
          phone: profile.phone || '',
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

        // Handle "Other" field of study
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

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
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
  }

  function toggleSection(id) {
    setOpenSection(prev => prev === id ? null : id)
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      toast.success('Draft saved!')
    } catch {
      toast.error('Could not save draft')
    }
  }

  // Derived
  const githubFilled = form.github && form.github !== GITHUB_PREFIX
  const linkedinFilled = form.linkedin && form.linkedin !== LINKEDIN_PREFIX
  const resolvedFieldOfStudy = form.field_of_study === 'Other' ? fieldOfStudyOther : form.field_of_study
  const cityOptions = form.state ? (CITIES_BY_STATE[form.state] || []) : Object.values(CITIES_BY_STATE).flat().sort()

  // ─── Completion checks ────────────────────────────────────────────────────

  const completedSections = []

  if (form.full_name && form.bio && form.gender && form.age && form.dietary_preference)
    completedSections.push('about')

  if (form.role_type.length > 0 && form.skills.length > 0)
    completedSections.push('experience')

  completedSections.push('links') // optional, always complete

  if (form.degree_type && form.institution && resolvedFieldOfStudy)
    completedSections.push('education')

  if (form.phone && validatePhone(form.phone) && form.emergency_contact && validatePhone(form.emergency_contact) && form.city && form.state)
    completedSections.push('contact')

  if (form.first_hackathon && form.year_of_study && form.track_preference)
    completedSections.push('additional')

  if (form.code_of_conduct && form.privacy_policy && form.terms_conditions && form.twitter_follow_confirmed && form.community_joined)
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

    if (!form.emergency_contact || !/^\d{10}$/.test(form.emergency_contact))
      errs.emergency_contact = 'Enter a valid 10-digit emergency contact number'
    else if (form.emergency_contact === form.phone)
      errs.emergency_contact = 'Emergency contact must be different from your phone number'

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
      errs.github = 'Enter a valid GitHub URL e.g. https://github.com/username'
    if (linkedinFilled && !validateLinkedIn(form.linkedin))
      errs.linkedin = 'Enter a valid LinkedIn URL e.g. https://linkedin.com/in/username'

    if (form.role_type.length === 0) errs.role_type = 'Please select your role'
    if (form.skills.length === 0) errs.skills = 'Please add at least one skill'
    else if (form.skills.length > 10) errs.skills = 'Maximum 10 skills allowed'

    if (!form.dietary_preference) errs.dietary_preference = 'Please select your dietary preference'
    if (!form.bio) errs.bio = 'Please write a short bio'

    if (!form.first_hackathon) errs.first_hackathon = 'Required'
    if (!form.track_preference) errs.track_preference = 'Select a track'

    if (!form.code_of_conduct) errs.code_of_conduct = 'You must agree to the code of conduct'
    if (!form.privacy_policy) errs.privacy_policy = 'You must agree to the privacy policy'
    if (!form.terms_conditions) errs.terms_conditions = 'You must agree to the terms and conditions'
    if (!form.twitter_follow_confirmed) errs.twitter_follow_confirmed = 'Please follow us on Twitter/X'
    if (!form.community_joined) errs.community_joined = 'Please join our community channel'

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
        contact: ['phone', 'emergency_contact', 'city', 'state'],
        additional: ['first_hackathon', 'track_preference'],
        agreements: ['code_of_conduct', 'privacy_policy', 'terms_conditions', 'twitter_follow_confirmed', 'community_joined'],
      }
      const sectionOrder = ['about', 'experience', 'links', 'education', 'contact', 'additional', 'agreements']
      const firstSection = sectionOrder.find(s => SECTION_FIELDS[s].some(f => errs[f]))
      if (firstSection) {
        setOpenSection(firstSection)
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
      }
      return
    }

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
            toast.error('Resume upload failed — profile saved without it. Re-upload later.')
          }
        } catch {
          toast.error('Resume upload failed — profile saved without it. Re-upload later.')
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
        phone: form.phone,
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

      console.log('Profile upsert payload:', { id: user.id, ...profileData })
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profileData })
      if (error) throw error

      try { localStorage.removeItem(DRAFT_KEY) } catch {}

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
    <div className="min-h-screen bg-muted/30">
      <TopNav showUser user={user} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-1">Tell us about yourself. Fill all sections to proceed.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-3">

            {/* Section 1: About */}
            <AccordionSection
              id="about" icon={User} title="About You" isOpen={openSection === 'about'}
              isComplete={completedSections.includes('about')}
              subtitle="Personal details and bio"
              onToggle={toggleSection} onSave={saveDraft}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Full Name *</Label>
                  <Input className="mt-1.5" value={form.full_name} onChange={e => set('full_name', e.target.value)}
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
                <Textarea className="mt-1.5" value={form.bio} onChange={e => set('bio', e.target.value)}
                  onBlur={() => touch('bio')}
                  placeholder="Tell us about yourself — things you're good at, what drives you, interesting projects you've built."
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
              subtitle="Your role, skills and resume"
              onToggle={toggleSection} onSave={saveDraft}
            >
              <div>
                <Label>Role Type * <span className="text-xs font-normal text-muted-foreground">(select all that apply)</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
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
                <Label>Skills * <span className="text-xs font-normal text-muted-foreground">(up to 10 tags)</span></Label>
                <div className="mt-1.5">
                  <TagInput value={form.skills} onChange={v => set('skills', v)} max={10}
                    placeholder="Type a skill and press Enter..." />
                </div>
                <FormError message={fieldError('skills')} />
              </div>
              <div>
                <Label>Resume <span className="text-xs font-normal text-muted-foreground">(PDF, max 5MB)</span></Label>
                <div className="mt-1.5">
                  <FileUpload value={resumeFile} onChange={setResumeFile} label="Upload your resume" />
                  {resumeUploaded && !resumeFile && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Resume already uploaded
                    </p>
                  )}
                </div>
              </div>
            </AccordionSection>

            {/* Section 3: Links */}
            <AccordionSection
              id="links" icon={Link2} title="Links" isOpen={openSection === 'links'}
              isComplete={completedSections.includes('links')}
              subtitle="GitHub and LinkedIn profiles"
              onToggle={toggleSection} onSave={saveDraft}
            >
              <div>
                <Label>GitHub Profile</Label>
                <div className="relative mt-1.5">
                  <Input value={form.github} onChange={e => set('github', e.target.value)}
                    onBlur={() => touch('github')}
                    error={!!fieldError('github')}
                    className={githubFilled && validateGitHub(form.github) ? 'border-green-400 focus-visible:border-green-400' : ''} />
                  {githubFilled && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${validateGitHub(form.github) ? 'text-green-500' : 'text-destructive'}`}>
                      {validateGitHub(form.github) ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  )}
                </div>
                <FormError message={fieldError('github')} />
              </div>
              <div>
                <Label>LinkedIn Profile</Label>
                <div className="relative mt-1.5">
                  <Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)}
                    onBlur={() => touch('linkedin')}
                    error={!!fieldError('linkedin')}
                    className={linkedinFilled && validateLinkedIn(form.linkedin) ? 'border-green-400 focus-visible:border-green-400' : ''} />
                  {linkedinFilled && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${validateLinkedIn(form.linkedin) ? 'text-green-500' : 'text-destructive'}`}>
                      {validateLinkedIn(form.linkedin) ? '✓ Valid' : '✗ Invalid'}
                    </span>
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
              onToggle={toggleSection} onSave={saveDraft}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Degree Type *</Label>
                  <Select value={form.degree_type} onValueChange={v => set('degree_type', v)}>
                    <SelectTrigger className="mt-1.5" error={!!fieldError('degree_type')}><SelectValue placeholder="Select degree" /></SelectTrigger>
                    <SelectContent>
                      {DEGREE_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormError message={fieldError('degree_type')} />
                </div>
                <div>
                  <Label>Field of Study *</Label>
                  <SearchableCombobox
                    className="mt-1.5"
                    options={FIELDS_OF_STUDY}
                    value={form.field_of_study}
                    onChange={v => set('field_of_study', v)}
                    placeholder="Select field of study"
                    searchPlaceholder="Search fields..."
                    error={!!fieldError('field_of_study')}
                  />
                  {form.field_of_study === 'Other' && (
                    <Input className="mt-2" value={fieldOfStudyOther}
                      onChange={e => setFieldOfStudyOther(e.target.value)}
                      placeholder="Specify your field of study" />
                  )}
                  <FormError message={fieldError('field_of_study')} />
                </div>
              </div>
              <div>
                <Label>Educational Institution *</Label>
                <Input className="mt-1.5" value={form.institution} onChange={e => set('institution', e.target.value)}
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
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select year" /></SelectTrigger>
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
              onToggle={toggleSection} onSave={saveDraft}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number * <span className="text-xs font-normal text-muted-foreground">(+91)</span></Label>
                  <Input className="mt-1.5" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    onBlur={() => touch('phone')} placeholder="10-digit mobile number" maxLength={10} error={!!fieldError('phone')} />
                  <FormError message={fieldError('phone')} />
                </div>
                <div>
                  <Label>Emergency Contact *</Label>
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
                <Label>Country of Residence</Label>
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
              onToggle={toggleSection} onSave={saveDraft}
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
                <RadioGroup value={form.year_of_study} onValueChange={v => set('year_of_study', v)} className="flex flex-wrap gap-2 mt-2">
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
              onToggle={toggleSection} onSave={saveDraft}
            >
              <div className="space-y-4">
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.code_of_conduct} onCheckedChange={v => set('code_of_conduct', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have read and agree to the{' '}
                      <a href="/code-of-conduct" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Code of Conduct</a>
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
                      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Privacy Policy</a>
                      <span className="text-destructive ml-1">*</span>
                    </span>
                  </label>
                  <FormError message={fieldError('privacy_policy')} />
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.terms_conditions} onCheckedChange={v => set('terms_conditions', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have read and agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Terms & Conditions</a>
                      <span className="text-destructive ml-1">*</span>
                    </span>
                  </label>
                  <FormError message={fieldError('terms_conditions')} />
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.twitter_follow_confirmed} onCheckedChange={v => set('twitter_follow_confirmed', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      Follow us on{' '}
                      <a href="https://x.com/foundersfest" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Twitter/X</a>
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

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={form.community_joined} onCheckedChange={v => set('community_joined', v)} className="mt-0.5" />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have joined the official{' '}
                      <a href="https://discord.gg/foundersfest" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">Discord</a>
                      {' '}/{' '}
                      <a href="https://chat.whatsapp.com/foundersfest" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">WhatsApp</a>
                      {' '}community channel.
                      <span className="text-destructive ml-1">*</span>
                    </span>
                  </label>
                  <div className="note-warning mt-2 ml-7">
                    ⚠️ <strong>This is mandatory</strong> — all communication, announcements, and support will be provided exclusively through Discord/WhatsApp.
                  </div>
                  <FormError message={fieldError('community_joined')} />
                </div>
              </div>
            </AccordionSection>
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

        {/* Mobile submit */}
        <div className="lg:hidden mt-6 sticky bottom-4">
          <Button className="w-full shadow-lg" size="lg" onClick={handleSubmit} loading={saving}>
            Save & Continue ({completedSections.length}/7 complete)
          </Button>
        </div>
      </div>
    </div>
  )
}
