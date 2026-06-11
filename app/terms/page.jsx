import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms & Conditions — What The Tech!',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/register/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-extrabold text-foreground mb-2">Terms & Conditions</h1>
        <p className="text-muted-foreground mb-8">What The Tech Hackathon · Founders Fest · Last updated June 2026</p>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              What The Tech is open to students and recent graduates (within 1 year) from any recognised educational institution. Participants must be at least 16 years of age. Organisers, judges, mentors, and sponsors are not eligible to participate as hackers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Registration and Payment</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Registration is complete only after payment is received. Unpaid registrations may be released.</li>
              <li>Payment is ₹299 per person. Teams of 5 pay ₹1,299 (a bundled rate).</li>
              <li>Payments are non-refundable except in the event of cancellation by the organisers.</li>
              <li>If the event is cancelled, a full refund will be issued within 10 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Teams</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Teams must have a minimum of 1 and a maximum of 5 members.</li>
              <li>All team members must be individually registered.</li>
              <li>Team changes are not permitted after the registration deadline.</li>
              <li>The team leader is responsible for completing payment on behalf of the team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              Participants retain full ownership of the projects they build. By submitting a project, you grant Founders Fest a non-exclusive, royalty-free license to showcase your project for promotional purposes (e.g., social media, website, future events). You may revoke this license by written request after the event.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Prizes</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Prize decisions by the judges are final and binding.</li>
              <li>Cash prizes will be disbursed via bank transfer within 30 days of the event.</li>
              <li>Prizes are subject to applicable taxes, which are the winner's responsibility.</li>
              <li>Organisers reserve the right to modify prize amounts before the event.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              All participants must comply with the <Link href="/code-of-conduct" className="text-green-600 hover:underline">Code of Conduct</Link>. Violation may result in disqualification and removal from the event without refund.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Founders Fest and its organisers are not liable for personal injury, loss or damage to property, or any indirect or consequential loss arising from participation in the event. Participants are responsible for their own belongings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Photography and Media</h2>
            <p className="text-muted-foreground leading-relaxed">
              By attending the event, you consent to being photographed, filmed, or recorded for use in Founders Fest promotional materials. If you do not consent, notify an organiser on arrival.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              Founders Fest reserves the right to modify these terms at any time. Participants will be notified of significant changes via email. Continued participation constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of India. Any disputes arising from participation shall be subject to the exclusive jurisdiction of courts in Hyderabad, Telangana.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
