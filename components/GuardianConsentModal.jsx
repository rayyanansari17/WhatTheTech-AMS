'use client'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, ChevronDown } from 'lucide-react'

const CONSENT_SECTIONS = [
  {
    title: '1. About This Consent',
    body: 'This form is required for participants who are currently enrolled in school (11th or 12th grade). A parent or legal guardian must read, acknowledge, and accept the terms below on behalf of the participant before registration can be completed.',
  },
  {
    title: '2. Participant Details',
    body: 'The participant named in this registration is a school student who wishes to take part in the Founders Fest What The Tech Hackathon at Gachibowli Indoor Stadium, Hyderabad, scheduled for August 6 to 7, 2026. By completing this form, the parent or guardian confirms the participant\'s identity and eligibility.',
  },
  {
    title: '3. Event Overview',
    body: 'What The Tech is a 36-hour student hackathon open to participants of all education levels. The event takes place at an indoor venue in Hyderabad with organisers, mentors, and volunteers present throughout. Meals, beverages, and basic first aid will be available on-site. Participation is voluntary.',
  },
  {
    title: '4. Supervision and Responsibility',
    items: [
      'The organising team will maintain a safe and inclusive environment throughout the event.',
      'Participants are expected to follow the Code of Conduct at all times.',
      'Parents and guardians are responsible for ensuring the participant can attend and travel safely.',
      'The organisers do not provide overnight or off-site supervision.',
      'In the event of a medical situation, the emergency contact provided below will be notified.',
    ],
  },
  {
    title: '5. Photography and Media',
    body: 'By granting consent, you acknowledge that the participant may be photographed or filmed during the event. These images and videos may be used by Founders Fest for promotional purposes including social media posts, website content, and press coverage. If you object to this, notify an organiser at the venue on arrival.',
  },
  {
    title: '6. Liability Waiver',
    body: 'Founders Fest and its organisers, volunteers, and sponsors are not liable for any personal injury, loss, theft, or damage to property arising from the participant\'s attendance at the event. The parent or guardian accepts this limitation of liability on behalf of the minor participant.',
  },
  {
    title: '7. Emergency Contact Authorisation',
    body: 'By submitting this consent form, the parent or guardian authorises organisers to contact them immediately in the event of a medical emergency, accident, or serious concern involving the participant. The contact details provided in this form will be used for this purpose.',
  },
  {
    title: '8. Governing Terms',
    body: 'This consent is governed by the main Terms and Conditions of the event, which the participant will also review and accept during registration. These terms are available at app.foundersfest.org. Continued participation constitutes acceptance of both this consent and those terms.',
  },
]

export function GuardianConsentModal({ open, onAccept }) {
  const [reachedBottom, setReachedBottom] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [guardianName, setGuardianName]   = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [fieldErrors, setFieldErrors]     = useState({})
  const scrollRef = useRef(null)

  useEffect(() => {
    if (open) {
      setReachedBottom(false)
      setAccepting(false)
      setGuardianName('')
      setGuardianPhone('')
      setGuardianEmail('')
      setFieldErrors({})
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }
  }, [open])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 60) setReachedBottom(true)
  }

  const phoneValid = /^\d{10}$/.test(guardianPhone)
  const emailValid = guardianEmail.includes('@') && guardianEmail.includes('.')
  const fieldsReady = guardianName.trim().length >= 2 && phoneValid && emailValid
  const canAccept = reachedBottom && fieldsReady

  function validateFields() {
    const errs = {}
    if (!guardianName.trim() || guardianName.trim().length < 2) errs.name = 'Enter guardian\'s full name'
    if (!phoneValid) errs.phone = 'Enter a valid 10-digit number'
    if (!emailValid) errs.email = 'Enter a valid email address'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleAccept() {
    if (!validateFields()) return
    if (!reachedBottom) return
    setAccepting(true)
    await onAccept({ guardianName: guardianName.trim(), guardianPhone, guardianEmail: guardianEmail.trim() })
    setAccepting(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl flex flex-col gap-0 p-0 overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onInteractOutside={e => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-lg font-bold">Parental / Guardian Consent</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Required for school students · What The Tech Hackathon · Founders Fest
          </p>
        </DialogHeader>

        {!reachedBottom && (
          <div className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex-shrink-0">
            <ChevronDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Please read through to the bottom, then fill in your details to accept
            </span>
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0"
        >
          {CONSENT_SECTIONS.map(s => (
            <section key={s.title}>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{s.title}</h3>
              {s.body && (
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              )}
              {s.items && (
                <ul className="list-disc pl-5 space-y-1">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed">{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* Guardian contact form - at bottom of scroll so it's encountered after reading */}
          <div className="border border-border rounded-xl p-5 space-y-4 bg-muted/30">
            <div>
              <p className="text-sm font-semibold text-foreground">Guardian's Contact Details</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This information will be used as the emergency contact for the participant during the event.
              </p>
            </div>
            <div>
              <Label htmlFor="g-name" className="text-sm">Guardian's Full Name *</Label>
              <Input
                id="g-name"
                className="mt-1.5"
                value={guardianName}
                onChange={e => { setGuardianName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })) }}
                placeholder="Parent or guardian's full name"
              />
              {fieldErrors.name && <p className="text-xs text-destructive mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="g-phone" className="text-sm">Guardian's Phone *</Label>
              <div className="flex mt-1.5">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-sm text-muted-foreground select-none">+91</span>
                <Input
                  id="g-phone"
                  value={guardianPhone}
                  onChange={e => { setGuardianPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFieldErrors(p => ({ ...p, phone: '' })) }}
                  placeholder="10-digit number"
                  className="rounded-l-none"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
              {fieldErrors.phone && <p className="text-xs text-destructive mt-1">{fieldErrors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="g-email" className="text-sm">Guardian's Email *</Label>
              <Input
                id="g-email"
                className="mt-1.5"
                type="email"
                value={guardianEmail}
                onChange={e => { setGuardianEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })) }}
                placeholder="parent@example.com"
              />
              {fieldErrors.email && <p className="text-xs text-destructive mt-1">{fieldErrors.email}</p>}
            </div>
          </div>

          <div className="h-1" />
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs text-muted-foreground max-w-xs">
            {!reachedBottom
              ? 'Scroll through all sections, then complete the form above.'
              : !fieldsReady
              ? 'Fill in the guardian\'s contact details above to continue.'
              : 'Ready to accept on behalf of your child.'}
          </span>
          <Button
            size="sm"
            disabled={!canAccept || accepting}
            onClick={handleAccept}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px] flex-shrink-0"
          >
            {accepting ? (
              'Submitting...'
            ) : canAccept ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> I Accept
              </span>
            ) : (
              'Read to Accept'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
