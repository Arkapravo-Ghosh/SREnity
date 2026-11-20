"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number };

type ParticlesBgProps = {
  className?: string;
  /** Pixels of area per particle: lower is denser. */
  density?: number;
  /** Max distance (CSS px) at which two particles are linked. */
  linkDistance?: number;
  /** Radius (CSS px) around the pointer that grabs nearby particles. */
  grabDistance?: number;
};

const MAX_PARTICLES = 180;

/**
 * Linked-particle network drawn on a canvas, coloured by the section's `--signal` token,
 * so it follows `tone-dark` / `tone-light` automatically. Decorative only: it never takes
 * pointer events, pauses off-screen and renders a single still frame under reduced motion.
 */
export default function ParticlesBg({
  className,
  density = 9000,
  linkDistance = 140,
  grabDistance = 200,
}: ParticlesBgProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const color = getComputedStyle(canvas).getPropertyValue("--signal").trim() || "#5eead4";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;
    let visible = true;

    const seed = () => {
      const count = Math.min(MAX_PARTICLES, Math.round((width * height) / density));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: 0.8 + Math.random() * 1.8,
        a: 0.35 + Math.random() * 0.45,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < linkDistance) {
            ctx.globalAlpha = (1 - d / linkDistance) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (pointer) {
          const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d < grabDistance) {
            ctx.globalAlpha = (1 - d / grabDistance) * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }

        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const step = () => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (reducedMotion || frame || !visible || document.hidden) return;
      frame = requestAnimationFrame(step);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // The canvas sits under the content, so track the pointer on the window instead.
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointer = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height ? { x, y } : null;
    };
    const onPointerLeave = () => {
      pointer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(canvas);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, linkDistance, grabDistance]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none block h-full w-full", className)}
    />
  );
}
