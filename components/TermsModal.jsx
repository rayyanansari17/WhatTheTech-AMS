'use client'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronDown } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Eligibility',
    body: 'What The Tech is open to students and recent graduates (within 1 year) from any recognised educational institution. Participants must be at least 16 years of age. Organisers, judges, mentors, and sponsors are not eligible to participate as hackers.',
  },
  {
    title: '2. Registration and Payment',
    items: [
      'Registration is complete only after payment is received. Unpaid registrations may be released.',
      'Payment is ₹299 per person. Teams of 5 pay ₹1,299 (a bundled rate).',
      'Payments are non-refundable except in the event of cancellation by the organisers.',
      'If the event is cancelled, a full refund will be issued within 10 business days.',
    ],
  },
  {
    title: '3. Teams',
    items: [
      'Teams must have a minimum of 1 and a maximum of 5 members.',
      'All team members must be individually registered.',
      'Team changes are not permitted after the registration deadline.',
      'The team leader is responsible for completing payment on behalf of the team.',
    ],
  },
  {
    title: '4. Intellectual Property',
    body: 'Participants retain full ownership of the projects they build. By submitting a project, you grant Founders Fest a non-exclusive, royalty-free license to showcase your project for promotional purposes (e.g., social media, website, future events). You may revoke this license by written request after the event.',
  },
  {
    title: '5. Prizes',
    items: [
      'Prize decisions by the judges are final and binding.',
      'Cash prizes will be disbursed via bank transfer within 30 days of the event.',
      'Prizes are subject to applicable taxes, which are the winner\'s responsibility.',
      'Organisers reserve the right to modify prize amounts before the event.',
    ],
  },
  {
    title: '6. Conduct',
    body: 'All participants must comply with the Code of Conduct. Violation may result in disqualification and removal from the event without refund.',
  },
  {
    title: '7. Liability',
    body: 'Founders Fest and its organisers are not liable for personal injury, loss or damage to property, or any indirect or consequential loss arising from participation in the event. Participants are responsible for their own belongings.',
  },
  {
    title: '8. Photography and Media',
    body: 'By attending the event, you consent to being photographed, filmed, or recorded for use in Founders Fest promotional materials. If you do not consent, notify an organiser on arrival.',
  },
  {
    title: '9. Changes to These Terms',
    body: 'Founders Fest reserves the right to modify these terms at any time. Participants will be notified of significant changes via email. Continued participation constitutes acceptance of the updated terms.',
  },
  {
    title: '10. Governing Law',
    body: 'These terms are governed by the laws of India. Any disputes arising from participation shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.',
  },
]

export function TermsModal({ open, onOpenChange, onAccept, alreadyAccepted }) {
  const [reachedBottom, setReachedBottom] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const scrollRef = useRef(null)

  // Reset scroll state when modal opens
  useEffect(() => {
    if (open) {
      setReachedBottom(alreadyAccepted)
      setAccepting(false)
      // Scroll to top on open
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }
  }, [open, alreadyAccepted])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < 60) setReachedBottom(true)
  }

  async function handleAccept() {
    setAccepting(true)
    await onAccept()
    setAccepting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col gap-0 p-0 overflow-hidden" style={{ maxHeight: '85vh' }}>
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-lg font-bold">Terms & Conditions</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            What The Tech · Founders Fest · Last updated June 2026
          </p>
        </DialogHeader>

        {/* Scroll hint banner */}
        {!reachedBottom && (
          <div className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex-shrink-0">
            <ChevronDown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-bounce" />
            <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
              Please scroll to the bottom before accepting
            </span>
          </div>
        )}

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0"
        >
          {SECTIONS.map((s) => (
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

          {/* Bottom marker so scroll detection fires cleanly */}
          <div className="h-1" />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {alreadyAccepted
              ? 'You have already accepted these terms.'
              : reachedBottom
              ? 'You\'ve read the terms  -  please accept below.'
              : 'Scroll to the bottom to enable acceptance.'}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {!alreadyAccepted && (
              <Button
                size="sm"
                disabled={!reachedBottom || accepting}
                onClick={handleAccept}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[110px]"
              >
                {accepting ? (
                  'Accepting…'
                ) : reachedBottom ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> I Accept
                  </span>
                ) : (
                  'Scroll to Accept'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
