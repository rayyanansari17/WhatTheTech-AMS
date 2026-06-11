'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Link2, MapPin, ChevronDown } from 'lucide-react'
import AuthModal from './AuthModal'
import { HACKATHON_DATE, HACKATHON_DATES, HACKATHON_VENUE } from '@/lib/constants'
import { getSupabaseClient } from '@/lib/supabase'

function CountdownTimer({ targetDate }) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0 })
  useEffect(() => {
    function update() {
      const diff = new Date(targetDate) - new Date()
      if (diff <= 0) { setTime({ days: 0, hours: 0, mins: 0 }); return }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
      })
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [targetDate])
  return (
    <p className="font-bold text-lg tabular-nums" style={{ color: '#46e74b' }}>
      {time.days}d:{String(time.hours).padStart(2, '0')}h:{String(time.mins).padStart(2, '0')}m
    </p>
  )
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#e9ecef] rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f8f9fa] transition-colors"
      >
        <span className="font-medium text-[#212529] text-sm">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#868e96] flex-shrink-0 ml-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-[#495057] border-t border-[#f1f3f5]">
          <p className="mt-3">{answer}</p>
        </div>
      )}
    </div>
  )
}

const TABS = ['Overview', 'Prizes', 'Schedule']

const SocialIcon = ({ href, bg, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-2xl flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
    style={{ width: 48, height: 48, background: bg }}
  >
    {children}
  </a>
)

const TwitterSvg = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const LinkedinSvg = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const DiscordSvg = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.03.05a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
  </svg>
)

const InstagramSvg = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
)

