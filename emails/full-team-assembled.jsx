// Email #36 — All team members checked in: Full Team Assembled
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function FullTeamAssembledEmail({ name = 'Hacker', teamName = '', members = [], dashboardUrl = '#' }) {
  return (
    <BaseLayout preview={`Full team assembled! ${teamName} is ready to build.`}>
      <div style={s.badgeGreen}>Full Team Here 🟢</div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>The whole crew is here, {name}! 🎉</h1>
      <p style={s.p}>
        All members of <strong>{teamName}</strong> have checked in.
        You're fully assembled and ready to compete.
      </p>
      {members.length > 0 && (
        <div style={s.card}>
          <p style={{ ...s.small, fontWeight: 700, margin: '0 0 8px' }}>Your team:</p>
          {members.map((m, i) => (
            <p key={i} style={{ ...s.small, margin: '0 0 4px' }}>✅ {m}</p>
          ))}
        </div>
      )}
      <p style={s.p}>
        <strong>Hacking starts at 11:00 AM.</strong> Find a table, set up your environment, and let's go! ⚡
      </p>
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>Go to Dashboard →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
