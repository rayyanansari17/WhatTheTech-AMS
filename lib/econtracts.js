const BASE = 'https://uvktoojtpsbbmahrbxeg.supabase.co/functions/v1/api-contracts'

const TC_TEXT = `FOUNDERS FEST – PARTICIPATION TERMS & CONDITIONS
What The Tech Hackathon at Gachibowli Indoor Stadium, Hyderabad
Last updated June 2026

1. ELIGIBILITY
What The Tech is open to students at any level of education, including school students (11th and 12th grade), college students, and recent graduates (within 1 year of completion). There is no minimum or maximum age requirement, though participants under 18 must provide parental/guardian consent during registration. Organisers, judges, mentors, and sponsors are not eligible to participate as hackers.

2. REGISTRATION AND PAYMENT
- Registration is complete only after payment is received. Unpaid registrations may be released.
- Payment is ₹299 per person. Teams of 5 pay ₹1,299 (a bundled rate).
- Payments are non-refundable except in the event of cancellation by the organisers.
- If the event is cancelled, a full refund will be issued within 10 business days.

3. TEAMS
- Teams must have a minimum of 1 and a maximum of 5 members.
- All team members must be individually registered.
- Team changes are not permitted after the registration deadline.
- The team leader is responsible for completing payment on behalf of the team.

4. INTELLECTUAL PROPERTY
Participants retain full ownership of the projects they build. By submitting a project, you grant Founders Fest a non-exclusive, royalty-free license to showcase your project for promotional purposes (e.g., social media, website, future events). You may revoke this license by written request after the event.

5. PRIZES
- Prize decisions by the judges are final and binding.
- Cash prizes will be disbursed via bank transfer within 30 days of the event.
- Prizes are subject to applicable taxes, which are the winner's responsibility.
- Organisers reserve the right to modify prize amounts before the event.

6. CONDUCT
All participants must comply with the Code of Conduct. Violation may result in disqualification and removal from the event without refund.

7. LIABILITY
Founders Fest and its organisers are not liable for personal injury, loss or damage to property, or any indirect or consequential loss arising from participation in the event. Participants are responsible for their own belongings.

8. PHOTOGRAPHY AND MEDIA
By attending the event, you consent to being photographed, filmed, or recorded for use in Founders Fest promotional materials. If you do not consent, notify an organiser on arrival.

9. CHANGES TO THESE TERMS
Founders Fest reserves the right to modify these terms at any time. Participants will be notified of significant changes via email. Continued participation constitutes acceptance of the updated terms.

10. GOVERNING LAW
These terms are governed by the laws of India. Any disputes arising from participation shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.`

async function post(path, data) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.ECONTRACTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `econtracts.ai ${res.status}`)
  }
  return res.json()
}

export async function createParticipationContract({ name, email, acceptedAt }) {
  return post('', {
    title: 'Founders Fest – Participation Agreement',
    description: 'Terms and conditions for participation in the Founders Fest hackathon at Gachibowli Indoor Stadium, Hyderabad',
    contract_type: 'service_agreement',
    terms: TC_TEXT,
    payment_amount: 0,
    payment_currency: 'INR',
    start_date: new Date().toISOString(),
    end_date: '2026-12-31T23:59:59Z',
    party_b_email: email,
    party_b_name: name,
    party_b_signed_at: acceptedAt || new Date().toISOString(),
  })
}

const GUARDIAN_CONSENT_TEXT = `FOUNDERS FEST - PARENTAL/GUARDIAN CONSENT
What The Tech Hackathon at Gachibowli Indoor Stadium, Hyderabad
Last updated June 2026

1. ABOUT THIS CONSENT
This form is required for participants who are currently enrolled in school (11th or 12th grade). A parent or legal guardian must read, acknowledge, and accept the terms below on behalf of the participant before registration can be completed.

2. PARTICIPANT DETAILS
The participant named in this registration is a school student who wishes to take part in the Founders Fest What The Tech Hackathon at Gachibowli Indoor Stadium, Hyderabad, scheduled for August 6 to 7, 2026. By completing this form, the parent or guardian confirms the participant's identity and eligibility.

3. EVENT OVERVIEW
What The Tech is a 36-hour student hackathon open to participants of all education levels. The event takes place at an indoor venue in Hyderabad with organisers, mentors, and volunteers present throughout. Meals, beverages, and basic first aid will be available on-site. Participation is voluntary.

4. SUPERVISION AND RESPONSIBILITY
- The organising team will maintain a safe and inclusive environment throughout the event.
- Participants are expected to follow the Code of Conduct at all times.
- Parents and guardians are responsible for ensuring the participant can attend and travel safely.
- The organisers do not provide overnight or off-site supervision.
- In the event of a medical situation, the emergency contact provided will be notified.

5. PHOTOGRAPHY AND MEDIA
By granting consent, you acknowledge that the participant may be photographed or filmed during the event. These images and videos may be used by Founders Fest for promotional purposes including social media posts, website content, and press coverage.

6. LIABILITY WAIVER
Founders Fest and its organisers, volunteers, and sponsors are not liable for any personal injury, loss, theft, or damage to property arising from the participant's attendance at the event. The parent or guardian accepts this limitation of liability on behalf of the minor participant.

7. EMERGENCY CONTACT AUTHORISATION
By submitting this consent form, the parent or guardian authorises organisers to contact them immediately in the event of a medical emergency, accident, or serious concern involving the participant.

8. GOVERNING TERMS
This consent is governed by the main Terms and Conditions of the event. Continued participation constitutes acceptance of both this consent and those terms.`

export async function createGuardianConsentContract({ participantName, participantEmail, guardianName, guardianEmail, guardianPhone, acceptedAt }) {
  const terms = `${GUARDIAN_CONSENT_TEXT}

---
Guardian: ${guardianName} | Phone: +91${guardianPhone} | Email: ${guardianEmail}
Participant: ${participantName} | Email: ${participantEmail}`

  return post('', {
    title: 'Founders Fest - Parental/Guardian Consent',
    description: `Guardian consent for school participant ${participantName}`,
    contract_type: 'service_agreement',
    terms,
    payment_amount: 0,
    payment_currency: 'INR',
    start_date: new Date().toISOString(),
    end_date: '2026-12-31T23:59:59Z',
    party_b_email: guardianEmail,
    party_b_name: guardianName,
    party_b_signed_at: acceptedAt || new Date().toISOString(),
  })
}

export async function createRegistrationContract({ name, email, teamName, amountPaid, orderId, acceptedAt }) {
  const terms = `FOUNDERS FEST – REGISTRATION CONFIRMATION

This document confirms the successful registration and payment for the Founders Fest hackathon at Gachibowli Indoor Stadium, Hyderabad.

Participant: ${name}
Team Name: ${teamName}
Order ID: ${orderId}
Amount Paid: ₹${amountPaid}
Registration Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })}

Your registration is confirmed. Please retain this document as proof of registration. Check-in details and the event schedule will be shared via email closer to the event date.

Venue: Gachibowli Indoor Stadium, Hyderabad – 500032

For support, contact the Founders Fest team.`

  return post('', {
    title: 'Founders Fest – Registration Confirmation',
    description: `Registration confirmation for ${name}  -  Team: ${teamName}`,
    contract_type: 'service_agreement',
    terms,
    payment_amount: amountPaid,
    payment_currency: 'INR',
    start_date: new Date().toISOString(),
    end_date: '2026-12-31T23:59:59Z',
    party_b_email: email,
    party_b_name: name,
    party_b_signed_at: acceptedAt || new Date().toISOString(),
  })
}
