import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ThemeAutoSync } from '@/components/providers/ThemeAutoSync'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Founders Fest: What The Tech!',
  description: "India's premier student hackathon. 24 hours, unlimited ambition, real prizes. BITS Pilani, Hyderabad — July 6–7, 2026.",
  keywords: 'hackathon, founders fest, what the tech, BITS Pilani, Hyderabad, registration',
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
      <body className={inter.className}>
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
