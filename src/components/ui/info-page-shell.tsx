'use client'

import React, { useEffect, useRef, useState, PropsWithChildren } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import InfoNavbar from './info-navbar'

export type InfoPageShellProps = PropsWithChildren<{
  canvasId?: string;
  showBackButton?: boolean;
  containerClassName?: string;
}>;

export default function InfoPageShell({
  canvasId,
  showBackButton = true,
  containerClassName,
  children,
}: InfoPageShellProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const pointerDownRef = useRef(false)
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })
  const resizeTimerRef = useRef<any>(null)
  const drawNowRef = useRef<() => void>(() => {})

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Track pointer position for both desktop and mobile
  useEffect(() => {
    if (!isMounted) return

    // Initialize pointer at center
    const initX = window.innerWidth * 0.5
    const initY = window.innerHeight * 0.5
    pointerRef.current = { x: initX, y: initY }
    setMousePosition({ x: initX, y: initY })

    const updatePointer = (clientX: number, clientY: number) => {
      pointerRef.current.x = clientX
      pointerRef.current.y = clientY
      setMousePosition({ x: clientX, y: clientY })
      if (drawNowRef.current) {
        drawNowRef.current()
      }
    }

    // Mouse events for desktop
    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY)
    }
    const handleMouseDown = (e: MouseEvent) => {
      pointerDownRef.current = true
      updatePointer(e.clientX, e.clientY)
    }
    const handleMouseUp = () => {
      pointerDownRef.current = false
    }

    // Touch events for mobile
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0]
        updatePointer(touch.clientX, touch.clientY)
      }
    }
    const handleTouchStart = (e: TouchEvent) => {
      pointerDownRef.current = true
      if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0]
        updatePointer(touch.clientX, touch.clientY)
      }
    }
    const handleTouchEnd = () => {
      pointerDownRef.current = false
    }

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    const handleScroll = () => {
      if (drawNowRef.current) {
        drawNowRef.current()
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isMounted])

  useEffect(() => {
    if (!isMounted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const stars: any[] = []
    const numStars = 150
    const minOpacity = 0.1
    const maxOpacity = 0.7
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let warpStrength = 0
    let warpTarget = 0
    const baseWarpOnHover = prefersReduced ? 0 : 0.5
    const baseWarpOnPress = prefersReduced ? 0 : 0.85
    let paused = false

    const setup = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars.length = 0
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          baseX: 0,
          baseY: 0,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
          twinkleSpeed: Math.random() * 0.008 + 0.003,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        })
      }
      for (let i = 0; i < stars.length; i++) {
        stars[i].baseX = stars[i].x
        stars[i].baseY = stars[i].y
      }
      lastSizeRef.current = { w: canvas.width, h: canvas.height }
    }

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const cx = canvas.width * 0.5
      const cy = canvas.height * 0.5
      const px = pointerRef.current.x || cx
      const py = pointerRef.current.y || cy
      const radius = Math.min(canvas.width, canvas.height) * 0.35

      warpTarget = pointerDownRef.current ? baseWarpOnPress : baseWarpOnHover
      warpStrength += (warpTarget - warpStrength) * 0.12

      stars.forEach(star => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection
        if (star.opacity > maxOpacity || star.opacity < minOpacity) {
          star.twinkleDirection *= -1
          star.opacity = Math.max(minOpacity, Math.min(maxOpacity, star.opacity))
        }

        const dx = star.baseX - px
        const dy = star.baseY - py
        const dist = Math.hypot(dx, dy)
        const intensity = Math.max(0, 1 - Math.min(dist / radius, 1))
        const warpFactor = warpStrength * (0.5 * intensity + 0.5 * intensity * intensity)
        const drawX = star.baseX + (px - star.baseX) * warpFactor
        const drawY = star.baseY + (py - star.baseY) * warpFactor
        const glowOpacity = Math.min(1, star.opacity + intensity * 0.8)

        ctx.fillStyle = `rgba(27, 176, 242, ${glowOpacity})`
        ctx.fillRect(drawX, drawY, star.size, star.size)
      })
    }

    const animate = () => {
      renderFrame()
      animationFrameId = requestAnimationFrame(animate)
    }

    setup()
    animate()
    drawNowRef.current = renderFrame

    const handleResize = () => {
      const doResize = () => {
        const newW = window.innerWidth
        const newH = window.innerHeight
        const { w: oldW, h: oldH } = lastSizeRef.current
        const widthChanged = Math.abs(newW - oldW) > 16
        const heightChanged = Math.abs(newH - oldH) > 160
        canvas.width = newW
        canvas.height = newH
        if (widthChanged || heightChanged) {
          setup()
        } else {
          lastSizeRef.current = { w: newW, h: newH }
        }
      }
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(doResize, 200)
    }
    window.addEventListener('resize', handleResize)

    const onVis = () => { paused = document.hidden }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', onVis)
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      stars.length = 0
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
        resizeTimerRef.current = null
      }
    }
  }, [isMounted])

  return (
    <div className="min-h-screen bg-background-primary text-white relative">
      <canvas ref={canvasRef} className="fixed inset-0 -z-1 pointer-events-none" id={canvasId} />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(220px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      <main className="container mx-auto px-4 py-12 relative z-10">
        <nav className="py-6 flex justify-between items-center">
          <Link href="/" className="block">
            <Image
              src="/brandkit/logos/sp-logo-icon-default-text-white.svg"
              alt="SquarePicks Logo"
              width={180}
              height={27}
              priority
            />
          </Link>
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="text-sm text-accent-1 hover:text-accent-2 transition-all duration-200 py-1.5 px-3 rounded-md border border-accent-1/20 hover:border-accent-2/40 bg-accent-1/5 backdrop-blur-sm shadow-[0_0_15px_rgba(27,176,242,0.1)] hover:shadow-[0_0_20px_rgba(27,176,242,0.2)]"
            >
              Back
            </button>
          )}
        </nav>

        <section className={`pt-6 pb-12 relative ${containerClassName ?? ''}`}>
          <div 
            className="absolute inset-0 opacity-65 bg-gradient-to-b from-[rgb(var(--color-background-primary))] via-[rgb(var(--color-background-secondary))] via-15% to-[rgb(var(--color-background-secondary))] backdrop-blur-sm rounded-lg border border-white/10 shadow-xl -z-10"
            style={{
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.1),
                0 4px 12px -2px rgba(0, 0, 0, 0.4),
                0 0 40px -10px rgba(88, 85, 228, 0.15)
              `
            }}
          />
          <div className="relative z-0">
            <InfoNavbar />
            <div className="p-6 md:p-10 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {children}
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-gray-800">
          <div className="flex flex-col items-center justify-center text-center">
            <Link href="/" className="block mb-4">
              <Image 
                src="/brandkit/logos/sp-logo-icon-default-text-white.svg" 
                alt="SquarePicks Logo" 
                width={240} 
                height={35}
              />
            </Link>
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} SquarePicks. All rights reserved.
              <div className="mt-2">
                <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
                <span className="mx-2">|</span>
                <Link href="/terms" className="hover:text-white transition-colors duration-200">
                  Terms & Conditions
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}