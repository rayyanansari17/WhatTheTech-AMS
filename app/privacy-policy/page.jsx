import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy - What The Tech!',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/register/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">What The Tech Hackathon · Founders Fest · Last updated June 2026</p>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-2">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you register for What The Tech, we collect information you provide directly: your name, email address, phone number, emergency contact, educational details, skills, and dietary requirements. We also collect your Google account information when you sign in with Google.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>To manage your registration and team participation.</li>
              <li>To communicate event details, schedule updates, and announcements.</li>
              <li>To coordinate logistics including meals, accommodation, and emergency contacts.</li>
              <li>To verify payment and issue receipts.</li>
              <li>To send you certificates of participation after the event.</li>
              <li>To send career and opportunity updates if you opted in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal data. We may share your information with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground mt-2">
              <li>Sponsors and partners, with your explicit consent.</li>
              <li>Service providers (payment processors, email services) who process data on our behalf under strict confidentiality.</li>
              <li>Authorities if required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for up to 2 years after the event for record-keeping and to contact you about future Founders Fest events. You may request deletion at any time by emailing us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Your Rights</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Opt out of marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard security measures including encrypted connections (HTTPS), row-level security in our database, and access controls. Passwords are never stored - we use Google OAuth for authentication.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. We do not use third-party advertising cookies. You can disable cookies in your browser settings, but this may affect your ability to use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy concerns or data requests, contact us at the email address listed on the Founders Fest website.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
