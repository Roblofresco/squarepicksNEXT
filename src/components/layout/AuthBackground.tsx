'use client'

import React, { PropsWithChildren, useEffect, useRef, useState } from 'react'

export type AuthBackgroundProps = PropsWithChildren<{
  canvasId?: string
}>

export default function AuthBackground({ canvasId, children }: AuthBackgroundProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => setIsMounted(true), [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => {
    if (!isMounted || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const stars: Array<{
      x: number
      y: number
      size: number
      opacity: number
      twinkleSpeed: number
      twinkleDirection: number
    }> = []
    const numStars = 150
    const minOpacity = 0.1
    const maxOpacity = 0.7

    const setup = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars.length = 0
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleDirection: Math.random() < 0.5 ? 1 : -1,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      stars.forEach((star) => {
        star.opacity += star.twinkleSpeed * star.twinkleDirection
        if (star.opacity > maxOpacity || star.opacity < minOpacity) {
          star.twinkleDirection *= -1
          star.opacity = Math.max(minOpacity, Math.min(maxOpacity, star.opacity))
        }
        ctx.fillStyle = `rgba(27, 176, 242, ${star.opacity})`
        ctx.fillRect(star.x, star.y, star.size, star.size)
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    setup()
    animate()

    const handleResize = () => setup()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMounted])

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-background-primary text-white">
      <canvas ref={canvasRef} className="fixed inset-0 -z-1 pointer-events-none" id={canvasId} />
      <div
        className="pointer-events-none fixed inset-0 z-0 transition duration-300"
        style={{
          background: `radial-gradient(300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.06), transparent 80%)`,
        }}
      />
      <div className="relative flex-grow flex flex-col items-center justify-center p-5">
        {children}
      </div>
    </main>
  )
} 