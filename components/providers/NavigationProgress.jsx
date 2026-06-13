'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timerRef = useRef(null)
  const completeRef = useRef(null)
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    // Start bar
    setWidth(0)
    setVisible(true)

    clearTimeout(timerRef.current)
    clearTimeout(completeRef.current)

    // Animate to 85% quickly, then stall (waiting for page to finish)
    timerRef.current = setTimeout(() => setWidth(30), 50)
    timerRef.current = setTimeout(() => setWidth(60), 200)
    timerRef.current = setTimeout(() => setWidth(85), 500)

    // Complete after page renders
    completeRef.current = setTimeout(() => {
      setWidth(100)
      setTimeout(() => setVisible(false), 300)
    }, 700)

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(completeRef.current)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'hsl(var(--primary))',
          transition: width === 100
            ? 'width 0.15s ease-out'
            : 'width 0.4s ease-out',
          boxShadow: '0 0 8px hsl(var(--primary) / 0.6)',
        }}
      />
    </div>
  )
}
