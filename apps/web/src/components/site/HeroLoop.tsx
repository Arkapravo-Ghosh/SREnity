"use client";

import { useEffect, useRef } from "react";

/*
 * The DevOps infinity loop, drawn as a bundle of ink strands. Like the brand mark, the loop is
 * broken in the upper-right lobe — the Operate side, where incidents live — and SREnity's teal
 * fills the gap as `progress` goes 0 → 1, until the
 * loop closes and a signal pulse runs around it.
 */

const STRANDS = 9;
const SAMPLES = 480;
const PARTICLES = 64;
const GAP_CENTER = -0.18 * Math.PI; // upper-right lobe, where the teal piece sits in the logo
const GAP_HALF = 0.5; // radians of loop missing while the incident is open
const Y_STRETCH = 1.35; // a fuller loop than a true lemniscate, closer to the logo
const TAU = Math.PI * 2;
const OPS_ANCHOR = 0.12 * Math.PI; // lower edge of the Ops lobe, where SREnity reads from
const PLAN_ANCHOR = -0.85 * Math.PI; // lower edge of the Dev lobe, where action items land

export type Point = { x: number; y: number };
/** Where callouts attach to the loop, in canvas pixels. */
export type LoopAnchors = { gap: Point; ops: Point; plan: Point };

type RGB = readonly [number, number, number];

/** Resolve a theme token to RGB on `el`, so the loop follows its section's tone. */
const tokenRGB = (el: Element, name: string, fallback: RGB): RGB => {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!value || !probe) return fallback;
  probe.fillStyle = `rgb(${fallback.join(",")})`;
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
};

