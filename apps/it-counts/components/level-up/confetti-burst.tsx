'use client'

import { useEffect, useRef } from 'react'

/**
 * A brief, non-looping confetti burst using the Canvas API.
 * Respects `prefers-reduced-motion` — renders nothing when motion is reduced.
 * Particles fade out over ~1.5 seconds then stop animating.
 */
export function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H

    const COLORS = ['#f38ba8', '#a6e3a1', '#89b4fa', '#fab387', '#cba6f7', '#f9e2af']
    const COUNT = 60

    type Particle = {
      x: number; y: number
      vx: number; vy: number
      color: string
      alpha: number
      size: number
    }

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: W / 2,
      y: H * 0.3,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 6 - 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#cba6f7',
      alpha: 1,
      size: Math.random() * 6 + 4,
    }))

    let raf: number

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      let allFaded = true
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15 // gravity
        p.alpha -= 0.012

        if (p.alpha > 0) {
          allFaded = false
          ctx!.globalAlpha = Math.max(0, p.alpha)
          ctx!.fillStyle = p.color
          ctx!.fillRect(p.x, p.y, p.size, p.size * 0.6)
        }
      }

      ctx!.globalAlpha = 1

      if (!allFaded) {
        raf = requestAnimationFrame(draw)
      }
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
