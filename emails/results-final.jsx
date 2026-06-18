// Email #38 - Winners announced: Final Results + Winners!
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function ResultsFinalEmail({ name = 'Hacker', teamName = '', placement = null, prize = '', winners = [], resultsUrl = '#' }) {
  const isWinner = !!placement
  return (
    <BaseLayout preview={isWinner ? `🏆 Congratulations! ${teamName} won ${placement}!` : 'Final hackathon results are out!'}>
      {isWinner ? (
        <>
          <div style={s.badgeGreen}>🏆 Winner!</div>
          <h1 style={{ ...s.h1, marginTop: 16 }}>You won, {name}! 🎉</h1>
          <p style={s.p}>
            <strong>{teamName}</strong> has won <strong>{placement}</strong> at What The Tech Hackathon!
            {prize && <> Your prize: <strong>{prize}</strong>.</>}
          </p>
          <div style={{ ...s.accentLine, borderColor: '#16A34A' }}>
            <p style={{ ...s.small, margin: 0 }}>Prize distribution details will be shared by the organizing team shortly. Congratulations on an incredible build!</p>
          </div>
        </>
      ) : (
        <>
          <div style={s.badge}>Final Results</div>
          <h1 style={{ ...s.h1, marginTop: 16 }}>Final Results Are Out!</h1>
          <p style={s.p}>
            Hi {name}! The final judging is complete. Thank you for participating in What The Tech Hackathon.
            Every team that submitted built something real in 36 hours - that's a win in itself.
          </p>
        </>
      )}
      {winners.length > 0 && (
        <div style={s.card}>
          <p style={{ ...s.small, fontWeight: 700, margin: '0 0 10px' }}>🏅 Winners</p>
          {winners.map((w, i) => (
            <p key={i} style={{ ...s.small, margin: '0 0 6px' }}>
              {w.rank} - <strong>{w.team}</strong>{w.prize ? `: ${w.prize}` : ''}
            </p>
          ))}
        </div>
      )}
      <div style={s.btnWrap}>
        <Link href={resultsUrl} style={s.btn}>View Full Results →</Link>
      </div>
      <Hr style={s.hr} />
      <p style={s.small}>See you at the next Founders Fest event! Follow us for updates.</p>
    </BaseLayout>
  )
}
