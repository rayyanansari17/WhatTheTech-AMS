import { Nunito_Sans, Montserrat } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ThemeAutoSync } from '@/components/providers/ThemeAutoSync'

const nunitoSans = Nunito_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-nunito-sans', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-montserrat', display: 'swap' })

/** @type {import('next').Metadata} */
export const metadata = {
  metadataBase: new URL('https://app.foundersfest.org'),
  title: 'What The Tech: Hackathon Edition | Register',
  description: 'Register for What The Tech — a 48-hour student hackathon in Hyderabad, Aug 6–7 2026. Teams of 2–5, ₹299 per person.',
  keywords: 'hackathon, founders fest, what the tech, BITS Pilani, Hyderabad, registration',
  alternates: { canonical: 'https://app.foundersfest.org/' },
  openGraph: {
    type: 'website',
    url: 'https://app.foundersfest.org/',
    title: 'What The Tech: Hackathon Edition | Register',
    description: 'Register for the 48-hour student hackathon in Hyderabad, Aug 6–7 2026. Teams of 2–5, ₹299 per person.',
    images: [{ url: 'https://hackathon.foundersfest.org/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What The Tech: Hackathon Edition | Register',
    description: 'Register for the 48-hour student hackathon in Hyderabad, Aug 6–7 2026.',
    images: ['https://hackathon.foundersfest.org/og-image.jpg'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b5bdb" />
      </head>
      <body className={`${nunitoSans.variable} ${montserrat.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: 'What The Tech: Hackathon Edition',
              description: 'A 48-hour student hackathon in Hyderabad with 2000+ participants and a ₹1.5L prize pool.',
              startDate: '2026-08-06T09:00:00+05:30',
              endDate: '2026-08-07T18:00:00+05:30',
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              image: ['https://hackathon.foundersfest.org/og-image.jpg'],
              location: [
                { '@type': 'Place', name: 'BITS Pilani Hyderabad Campus', address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' } },
                { '@type': 'Place', name: 'Google for Startups', address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' } },
                { '@type': 'Place', name: 'T-Hub', address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' } },
              ],
              offers: {
                '@type': 'Offer',
                name: 'Registration',
                price: '299',
                priceCurrency: 'INR',
                url: 'https://app.foundersfest.org/register',
                availability: 'https://schema.org/InStock',
                validFrom: '2026-06-01T00:00:00+05:30',
              },
              organizer: { '@type': 'Organization', name: 'Founders Fest', url: 'https://hackathon.foundersfest.org' },
            }),
          }}
        />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-9V5C74LTCG" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-9V5C74LTCG');
        `}</Script>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeAutoSync />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '10px',
                fontSize: '14px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
