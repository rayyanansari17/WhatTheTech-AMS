// Email #21 - Some team members not paid (24hr nudge to leader)
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function NudgeRemindMembersEmail({ leaderName = 'Leader', teamName = '', unpaidCount = 1, dashboardUrl = '#' }) {
  return (
    <BaseLayout preview={`${unpaidCount} member(s) in your team haven't paid yet.`}>
      <h1 style={s.h1}>Team payment update 📋</h1>
      <p style={s.p}>
        Hi {leaderName}! <strong>{unpaidCount} member{unpaidCount > 1 ? 's' : ''}</strong> in <strong>{teamName}</strong> still
        {unpaidCount > 1 ? " haven't" : " hasn't"} completed payment.
      </p>
      <p style={s.p}>
        Remind them to log in and complete their payment, or as team leader you can pay for the whole team.
      </p>
      <div style={s.btnWrap}>
        <Link href={dashboardUrl} style={s.btn}>View Team Status →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