export default function LandingPage({ settings, prizes, sponsors, schedule, faqs }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Overview')
  const [authOpen, setAuthOpen] = useState(false)

  // Safety net: if the OAuth callback set the session client-side but the
  // server-side redirect didn't fire (e.g. cookies weren't on the redirect
  // response), this catches the SIGNED_IN event and re-runs the server
  // component so page.jsx can redirect the user to the correct page.
  useEffect(() => {
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  const deadline = settings?.application_deadline ? new Date(settings.application_deadline) : HACKATHON_DATE
  const eventName = settings?.event_name || 'Founders Fest: Tech Edition'
  const tagline = settings?.tagline || 'Build. Launch. Win.'
  const aboutText = settings?.about_text || "India's premier student hackathon. 48 hours, unlimited ambition, real prizes. Join the next generation of founders."
  const totalPrize = prizes.reduce((sum, p) => sum + (p.amount || 0), 0)

  return (
    <div className="min-h-screen" style={{ background: '#f4f4f4' }}>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Sticky Nav ── */}
      <header
        className="sticky top-0 z-[100] bg-white border-b border-[#e9ecef]"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="max-w-6xl mx-auto px-4 h-[70px] md:h-[90px] flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center flex-shrink-0">
            <img src="/images/logos/ams-logo.png" alt="AMS Logo" className="h-[50px] md:h-[65px] w-auto object-contain" style={{ marginTop: 15 }} />
          </div>

          {/* Center: Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="text-sm font-semibold"
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: activeTab === tab ? '#46e74b' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#868e96',
                  transition: 'all 0.15s',
                }}
              >
                {tab}
              </button>
            ))}
          </nav>

          {/* Right: Apply Now */}
          <button
            onClick={() => setAuthOpen(true)}
            className="flex-shrink-0 text-sm font-semibold text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            style={{ background: '#46e74b' }}
          >
            Apply Now
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2 no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 rounded-md px-3 py-1.5 transition-all text-xs font-semibold"
              style={{
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: activeTab === tab ? '#46e74b' : '#f1f3f5',
                color: activeTab === tab ? '#fff' : '#495057',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* ── Event Title Bar ── */}
      <div className="bg-white border-b border-[#e9ecef] py-2">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-3 sm:gap-4">
          <img src="/images/logos/logo.png" alt="What The Tech Logo" className="object-contain flex-shrink-0 w-20 h-20 sm:w-32 sm:h-32 md:w-[200px] md:h-[200px]" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-[#212529] leading-tight">Founders Fest: What The Tech!</h1>
            <p className="text-[#868e96] mt-0.5 text-xs sm:text-sm">{tagline}</p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left Column ── */}
          <div className="flex-1 min-w-0 w-full space-y-4">

            {/* Poster */}
            <div className="rounded-2xl overflow-hidden h-48 sm:h-64 md:h-80">
              <img
                src={settings?.poster_url || '/images/banner/ff-tech-banner.png'}
                alt={eventName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tab Content Card */}
            <div className="bg-white rounded-2xl border border-[#e9ecef] p-6">

              {/* ── OVERVIEW ── */}
              {activeTab === 'Overview' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#212529] mb-3"></h2>
                    <div className="text-lg text-[#495057] leading-relaxed space-y-3">
                      <p className="font-semibold text-[#212529]">What The Tech began with one idea. Build first, ask questions later.</p>
                      <p>No gatekeeping. No "you need to know X framework" or "your idea isn't technical enough." Just a room full of people who'd rather ship something imperfect than overthink something perfect.</p>
                      <p>What The Tech: Hackathon Edition is a <strong>24-hour</strong> in-person hackathon at <strong>BITS Pilani, Hyderabad</strong>, built for students and young builders who are done waiting for permission to create. The top teams then take the stage at the grand Tech Fest at <strong>T-Hub</strong>, where the best ideas get the spotlight they deserve.</p>
                      <p>If you've got an idea that's been sitting in your notes app, this is your deadline.</p>
                    </div>
                    {settings?.social_website && (
                      <div className="mt-4 space-y-1.5">
                        <p className="text-sm text-[#495057] flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#46e74b] mt-2 flex-shrink-0" />
                          Learn more on our{' '}
                          <a href={settings.social_website} target="_blank" rel="noopener" className="text-[#46e74b] hover:underline">
                            website
                          </a>
                        </p>
                      </div>
                    )}
                  </div>

                  {settings?.rules_text && (
                    <div>
                      <h2 className="text-xl font-extrabold text-[#212529] mb-3">Rules</h2>
                      <div className="text-[#495057] text-sm leading-relaxed space-y-2">
                        {settings.rules_text.split('\n').filter(Boolean).map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-extrabold text-[#212529] mb-3">Find us on</h2>
                    <div className="flex gap-3 flex-wrap">
                      <SocialIcon href="https://x.com/_foundersfest" bg="#000">
                        <TwitterSvg size={24} />
                      </SocialIcon>
                      <SocialIcon href="https://www.linkedin.com/company/edventure-park" bg="#0077b5">
                        <LinkedinSvg size={24} />
                      </SocialIcon>
                      <SocialIcon href={settings?.social_discord || '#'} bg="#5865f2">
                        <DiscordSvg size={24} />
                      </SocialIcon>
                      <SocialIcon href="https://www.instagram.com/founders.fest/" bg="linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)">
                        <InstagramSvg size={24} />
                      </SocialIcon>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PRIZES ── */}
              {activeTab === 'Prizes' && (
                <div className="space-y-6">
                  <div className="text-center py-6 border border-[#e9ecef] rounded-xl">
                    <p className="text-5xl font-black text-[#212529]">
                      {totalPrize > 0 ? `₹${(totalPrize / 1000).toFixed(0)}K+` : '₹1.5L+'}
                    </p>
                    <p className="text-[#868e96] text-sm mt-1">Available in Prizes</p>
                  </div>

                  {prizes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prizes.map(prize => (
                        <div key={prize.id} className="border border-[#e9ecef] rounded-xl p-4 hover:border-[#46e74b]/30 transition-colors">
                          <p className="font-semibold text-[#212529] text-sm">{prize.title}</p>
                          {prize.sponsor_name && (
                            <p className="text-xs text-[#868e96] mt-0.5">{prize.sponsor_name}</p>
                          )}
                          <p className="text-2xl font-bold mt-2" style={{ color: '#46e74b' }}>
                            ₹{prize.amount?.toLocaleString('en-IN')}
                          </p>
                          {prize.description && (
                            <p className="text-xs text-[#868e96] mt-1">{prize.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[#868e96] text-sm py-8">Prize details coming soon.</p>
                  )}

                  {sponsors.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-[#212529] mb-4">Sponsors</h3>
                      <div className="border border-[#e9ecef] rounded-xl p-6">
                        <div className="flex flex-wrap gap-8 items-center justify-center">
                          {sponsors.map(s => (
                            <div key={s.id}>
                              {s.logo_url ? (
                                <img src={s.logo_url} alt={s.name} className="h-10 object-contain" />
                              ) : (
                                <span className="text-[#495057] font-bold text-xl">{s.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── SCHEDULE ── */}
              {activeTab === 'Schedule' && (
                <div>
                  <h2 className="text-xl font-extrabold text-[#212529] mb-5">Event Schedule</h2>
                  {schedule.length > 0 ? (
                    <div>
                      {schedule.map((item, i) => {
                        const date = new Date(item.starts_at)
                        return (
                          <div key={item.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                                style={{ background: '#46e74b' }}
                              />
                              {i < schedule.length - 1 && (
                                <div className="w-px flex-1 bg-[#e9ecef] mt-1" />
                              )}
                            </div>
                            <div className="pb-6">
                              <p className="text-xs text-[#868e96] mb-0.5">
                                {date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                {' · '}
                                {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="font-semibold text-[#212529] text-sm">{item.title}</p>
                              {item.description && (
                                <p className="text-xs text-[#868e96] mt-0.5">{item.description}</p>
                              )}
                              {item.location && (
                                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#46e74b' }}>
                                  <MapPin className="w-3 h-3" />{item.location}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-[#868e96] text-sm py-8">Schedule coming soon.</p>
                  )}
                </div>
              )}

              {/* ── APPLICATION / FAQs ── */}
              {activeTab === 'Application' && (
                <div className="space-y-5">
                  <h2 className="text-xl font-extrabold text-[#212529]">FAQs</h2>
                  {faqs.length > 0 ? (
                    <div className="space-y-2">
                      {faqs.map(faq => (
                        <FaqItem key={faq.id} question={faq.question} answer={faq.answer} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-[#868e96] text-sm py-8">FAQs coming soon.</p>
                  )}
                </div>
              )}
            </div>

            {/* ── Prizes Section ── */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-[#e9ecef] py-10 text-center">
                <p className="text-5xl font-black text-[#212529]">₹2,00,000</p>
                <p className="text-[#868e96] mt-2 text-lg font-normal">Prize Pool and more</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(prizes.length > 0 ? prizes.slice(0, 3) : [
                  { id: 'p1', title: '1st Place', amount: null },
                  { id: 'p2', title: '2nd Place', amount: null },
                  { id: 'p3', title: '3rd Place', amount: null },
                ]).map((prize, i) => (
                  <div key={prize.id} className="bg-white rounded-2xl border border-[#e9ecef] p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg"
                      style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7c2f' }}>
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#212529] text-sm truncate">{prize.title}</p>
                      <p className="text-[#868e96] text-sm mt-0.5">{prize.amount ? `₹${prize.amount.toLocaleString('en-IN')}` : 'TBA'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setActiveTab('Prizes')}
                className="flex items-center gap-3 rounded-2xl px-6 py-4 text-white font-bold text-base hover:opacity-90 transition-opacity"
                style={{ background: '#1a1a2e' }}>
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-base">🏆</span>
                All prizes <span className="ml-1">›</span>
              </button>
            </div>

            {/* ── Sponsors Section ── */}
            <div>
              <h2 className="text-4xl font-black text-[#212529] mb-4">Sponsors</h2>
              <div className="bg-white rounded-2xl border border-[#e9ecef] p-8">
                <div className="flex flex-wrap items-center justify-center gap-10">
                  <img src="/images/sponsors/4.png" alt="Sponsor" className="h-16 w-auto object-contain" />
                  <img src="/images/sponsors/5.png" alt="Sponsor" className="h-8 w-auto object-contain" />
                  <img src="/images/sponsors/6.png" alt="Sponsor" className="h-8 w-auto object-contain" />
                  <img src="/images/sponsors/7.png" alt="Sponsor" className="h-10 w-auto object-contain" />
                </div>
              </div>
            </div>

            {/* ── FAQs Section ── */}
            <div>
              <h2 className="text-4xl font-black text-[#212529] mb-4">FAQs</h2>
              <div className="space-y-3">
                <div className="bg-white rounded-2xl border border-[#e9ecef] px-4 py-3 flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#adb5bd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input type="text" placeholder="Search FAQs"
                    className="flex-1 bg-transparent text-[#495057] text-sm outline-none placeholder:text-[#adb5bd]" />
                </div>
                {faqs.length > 0 ? (
                  <div className="space-y-3">
                    {faqs.map(faq => (<FaqItem key={faq.id} question={faq.question} answer={faq.answer} />))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#e9ecef] p-8 text-center text-[#868e96] text-sm">FAQs coming soon.</div>
                )}
                <p className="text-sm text-[#495057]" style={{ marginTop: 0 }}>
                  Got more questions? Reach out to{' '}
                  <a href="mailto:team@foundersfest.org" className="text-[#46e74b] hover:underline">team@foundersfest.org</a>
                </p>
              </div>
            </div>

          </div>

          {/* ── Right Sidebar ── */}
          <div className="w-full lg:w-[280px] flex-shrink-0 lg:block">
            <div
              className="bg-white rounded-2xl border border-[#e9ecef] p-5 sticky"
              style={{ top: 76 }}
            >
              {/* Share icons */}
              <div className="flex items-center gap-2 mb-5">
                <a href="https://foundersfest-techedition.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full border border-[#e9ecef] flex items-center justify-center hover:bg-[#f8f9fa] transition-colors">
                  <Link2 className="w-4 h-4 text-[#495057]" />
                </a>
                {settings?.social_twitter && (
                  <a href={settings.social_twitter} target="_blank" rel="noopener"
                    className="w-8 h-8 rounded-full border border-[#e9ecef] flex items-center justify-center hover:bg-[#f8f9fa] transition-colors">
                    <TwitterSvg size={14} />
                  </a>
                )}
              </div>

              {/* Runs From */}
              <div className="mb-4 pb-4 border-b border-[#f1f3f5]">
                <p className="font-label text-xs font-bold text-[#adb5bd] uppercase tracking-wide mb-1">Runs From</p>
                <p className="font-bold text-[#212529]">{HACKATHON_DATES}</p>
              </div>

              {/* Venue */}
              <div className="mb-4 pb-4 border-b border-[#f1f3f5]">
                <p className="font-label text-xs font-bold text-[#adb5bd] uppercase tracking-wide mb-1">Happening</p>
                <p className="font-bold text-[#212529]">{HACKATHON_VENUE}</p>
              </div>

              {/* Countdown */}
              <div
                className="mb-5 p-3 rounded-xl"
                style={{ background: '#f0f4ff' }}
              >
                <p className="font-label text-xs font-bold text-[#adb5bd] uppercase tracking-wide mb-1">
                  Applications Close In
                </p>
                <CountdownTimer targetDate={deadline} />
                <p className="text-xs text-[#868e96] mt-1">Application closes on 1st August</p>
              </div>

              {/* CTA */}
              <button
                onClick={() => setAuthOpen(true)}
                className="w-full text-white font-bold rounded-xl py-3 text-lg hover:opacity-90 transition-opacity"
                style={{ background: '#46e74b' }}
              >
                Apply Now
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile Apply Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e9ecef] p-4 z-50">
        <button
          onClick={() => setAuthOpen(true)}
          className="w-full text-white font-bold rounded-xl py-3 text-lg hover:opacity-90 transition-opacity"
          style={{ background: '#46e74b' }}
        >
          Apply Now
        </button>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-[#e9ecef] mt-12 pb-20 lg:pb-0" style={{ background: '#f1f3f5' }}>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row gap-10 justify-between">

            {/* Left — tagline + social */}
            <div className="flex-shrink-0">
              <p className="font-black text-[#212529] leading-tight mb-6 text-3xl md:text-5xl">
                <span className="block whitespace-nowrap">Bring your <span style={{ color: '#93c5fd' }}>laptop.</span></span>
                <span className="block whitespace-nowrap">Leave your <span style={{ color: '#fdba74' }}>excuses.</span></span>
                <span className="block whitespace-nowrap">Take the trophy.</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { href: 'https://x.com/_foundersfest', bg: '#000', icon: <TwitterSvg size={13} /> },
                  { href: 'https://www.linkedin.com/company/edventure-park', bg: '#0077b5', icon: <LinkedinSvg size={13} /> },
                  { href: settings?.social_discord || '#', bg: '#5865f2', icon: <DiscordSvg size={13} /> },
                  { href: 'https://www.instagram.com/founders.fest/', bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', icon: <InstagramSvg size={13} /> },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                    style={{ background: s.bg }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Right — 3 columns in one row */}
            <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8">

              {/* Community */}
              <div>
                <p className="font-label font-bold text-[#adb5bd] text-xs uppercase tracking-wide mb-4">Community</p>
                <ul className="space-y-3 text-sm text-[#495057]">
                  <li><a href="#" className="hover:text-[#46e74b] transition-colors">Organize a hackathon</a></li>
                  <li><a href="#" className="hover:text-[#46e74b] transition-colors">Explore hackathons</a></li>
                  <li><a href="#" className="hover:text-[#46e74b] transition-colors">Code of Conduct</a></li>
                  <li><a href="#" className="hover:text-[#46e74b] transition-colors">Brand Assets</a></li>
                  <li><a href="#" className="hover:text-[#46e74b] transition-colors">Documentation</a></li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <p className="font-label font-bold text-[#adb5bd] text-xs uppercase tracking-wide mb-4">Company</p>
                <ul className="space-y-3 text-sm text-[#495057]">
                  <li><button onClick={() => setActiveTab('Overview')} className="hover:text-[#46e74b] transition-colors">About</button></li>
                  <li><button onClick={() => { setActiveTab('Schedule'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-[#46e74b] transition-colors">Schedule</button></li>
                  <li><button onClick={() => { setActiveTab('Prizes'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-[#46e74b] transition-colors">Prizes</button></li>
                  <li><a href="mailto:team@foundersfest.org" className="hover:text-[#46e74b] transition-colors">Contact</a></li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <p className="font-label font-bold text-[#adb5bd] text-xs uppercase tracking-wide mb-4">Support</p>
                <ul className="space-y-3 text-sm text-[#495057]">
                  <li><button onClick={() => { setActiveTab('Application'); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="hover:text-[#46e74b] transition-colors">FAQs</button></li>
                  <li><a href="mailto:team@foundersfest.org" className="hover:text-[#46e74b] transition-colors">Contact us</a></li>
                </ul>
              </div>

            </div>
          </div>

          <div className="border-t border-[#dee2e6] mt-6 py-3 flex items-center justify-between flex-wrap gap-3">
            <img src="/images/logos/ams-logo.png" alt="AMS Logo" className="h-[80px] w-auto object-contain" />
            <p className="text-xs text-[#adb5bd]">© 2026, Founders Fest Tech Edition</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
