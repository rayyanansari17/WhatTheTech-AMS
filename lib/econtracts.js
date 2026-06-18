const BASE = 'https://uvktoojtpsbbmahrbxeg.supabase.co/functions/v1/api-contracts'

const TC_TEXT = `FOUNDERS FEST – PARTICIPATION TERMS & CONDITIONS
What The Tech Hackathon at BITS Pilani, Hyderabad Campus
Last updated June 2026

1. ELIGIBILITY
What The Tech is open to students and recent graduates (within 1 year) from any recognised educational institution. Participants must be at least 16 years of age. Organisers, judges, mentors, and sponsors are not eligible to participate as hackers.

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

export async function createParticipationContract({ name, email }) {
  return post('', {
    title: 'Founders Fest – Participation Agreement',
    description: 'Terms and conditions for participation in the Founders Fest hackathon at BITS Pilani Hyderabad',
    contract_type: 'service_agreement',
    terms: TC_TEXT,
    payment_amount: 0,
    payment_currency: 'INR',
    start_date: new Date().toISOString(),
    end_date: '2026-12-31T23:59:59Z',
    party_b_email: email,
    party_b_name: name,
  })
}

export async function createRegistrationContract({ name, email, teamName, amountPaid, orderId }) {
  const terms = `FOUNDERS FEST – REGISTRATION CONFIRMATION

This document confirms the successful registration and payment for the Founders Fest hackathon at BITS Pilani, Hyderabad Campus.

Participant: ${name}
Team Name: ${teamName}
Order ID: ${orderId}
Amount Paid: ₹${amountPaid}
Registration Date: ${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'long' })}

Your registration is confirmed. Please retain this document as proof of registration. Check-in details and the event schedule will be shared via email closer to the event date.

Venue: BITS Pilani, Hyderabad Campus, Jawahar Nagar, Shameerpet, Hyderabad – 500078

For support, contact the Founders Fest team.`

  return post('', {
    title: 'Founders Fest – Registration Confirmation',
    description: `Registration confirmation for ${name} — Team: ${teamName}`,
    contract_type: 'service_agreement',
    terms,
    payment_amount: amountPaid,
    payment_currency: 'INR',
    start_date: new Date().toISOString(),
    end_date: '2026-12-31T23:59:59Z',
    party_b_email: email,
    party_b_name: name,
  })
}
