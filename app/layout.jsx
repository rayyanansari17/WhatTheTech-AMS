import { Nunito_Sans, Montserrat } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ThemeAutoSync } from '@/components/providers/ThemeAutoSync'
import NavigationProgress from '@/components/providers/NavigationProgress'

const nunitoSans = Nunito_Sans({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], variable: '--font-nunito-sans', display: 'swap' })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-montserrat', display: 'swap' })

/** @type {import('next').Metadata} */
export const metadata = {
  metadataBase: new URL('https://app.foundersfest.org'),
  title: 'What The Tech: Hackathon Edition | Register',
  description: 'Register for What The Tech - a 36-hour student hackathon in Hyderabad, Aug 6–7 2026. Teams of 2–5, ₹299 per person.',
  keywords: 'hackathon, founders fest, what the tech, Gachibowli Indoor Stadium, Gachibowli, Hyderabad, registration',
  alternates: { canonical: 'https://app.foundersfest.org/' },
  openGraph: {
    type: 'website',
    url: 'https://app.foundersfest.org/',
    title: 'What The Tech: Hackathon Edition | Register',
    description: 'Register for the 36-hour student hackathon in Hyderabad, Aug 6–7 2026. Teams of 2–5, ₹299 per person.',
    images: [{ url: 'https://hackathon.foundersfest.org/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'What The Tech: Hackathon Edition | Register',
    description: 'Register for the 36-hour student hackathon in Hyderabad, Aug 6–7 2026.',
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
      <body className={`${nunitoSans.variable} ${montserrat.variable} bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Event',
              name: 'What The Tech: Hackathon Edition',
              description: 'A 36-hour student hackathon in Hyderabad with 2000+ participants and a ₹1.5L prize pool.',
              startDate: '2026-08-06T09:00:00+05:30',
              endDate: '2026-08-07T18:00:00+05:30',
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              image: ['https://hackathon.foundersfest.org/og-image.jpg'],
              location: [
                { '@type': 'Place', name: 'Gachibowli Indoor Stadium', address: { '@type': 'PostalAddress', streetAddress: 'Gachibowli', addressLocality: 'Hyderabad', addressRegion: 'Telangana', postalCode: '500032', addressCountry: 'IN' } },
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
        <Script id="utm-capture" strategy="afterInteractive">{`
          (function(){
            var p=new URLSearchParams(location.search);
            var s=p.get('utm_source'),m=p.get('utm_medium'),c=p.get('utm_campaign');
            if(s&&!document.cookie.split(';').some(function(x){return x.trim().startsWith('ff_utm=');})){
              var v=encodeURIComponent(JSON.stringify({s:s,m:m||'',c:c||''}));
              var exp=new Date(Date.now()+30*24*60*60*1000).toUTCString();
              document.cookie='ff_utm='+v+';domain=.foundersfest.org;path=/;expires='+exp+';SameSite=Lax';
            }
          })();
        `}</Script>
        <Script src="https://checkstat.me/check.js" data-id="1317" strategy="afterInteractive" />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-9V5C74LTCG" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-9V5C74LTCG');
        `}</Script>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <NavigationProgress />
          <ThemeAutoSync />
          {children}
          {/* Support bar  -  fixed bottom, every page */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-sm text-white text-xs py-2 px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span className="text-neutral-400 font-medium">Need help?</span>
            <a href="tel:+919353994283" className="hover:text-green-400 transition-colors font-medium">+91 93539 94283</a>
            <span className="text-neutral-600 hidden sm:inline">·</span>
            <a href="tel:+919573109741" className="hover:text-green-400 transition-colors font-medium hidden sm:inline">+91 95731 09741</a>
            <span className="text-neutral-600 hidden sm:inline">·</span>
            <a href="tel:+918712700724" className="hover:text-green-400 transition-colors font-medium hidden sm:inline">+91 87127 00724</a>
            <span className="text-neutral-600">·</span>
            <a href="mailto:hackathon@foundersfest.org?subject=Support%20Request&body=Hi%2C%0A%0ADescribe%20your%20issue%20here%20and%20attach%20a%20screenshot%20if%20possible.%0A%0A" className="hover:text-green-400 transition-colors font-medium">hackathon@foundersfest.org</a>
          </div>
          {/* Spacer so content isn't hidden behind the support bar */}
          <div className="h-10" />
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
