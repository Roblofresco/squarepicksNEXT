'use client'

import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'

export type AuthScreenShellProps = PropsWithChildren<{
  canvasId?: string
  showSpotlight?: boolean
  className?: string
}>

export default function AuthScreenShell({ canvasId, showSpotlight = true, className, children }: AuthScreenShellProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => setIsMounted(true), [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Subtle starfield like other pages; optional
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    let raf = 0
    const stars: Array<{ x: number; y: number; size: number; opacity: number; twinkleSpeed: number; twinkleDirection: number }> = []
    const numStars = 120

    const setup = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars.length = 0
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach((s) => {
        s.opacity += s.twinkleSpeed * s.twinkleDirection
        if (s.opacity > 0.7 || s.opacity < 0.1) {
          s.twinkleDirection *= -1
          s.opacity = Math.max(0.1, Math.min(0.7, s.opacity))
        }
        ctx.fillStyle = `rgba(27,176,242,${s.opacity})`
        ctx.fillRect(s.x, s.y, s.size, s.size)
      })
      raf = requestAnimationFrame(animate)
    }

    setup(); animate()
    const onResize = () => setup()
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [isMounted])

  return (
    <main className={`relative w-full min-h-screen overflow-hidden bg-background-primary text-white ${className ?? ''}`}>
      {/* Subtle grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px, 40px 40px',
          backgroundPosition: 'center center',
        }}
      />

      {/* Optional starfield */}
      <canvas ref={canvasRef} className="absolute inset-0 -z-10 pointer-events-none" id={canvasId} />

      {/* Spotlight that follows cursor */}
      {showSpotlight && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition duration-300"
          style={{
            background: `radial-gradient(320px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29,78,216,0.08), transparent 80%)`,
          }}
        />
      )}

      {/* Centered card */}
      <div className="relative z-10 flex items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-background-primary/45 via-background-secondary/45 via-15% to-background-secondary/45 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-xl" />
          <div className="relative z-10 w-full p-8">{children}</div>
        </div>
      </div>
    </main>
  )
} 