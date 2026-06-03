// Email #37 — Round 1 results announced
import { Link, Hr } from '@react-email/components'
import BaseLayout, { s } from './BaseLayout'

export default function ResultsRound1Email({ name = 'Hacker', teamName = '', qualified = false, resultsUrl = '#' }) {
  return (
    <BaseLayout preview={`Round 1 results are in! ${qualified ? "You've advanced!" : "See the results."}`}>
      <div style={qualified ? s.badgeGreen : s.badge}>
        {qualified ? '🏆 You Qualified!' : '📊 Round 1 Results'}
      </div>
      <h1 style={{ ...s.h1, marginTop: 16 }}>Round 1 Results Are In!</h1>
      {qualified ? (
        <>
          <p style={s.p}>
            Congratulations, {name}! <strong>{teamName}</strong> has advanced to the next round of judging.
            Your project impressed the judges — now it's time to prepare for your final demo.
          </p>
          <div style={s.card}>
            <p style={{ ...s.small, margin: 0 }}>📣 <strong>Next:</strong> Final demo presentations begin soon. Watch the main stage for the schedule.</p>
          </div>
        </>
      ) : (
        <p style={s.p}>
          Hi {name}, the Round 1 judging is complete. Thank you for submitting your project.
          Check the results page to see which teams advanced to the final round.
        </p>
      )}
      <div style={s.btnWrap}>
        <Link href={resultsUrl} style={s.btn}>View Results →</Link>
      </div>
      <Hr style={s.hr} />
    </BaseLayout>
  )
}
