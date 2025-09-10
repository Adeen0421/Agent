import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ocean Chat - Where Intelligence Meets the Deep Blue',
  description: 'Explore the limitless potential of AI conversations in a cosmic interface',
}

function AnimatedBackground() {
  return (
    <>
      <div className="animated-bg" />
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AnimatedBackground />
        {children}
      </body>
    </html>
  )
}
