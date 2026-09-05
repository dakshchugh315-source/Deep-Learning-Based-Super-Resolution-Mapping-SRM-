'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  offset?: number
  className?: string
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 850,
  offset,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [initialOffset, setInitialOffset] = useState(offset !== undefined ? offset : 80)

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleMediaChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMediaChange)

    // Calculate responsive initial offset (30px on mobile, 80px on desktop)
    const updateOffset = () => {
      if (offset !== undefined) {
        setInitialOffset(offset)
      } else {
        setInitialOffset(window.innerWidth < 768 ? 30 : 80)
      }
    }
    updateOffset()
    window.addEventListener('resize', updateOffset)

    // Set up IntersectionObserver (triggers once when 20% visible)
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(node)
        }
      },
      {
        threshold: 0.2, // Trigger at 20% visibility
        rootMargin: '0px 0px -40px 0px',
      }
    )

    observer.observe(node)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
      window.removeEventListener('resize', updateOffset)
      if (node) observer.unobserve(node)
    }
  }, [offset])

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : `translateX(${initialOffset}px)`,
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    willChange: 'opacity, transform',
  }

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  )
}

export default ScrollReveal
