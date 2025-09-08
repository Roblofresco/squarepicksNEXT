'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export default function SignUpSoonPage() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const idleRotationRef = useRef({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const pointerDownRef = useRef(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const drawNowRef = useRef<() => void>(() => {})

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Disable body scroll while on this page
  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
        document.documentElement.style.overflow = ''
      }
    }
  }, [isMounted])

  // Pointer tracking for glow/warp effects
  useEffect(() => {
    if (!isMounted) return

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

    const handleMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY)
    const handleMouseDown = (e: MouseEvent) => { pointerDownRef.current = true; updatePointer(e.clientX, e.clientY) }
    const handleMouseUp = () => { pointerDownRef.current = false }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0]
        updatePointer(t.clientX, t.clientY)
      }
    }
    const handleTouchStart = (e: TouchEvent) => {
      pointerDownRef.current = true
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0]
        updatePointer(t.clientX, t.clientY)
      }
    }
    const handleTouchEnd = () => { pointerDownRef.current = false }

    const handleScroll = () => { if (drawNowRef.current) drawNowRef.current() }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown, { passive: true })
    window.addEventListener('mouseup', handleMouseUp, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
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

  // Idle animation loop (kept light for subtle background motion)
  useEffect(() => {
    const animateIdle = () => {
      if (isInteracting || !isMounted) {
        animationFrameRef.current = null
        return
      }
      idleRotationRef.current.x += 0.005
      idleRotationRef.current.y += 0.007
      if (Math.abs(idleRotationRef.current.x - rotation.x) > 0.01 || Math.abs(idleRotationRef.current.y - rotation.y) > 0.01) {
        setRotation({ x: idleRotationRef.current.x, y: idleRotationRef.current.y })
      }
      animationFrameRef.current = requestAnimationFrame(animateIdle)
    }

    if (!isInteracting && isMounted) {
      idleRotationRef.current = { ...rotation }
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(animateIdle)
      }
    } else if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isInteracting, isMounted, rotation.x, rotation.y])

  // Canvas starfield + pointer glow/warp
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!(ctx instanceof CanvasRenderingContext2D)) return

    let animationFrameId: number
    const stars: Array<{ x: number; y: number; angle: number; speed: number; size: number; opacity: number; dist: number; }> = []
    const numStars = 400
    const baseSpeedFactor = 0.0035
    const baseSpeedOffset = 0.04
    const maxSpeedPxPerFrame = 2.2
    let canvasCenterX = window.innerWidth / 2
    let canvasCenterY = window.innerHeight / 2
    const minOpacity = 0.1
    const maxOpacity = 0.7
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let warpStrength = 0
    let warpTarget = 0
    const baseWarpOnHover = prefersReduced ? 0 : 0.5
    const baseWarpOnPress = prefersReduced ? 0 : 0.85

    const setup = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      canvasCenterX = canvas.width / 2
      canvasCenterY = canvas.height / 2
      stars.length = 0
      for (let i = 0; i < numStars; i++) {
        const initialX = Math.random() * canvas.width
        const initialY = Math.random() * canvas.height
        const dx = initialX - canvasCenterX
        const dy = initialY - canvasCenterY
        const angle = Math.atan2(dy, dx)
        const dist = Math.sqrt(dx * dx + dy * dy)
        stars.push({
          x: initialX,
          y: initialY,
          angle,
          speed: Math.min(maxSpeedPxPerFrame, dist * baseSpeedFactor + baseSpeedOffset),
          size: Math.random() * 2.0 + 1.0,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
          dist,
        })
      }
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

      stars.forEach((star, index) => {
        star.x += Math.cos(star.angle) * star.speed
        star.y += Math.sin(star.angle) * star.speed

        const dx = star.x - canvasCenterX
        const dy = star.y - canvasCenterY
        star.dist = Math.sqrt(dx * dx + dy * dy)
        star.speed = Math.min(maxSpeedPxPerFrame, star.dist * baseSpeedFactor + baseSpeedOffset)
        star.angle = Math.atan2(dy, dx)

        const isOffScreen = star.x < -star.size || star.x > canvas.width + star.size || star.y < -star.size || star.y > canvas.height + star.size
        if (isOffScreen) {
          const squareSize = 100
          const resetX = canvasCenterX + (Math.random() * squareSize - squareSize / 2)
          const resetY = canvasCenterY + (Math.random() * squareSize - squareSize / 2)
          const newDx = resetX - canvasCenterX
          const newDy = resetY - canvasCenterY
          const newAngle = Math.atan2(newDy, newDx)
          const newDist = Math.sqrt(newDx * newDx + newDy * newDy)
          stars[index] = {
            x: resetX,
            y: resetY,
            angle: newAngle,
            speed: Math.min(maxSpeedPxPerFrame, newDist * baseSpeedFactor + baseSpeedOffset),
            size: Math.random() * 2.0 + 1.0,
            opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
            dist: newDist,
          }
        } else {
          const pdx = star.x - px
          const pdy = star.y - py
          const pdist = Math.hypot(pdx, pdy)
          const intensity = Math.max(0, 1 - Math.min(pdist / radius, 1))
          const warpFactor = warpStrength * (0.5 * intensity + 0.5 * intensity * intensity)
          const drawX = star.x + (px - star.x) * warpFactor
          const drawY = star.y + (py - star.y) * warpFactor
          const glowOpacity = Math.min(1, star.opacity + intensity * 0.8)
          ctx.fillStyle = `rgba(27, 176, 242, ${glowOpacity})`
          ctx.fillRect(drawX - star.size / 2, drawY - star.size / 2, star.size, star.size)
        }
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    const animate = () => { renderFrame() }

    const handleResize = () => setup()
    setup()
    animate()
    drawNowRef.current = renderFrame
    window.addEventListener('resize', handleResize)
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMounted])

  // Centered content
  return (
    <main className="relative w-full h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-background-primary">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-1 pointer-events-none"
        id="signup-soon-starfield-canvas"
      />

      {isMounted && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition duration-300"
          style={{
            background: `radial-gradient(220px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-white">Sign up is coming soon</h1>
        <p className="text-gray-300 max-w-xl">
          We're putting the finishing touches on the experience. Request early access and we'll notify you as soon as sign up is available.
        </p>
        <a
          href="mailto:contacts@squarepicks.com?subject=SquarePicks%20Early%20Access%20Request&body=I%20would%20like%20to%20request%20early%20access%20to%20SquarePicks."
          className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-5 py-3 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-black"
        >
          Request Access
        </a>
        <Link
          href="/"
          className="mt-4 text-gray-300 hover:text-white underline underline-offset-4"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}


