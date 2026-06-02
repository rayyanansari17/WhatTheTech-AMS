'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import TagInput from '@/components/ui/tag-input'
import FileUpload from '@/components/ui/file-upload'
import ProgressSidebar from '@/components/participant/ProgressSidebar'
import { Card, CardContent } from '@/components/ui/card'
import {
  TRACKS, ROLE_TYPES, DEGREE_TYPES, TSHIRT_SIZES, YEARS_OF_STUDY, GRADUATION_YEARS
} from '@/lib/constants'
import { validateGitHub, validateLinkedIn, validatePhone } from '@/lib/utils'
import { AlertCircle, Check, ChevronDown, User, Briefcase, Link2, GraduationCap, Phone, HelpCircle, FileCheck } from 'lucide-react'
import TopNav from '@/components/layout/TopNav'
import toast from 'react-hot-toast'

function FormError({ message }) {
  if (!message) return null
  return (
    <p className="text-destructive text-xs mt-1.5 flex items-center gap-1">
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

function AccordionSection({ id, icon, title, subtitle, isOpen, isComplete, onToggle, children }) {
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
          </div>
        </CardContent>
      )}
    </Card>
  )
}

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

  const [form, setForm] = useState({
    full_name: '', bio: '', gender: '', age: '', dietary_preference: '', dietary_restrictions: '',
    role_type: [], skills: [], github: '', linkedin: '',
    degree_type: '', institution: '', currently_studying: true, field_of_study: '', year_of_graduation: '',
    phone: '', emergency_contact: '', city: '', state: '', country: 'India',
    first_hackathon: '', year_of_study: '', track_preference: '', tshirt_size: '',
    code_of_conduct: false, privacy_policy: false, terms_conditions: false,
    email_updates: '', twitter_follow_confirmed: false, community_joined: false,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/register'); return }
      setUser(user)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setForm(prev => ({
          ...prev,
          full_name: profile.full_name || user.user_metadata?.full_name || '',
          bio: profile.bio || '',
          gender: profile.gender || '',
          age: profile.age || '',
          dietary_preference: profile.dietary_preference || '',
          dietary_restrictions: profile.dietary_restrictions || '',
          role_type: profile.role_type ? profile.role_type.split(',').filter(Boolean) : [],
          skills: profile.skills || [],
          github: profile.github || '',
          linkedin: profile.linkedin || '',
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
          tshirt_size: profile.tshirt_size || '',
          code_of_conduct: profile.code_of_conduct || false,
          privacy_policy: profile.privacy_policy || false,
          terms_conditions: profile.terms_conditions || false,
          email_updates: profile.email_updates === true ? 'yes' : profile.email_updates === false ? 'no' : '',
          twitter_follow_confirmed: profile.twitter_follow_confirmed || false,
          community_joined: profile.community_joined || false,
        }))
        if (profile.resume_url) setResumeUploaded(profile.resume_url)
      } else {
        setForm(prev => ({
          ...prev,
          full_name: user.user_metadata?.full_name || '',
        }))
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
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

  // Determine which sections are complete
  const completedSections = []

  const aboutComplete = form.full_name && form.bio && form.bio.length >= 50 && form.gender && form.age && form.dietary_preference
  if (aboutComplete) completedSections.push('about')

  const expComplete = form.role_type.length > 0 && form.skills.length > 0
  if (expComplete) completedSections.push('experience')

  const linksComplete = true // optional section, always complete
  completedSections.push('links')

  const eduComplete = form.degree_type && form.institution && form.field_of_study
  if (eduComplete) completedSections.push('education')

  const contactComplete = form.phone && validatePhone(form.phone) && form.emergency_contact && validatePhone(form.emergency_contact) && form.city && form.state
  if (contactComplete) completedSections.push('contact')

  const addlComplete = form.first_hackathon && form.year_of_study && form.track_preference && form.tshirt_size
  if (addlComplete) completedSections.push('additional')

  const agreementsComplete = form.code_of_conduct && form.privacy_policy && form.terms_conditions && form.twitter_follow_confirmed && form.community_joined
  if (agreementsComplete) completedSections.push('agreements')

  function validateAll() {
    const errs = {}
    if (!form.full_name) errs.full_name = 'Full name is required'
    if (!form.bio || form.bio.length < 50) errs.bio = 'Bio must be at least 50 characters'
    if (!form.gender) errs.gender = 'Please select your gender'
    if (!form.age) errs.age = 'Age is required'
    else if (form.age < 16 || form.age > 60) errs.age = 'Age must be between 16 and 60'
    if (!form.dietary_preference) errs.dietary_preference = 'Please select dietary preference'
    if (form.role_type.length === 0) errs.role_type = 'Select at least one role'
    if (form.skills.length === 0) errs.skills = 'Add at least one skill'
    if (form.github && !validateGitHub(form.github)) errs.github = 'Invalid GitHub URL'
    if (form.linkedin && !validateLinkedIn(form.linkedin)) errs.linkedin = 'Invalid LinkedIn URL'
    if (!form.degree_type) errs.degree_type = 'Select degree type'
    if (!form.institution) errs.institution = 'Institution is required'
    if (!form.field_of_study) errs.field_of_study = 'Field of study is required'
    if (!form.phone) errs.phone = 'Phone number is required'
    else if (!validatePhone(form.phone)) errs.phone = 'Enter valid 10-digit number'
    if (!form.emergency_contact) errs.emergency_contact = 'Emergency contact is required'
    else if (!validatePhone(form.emergency_contact)) errs.emergency_contact = 'Enter valid 10-digit number'
    else if (form.emergency_contact === form.phone) errs.emergency_contact = 'Must differ from your phone'
    if (!form.city) errs.city = 'City is required'
    if (!form.state) errs.state = 'State is required'
    if (!form.first_hackathon) errs.first_hackathon = 'Required'
    if (!form.year_of_study) errs.year_of_study = 'Required'
    if (!form.track_preference) errs.track_preference = 'Select a track'
    if (!form.tshirt_size) errs.tshirt_size = 'Select T-shirt size'
    if (!form.code_of_conduct) errs.code_of_conduct = 'You must agree to the Code of Conduct'
    if (!form.privacy_policy) errs.privacy_policy = 'You must agree to the Privacy Policy'
    if (!form.terms_conditions) errs.terms_conditions = 'You must agree to the Terms & Conditions'
    if (!form.twitter_follow_confirmed) errs.twitter_follow_confirmed = 'Please follow us on Twitter/X'
    if (!form.community_joined) errs.community_joined = 'Please join our community channel'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validateAll()) {
      toast.error('Please complete all required fields')
      // Open first section with error
      const sectionOrder = ['about', 'experience', 'links', 'education', 'contact', 'additional', 'agreements']
      const errFields = Object.keys(errors)
      // Find which section has error
      setOpenSection(sectionOrder[0])
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
            toast.error('Resume upload failed — your profile will be saved without it. You can re-upload later.')
          }
        } catch {
          toast.error('Resume upload failed — your profile will be saved without it. You can re-upload later.')
        }
      }

      const profileData = {
        email: user.email,
        full_name: form.full_name,
        bio: form.bio,
        gender: form.gender,
        age: parseInt(form.age),
        dietary_preference: form.dietary_preference,
        dietary_restrictions: form.dietary_restrictions,
        role_type: form.role_type.join(','),
        skills: form.skills,
        github: form.github,
        linkedin: form.linkedin,
        resume_url,
        degree_type: form.degree_type,
        institution: form.institution,
        currently_studying: form.currently_studying,
        field_of_study: form.field_of_study,
        year_of_graduation: form.currently_studying ? null : form.year_of_graduation,
        phone: form.phone,
        emergency_contact: form.emergency_contact,
        city: form.city,
        state: form.state,
        country: form.country,
        first_hackathon: form.first_hackathon === 'yes',
        year_of_study: form.year_of_study,
        track_preference: form.track_preference,
        tshirt_size: form.tshirt_size,
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

      toast.success('Profile saved! Redirecting to team setup...')
      setTimeout(() => router.push('/register/team'), 1000)
    } catch (err) {
      toast.error(err.message || 'Failed to save profile')
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
          {/* Form sections */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Section 1: About */}
            <AccordionSection
              id="about" icon={User} title="About You" isOpen={openSection === 'about'}
              isComplete={completedSections.includes('about')}
              subtitle="Personal details and bio"
              onToggle={toggleSection}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Full Name *</Label>
                  <Input className="mt-1.5" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    placeholder="Your full name" error={!!errors.full_name} />
                  <FormError message={errors.full_name} />
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
                  placeholder="Tell us about yourself — things you're good at, what drives you, interesting projects you've built. (min 50 chars)"
                  error={!!errors.bio} rows={4} />
                <div className="flex justify-between mt-1">
                  <FormError message={errors.bio} />
                  <span className={`text-xs ml-auto ${form.bio.length < 50 ? 'text-muted-foreground' : 'text-green-600'}`}>
                    {form.bio.length}/50+
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <Select value={form.gender} onValueChange={v => set('gender', v)}>
                    <SelectTrigger className="mt-1.5" error={!!errors.gender}><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError message={errors.gender} />
                </div>
                <div>
                  <Label>Age *</Label>
                  <Input className="mt-1.5" type="number" min={16} max={60} value={form.age}
                    onChange={e => set('age', e.target.value)} placeholder="Your age" error={!!errors.age} />
                  <FormError message={errors.age} />
                </div>
              </div>
              <div>
                <Label>Dietary Preference *</Label>
                <RadioGroup value={form.dietary_preference} onValueChange={v => set('dietary_preference', v)}
                  className="flex gap-4 mt-2">
                  {['Veg', 'Non-Veg'].map(opt => (
                    <Label key={opt} className="flex items-center gap-2 cursor-pointer font-normal">
                      <RadioGroupItem value={opt} />
                      {opt}
                    </Label>
                  ))}
                </RadioGroup>
                <FormError message={errors.dietary_preference} />
              </div>
              <div>
                <Label>Dietary Restrictions / Allergies</Label>
                <Input className="mt-1.5" value={form.dietary_restrictions} onChange={e => set('dietary_restrictions', e.target.value)}
                  placeholder="Any allergies or medical conditions we should know about?" />
              </div>
            </AccordionSection>

            {/* Section 2: Experience */}
            <AccordionSection
              id="experience" icon={Briefcase} title="Experience" isOpen={openSection === 'experience'}
              isComplete={completedSections.includes('experience')}
              subtitle="Your role, skills and resume"
              onToggle={toggleSection}
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
                      <Checkbox
                        checked={form.role_type.includes(role.value)}
                        onCheckedChange={() => toggleRole(role.value)}
                        className="shrink-0"
                      />
                      {role.label}
                    </label>
                  ))}
                </div>
                <FormError message={errors.role_type} />
              </div>
              <div>
                <Label>Skills * <span className="text-xs font-normal text-muted-foreground">(up to 5 tags)</span></Label>
                <div className="mt-1.5">
                  <TagInput value={form.skills} onChange={v => set('skills', v)} max={5}
                    placeholder="e.g. React, Python, Figma..." />
                </div>
                <FormError message={errors.skills} />
              </div>
              <div>
                <Label>Resume <span className="text-xs font-normal text-muted-foreground">(PDF, max 5MB)</span></Label>
                <div className="mt-1.5">
                  <FileUpload
                    value={resumeFile}
                    onChange={setResumeFile}
                    label="Upload your resume"
                  />
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
              onToggle={toggleSection}
            >
              <div>
                <Label>GitHub Profile</Label>
                <div className="relative mt-1.5">
                  <Input value={form.github} onChange={e => set('github', e.target.value)}
                    placeholder="github.com/username"
                    error={!!errors.github}
                    className={form.github && validateGitHub(form.github) ? 'border-green-400 focus-visible:border-green-400' : ''} />
                  {form.github && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${validateGitHub(form.github) ? 'text-green-500' : 'text-destructive'}`}>
                      {validateGitHub(form.github) ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  )}
                </div>
                <FormError message={errors.github} />
              </div>
              <div>
                <Label>LinkedIn Profile</Label>
                <div className="relative mt-1.5">
                  <Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/username"
                    error={!!errors.linkedin}
                    className={form.linkedin && validateLinkedIn(form.linkedin) ? 'border-green-400 focus-visible:border-green-400' : ''} />
                  {form.linkedin && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${validateLinkedIn(form.linkedin) ? 'text-green-500' : 'text-destructive'}`}>
                      {validateLinkedIn(form.linkedin) ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  )}
                </div>
                <FormError message={errors.linkedin} />
              </div>
            </AccordionSection>

            {/* Section 4: Education */}
            <AccordionSection
              id="education" icon={GraduationCap} title="Education" isOpen={openSection === 'education'}
              isComplete={completedSections.includes('education')}
              subtitle="Your degree and institution"
              onToggle={toggleSection}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Degree Type *</Label>
                  <Select value={form.degree_type} onValueChange={v => set('degree_type', v)}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select degree" /></SelectTrigger>
                    <SelectContent>
                      {DEGREE_TYPES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormError message={errors.degree_type} />
                </div>
                <div>
                  <Label>Field of Study *</Label>
                  <Input className="mt-1.5" value={form.field_of_study} onChange={e => set('field_of_study', e.target.value)}
                    placeholder="e.g. Computer Science" error={!!errors.field_of_study} />
                  <FormError message={errors.field_of_study} />
                </div>
              </div>
              <div>
                <Label>Educational Institution *</Label>
                <Input className="mt-1.5" value={form.institution} onChange={e => set('institution', e.target.value)}
                  placeholder="Your college / university" error={!!errors.institution} />
                <FormError message={errors.institution} />
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
              onToggle={toggleSection}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number * <span className="text-xs font-normal text-muted-foreground">(+91)</span></Label>
                  <Input className="mt-1.5" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="10-digit mobile number" maxLength={10} error={!!errors.phone} />
                  <FormError message={errors.phone} />
                </div>
                <div>
                  <Label>Emergency Contact *</Label>
                  <Input className="mt-1.5" type="tel" value={form.emergency_contact} onChange={e => set('emergency_contact', e.target.value)}
                    placeholder="10-digit number" maxLength={10} error={!!errors.emergency_contact} />
                  <FormError message={errors.emergency_contact} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input className="mt-1.5" value={form.city} onChange={e => set('city', e.target.value)}
                    placeholder="Your city" error={!!errors.city} />
                  <FormError message={errors.city} />
                </div>
                <div>
                  <Label>State *</Label>
                  <Input className="mt-1.5" value={form.state} onChange={e => set('state', e.target.value)}
                    placeholder="Your state" error={!!errors.state} />
                  <FormError message={errors.state} />
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
              onToggle={toggleSection}
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
                <FormError message={errors.first_hackathon} />
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
                <FormError message={errors.year_of_study} />
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
                <FormError message={errors.track_preference} />
              </div>
              <div>
                <Label>T-shirt Size *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TSHIRT_SIZES.map(size => (
                    <button key={size} type="button"
                      onClick={() => set('tshirt_size', size)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        form.tshirt_size === size
                          ? 'border-primary bg-accent text-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
                <FormError message={errors.tshirt_size} />
              </div>
            </AccordionSection>

            {/* Section 7: Agreements */}
            <AccordionSection
              id="agreements" icon={FileCheck} title="Agreements & Community" isOpen={openSection === 'agreements'}
              isComplete={completedSections.includes('agreements')}
              subtitle="Code of conduct and community channels"
              onToggle={toggleSection}
            >
              <div className="space-y-4">
                {[
                  { key: 'code_of_conduct', label: 'I have read and agree to the Code of Conduct', required: true },
                  { key: 'privacy_policy', label: 'I have read and agree to the Privacy Policy', required: true },
                  { key: 'terms_conditions', label: 'I have read and agree to the Terms & Conditions', required: true },
                  { key: 'twitter_follow_confirmed', label: 'Follow us on Twitter/X for announcements, prize updates, and live event communication.', required: true },
                ].map(item => (
                  <div key={item.key}>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={form[item.key]}
                        onCheckedChange={v => set(item.key, v)}
                        className="mt-0.5"
                      />
                      <span className="text-sm text-foreground leading-relaxed">
                        {item.label}
                        {item.required && <span className="text-destructive ml-1">*</span>}
                      </span>
                    </label>
                    <FormError message={errors[item.key]} />
                  </div>
                ))}

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
                    <Checkbox
                      checked={form.community_joined}
                      onCheckedChange={v => set('community_joined', v)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-foreground leading-relaxed">
                      I have joined the official Discord/WhatsApp community channel. <span className="text-destructive">*</span>
                    </span>
                  </label>
                  <div className="note-warning mt-2 ml-7">
                    ⚠️ <strong>This is mandatory</strong> — all communication, announcements, and support will be provided exclusively through Discord/WhatsApp.
                  </div>
                  <FormError message={errors.community_joined} />
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
          <Button
            className="w-full shadow-lg"
            size="lg"
            onClick={handleSubmit}
            loading={saving}
          >
            Save & Continue ({completedSections.length}/7 complete)
          </Button>
        </div>
      </div>
    </div>
  )
}