const rgba = (c: RGB, alpha: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, alpha))})`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smoothstep = (v: number) => v * v * (3 - 2 * v);
/** Signed angular distance from a to b, in (-π, π]. */
const angDist = (a: number, b: number) => ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

type Strand = { u: number; alpha: number; width: number; speed: number; phase: number };
type Particle = { strand: number; t: number; speed: number; size: number };

export function HeroLoop({
  progress,
  onAnchors,
  className,
}: {
  progress: number;
  onAnchors?: (anchors: LoopAnchors) => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const onAnchorsRef = useRef(onAnchors);

  useEffect(() => {
    progressRef.current = progress;
    onAnchorsRef.current = onAnchors;
  }, [progress, onAnchors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ink: RGB = [14, 26, 43];
    let teal: RGB = [13, 148, 136];
    let alert: RGB = [194, 65, 12];
    // Re-read periodically: in dev the stylesheet can land after the first frame.
    const resolveColors = () => {
      ink = tokenRGB(canvas, "--foreground", ink);
      teal = tokenRGB(canvas, "--signal", teal);
      alert = tokenRGB(canvas, "--alert", alert);
    };
    resolveColors();

    // Strands fan out across the lobes and pinch together where the loop crosses itself.
    const strands: Strand[] = Array.from({ length: STRANDS }, (_, i) => {
      const u = i / (STRANDS - 1) - 0.5;
      const core = 1 - Math.abs(u) * 2;
      return {
        u,
        alpha: 0.14 + 0.55 * core ** 2,
        width: 0.7 + 0.6 * core,
        speed: 0.3 + Math.random() * 0.4,
        phase: Math.random() * TAU,
      };
    });
    const particles: Particle[] = Array.from({ length: PARTICLES }, () => ({
      strand: Math.floor(Math.random() * STRANDS),
      t: Math.random() * TAU - Math.PI,
      speed: 0.05 + Math.random() * 0.12,
      size: 0.8 + Math.random() * 1.1,
    }));

    // Lemniscate geometry, rebuilt on resize: centre-line points, outward normals, strand spread.
    let dpr = 1;
    let w = 0;
    let h = 0;
    let a = 0;
    let cx = 0;
    let cy = 0;
    const ts = new Float32Array(SAMPLES + 1);
    const cxs = new Float32Array(SAMPLES + 1);
    const cys = new Float32Array(SAMPLES + 1);
    const nxs = new Float32Array(SAMPLES + 1);
    const nys = new Float32Array(SAMPLES + 1);
    const spread = new Float32Array(SAMPLES + 1);

    const curve = (t: number): [number, number] => {
      const s = Math.sin(t);
      const c = Math.cos(t);
      const d = 1 + s * s;
      return [cx + (a * c) / d, cy + (Y_STRETCH * a * s * c) / d];
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Loop height is ~0.96a. Tall stages carry callout cards above and below the loop, so keep
      // it compact and nudge it up to clear the larger bottom cards.
      const roomy = h >= 420;
      a = Math.min(w * (roomy ? 0.33 : 0.42), (h - 60) / 0.96, 560);
      cx = w / 2;
      cy = roomy ? h * 0.47 : h / 2;
      for (let k = 0; k <= SAMPLES; k++) {
        const t = -Math.PI + (k / SAMPLES) * TAU;
        const [x, y] = curve(t);
        const [x1, y1] = curve(t - 0.001);
        const [x2, y2] = curve(t + 0.001);
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        let nx = -(y2 - y1) / len;
        let ny = (x2 - x1) / len;
        // Point the normal away from the centre of its own lobe.
        const lobeX = cx + Math.sign(x - cx || 1) * a * 0.6;
        if (nx * (lobeX - x) + ny * (cy - y) > 0) {
          nx = -nx;
          ny = -ny;
        }
        ts[k] = t;
        cxs[k] = x;
        cys[k] = y;
        nxs[k] = nx;
        nys[k] = ny;
        spread[k] = a * 0.075 * (0.12 + 0.88 * Math.abs(Math.cos(t)));
      }

      const anchor = (t: number): Point => {
        const k = indexOf(t);
        const off = spread[k] + 6;
        return { x: cxs[k] + nxs[k] * off, y: cys[k] + nys[k] * off };
      };
      onAnchorsRef.current?.({
        gap: anchor(GAP_CENTER),
        ops: anchor(OPS_ANCHOR),
        plan: anchor(PLAN_ANCHOR),
      });
    };

    const indexOf = (t: number) => {
      const wrapped = ((((t + Math.PI) % TAU) + TAU) % TAU) / TAU;
      return Math.round(wrapped * SAMPLES);
    };
    /** Point on strand `si` at sample index k (wave drifts with time). */
    const strandPoint = (si: number, k: number, time: number): [number, number] => {
      const st = strands[si];
      const t = ts[k];
      const wave =
        a * 0.01 * Math.sin(3 * t + time * st.speed + st.phase) * (0.3 + Math.abs(Math.cos(t)));
      const off = st.u * 2 * spread[k] + wave;
      return [cxs[k] + nxs[k] * off, cys[k] + nys[k] * off];
    };

    let progress = 0; // smoothed progress, 0 = broken, 1 = closed
    let closed = 0; // eases to 1 once the loop has fully closed
    let time = 0;
    let comet = GAP_CENTER;

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const fill = smoothstep(progress);
      const gapHalf = GAP_HALF * (1 - fill);

      for (let si = 0; si < STRANDS; si++) {
        const st = strands[si];
        const basePath = new Path2D();
        const tealPath = new Path2D();
        let prev: "base" | "teal" | "gap" = "gap";

        for (let k = 0; k <= SAMPLES; k++) {
          const d = Math.abs(angDist(ts[k], GAP_CENTER));
          const cls = d < gapHalf ? "gap" : d < GAP_HALF ? "teal" : "base";
          if (cls === "gap") {
            prev = "gap";
            continue;
          }
          const [x, y] = strandPoint(si, k, time);
          const path = cls === "teal" ? tealPath : basePath;
          if (cls !== prev) {
            // Join the previous run to this point so the colours meet without a seam.
            if (prev !== "gap") (prev === "teal" ? tealPath : basePath).lineTo(x, y);
            path.moveTo(x, y);
          } else {
            path.lineTo(x, y);
          }
          prev = cls;
        }

        ctx.lineWidth = st.width;
        ctx.strokeStyle = rgba(ink, st.alpha);
        ctx.stroke(basePath);
        ctx.lineWidth = st.width * 1.5;
        ctx.strokeStyle = rgba(teal, 0.3 + st.alpha * 1.4);
        ctx.stroke(tealPath);
      }

      // Work items moving along the strands; they drop out while crossing the open gap.
      for (const p of particles) {
        const d = Math.abs(angDist(p.t, GAP_CENTER));
        if (d < gapHalf) continue;
        const [x, y] = strandPoint(p.strand, indexOf(p.t), time);
        ctx.fillStyle = d < GAP_HALF ? rgba(teal, 0.9) : rgba(ink, 0.55);
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, TAU);
        ctx.fill();
      }

      // Broken ends flicker while the incident is open.
      if (gapHalf > 0.01) {
        const fade = Math.min(1, gapHalf / 0.12);
        for (const edge of [GAP_CENTER - gapHalf, GAP_CENTER + gapHalf]) {
          const k = indexOf(edge);
          for (let si = 1; si < STRANDS - 1; si += 2) {
            const [x, y] = strandPoint(si, k, time);
            const flicker = 0.5 + 0.5 * Math.sin(time * 9 + si * 1.7 + edge * 5);
            ctx.fillStyle = rgba(alert, fade * (0.35 + 0.65 * flicker));
            ctx.beginPath();
            ctx.arc(x, y, 1.1 + flicker * 1.3, 0, TAU);
            ctx.fill();
          }
        }
      }

      // Once closed, a signal pulse laps the whole loop.
      if (closed > 0.01) {
        for (let j = 0; j < 30; j++) {
          const k = indexOf(comet - j * 0.014);
          const tail = 1 - j / 30;
          for (let si = 2; si < STRANDS - 2; si++) {
            const [x, y] = strandPoint(si, k, time);
            ctx.fillStyle = rgba(teal, closed * tail * 0.7);
            ctx.beginPath();
            ctx.arc(x, y, 0.8 + tail * 1.3, 0, TAU);
            ctx.fill();
          }
        }
      }
    };

    let raf = 0;
    let frame = 0;
    let last = performance.now();
    let visible = true;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (++frame % 60 === 0) resolveColors();
      const target = clamp01(progressRef.current);
      progress = reduced ? target : progress + (target - progress) * (1 - Math.exp(-dt * 7));
      const isClosed = progress > 0.995 ? 1 : 0;
      // Launch the pulse from the repaired gap, so it visibly travels back to Dev.
      if (isClosed && closed < 0.01) comet = GAP_CENTER;
      closed = reduced ? isClosed : closed + (isClosed - closed) * (1 - Math.exp(-dt * 3));

      if (!reduced) {
        time += dt;
        comet += dt * 1.1;
        for (const p of particles) p.t += p.speed * dt;
      }

      draw();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    resize();
    start();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      draw();
    });
    resizeObserver.observe(canvas);

    // Stop animating once the loop has scrolled out of view.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
