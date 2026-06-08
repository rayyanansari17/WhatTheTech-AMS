import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Code of Conduct — What The Tech!',
}

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link href="/register/profile" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Code of Conduct</h1>
        <p className="text-muted-foreground mb-8">What The Tech Hackathon · Founders Fest</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-2">Our Commitment</h2>
            <p className="text-muted-foreground leading-relaxed">
              What The Tech is dedicated to providing a harassment-free, inclusive experience for everyone regardless of gender, gender identity and expression, sexual orientation, disability, physical appearance, body size, race, ethnicity, age, religion, or nationality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Expected Behaviour</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Be respectful and considerate to all participants, mentors, judges, sponsors, and organisers.</li>
              <li>Participate in an authentic and active way. Your contributions help make this event great.</li>
              <li>Use welcoming and inclusive language in all communications.</li>
              <li>Respect differing viewpoints and experiences — disagreement is fine, disrespect is not.</li>
              <li>Give and receive feedback gracefully.</li>
              <li>Show empathy towards other community members.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Unacceptable Behaviour</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>Harassment, intimidation, or discrimination in any form.</li>
              <li>Offensive comments related to gender, gender identity, sexual orientation, disability, physical appearance, race, religion, or nationality.</li>
              <li>Deliberate misgendering or use of rejected names.</li>
              <li>Inappropriate physical contact or unwelcome sexual attention.</li>
              <li>Photographing or recording others without consent.</li>
              <li>Sustained disruption of talks, workshops, or other events.</li>
              <li>Plagiarism — all submissions must be original work created during the hackathon.</li>
              <li>Sharing others' private information without consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Hackathon-Specific Rules</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>All code and assets must be built during the hackathon period unless otherwise permitted by organisers.</li>
              <li>Teams must not use code written by others without clear attribution and license compliance.</li>
              <li>AI tools (Copilot, ChatGPT, etc.) are permitted but must be disclosed in the submission.</li>
              <li>Teams must stay within the maximum size of 5 members.</li>
              <li>Participants must be present for judging and demo sessions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Reporting</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you experience or witness unacceptable behaviour, or have any concerns, please notify a Founders Fest organiser immediately. You can report in person at the event or via email. All reports will be handled confidentially. Organisers will take appropriate action, up to and including permanent removal from the event.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Consequences</h2>
            <p className="text-muted-foreground leading-relaxed">
              Participants asked to stop unacceptable behaviour are expected to comply immediately. Organisers may take any action they deem appropriate, including warning, expulsion from the event without refund, and reporting to relevant authorities.
            </p>
          </section>

          <p className="text-xs text-muted-foreground border-t border-border pt-6 mt-8">
            This Code of Conduct is adapted from the Contributor Covenant and the Berlin Code of Conduct. Last updated June 2026.
          </p>
        </div>
      </div>
    </div>
  )
}
