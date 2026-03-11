import './globals.css'

export const metadata = {
  title: 'ScamShield — Is This Website Safe?',
  description: 'Verify any website instantly. AI-powered scam detection, community reports, and reporting guides.',
  keywords: 'scam detector, fake website checker, trust score, online fraud protection',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
