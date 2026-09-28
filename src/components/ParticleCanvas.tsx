import React, { useEffect, useRef } from 'react';
import { GemType } from '../types/game';

export interface ParticleTrigger {
  x: number;
  y: number;
  type: GemType;
  count?: number;
  isSpecial?: 'flame' | 'star' | 'hypercube' | null;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'shard' | 'spark';
  angle: number;
  rotationSpeed: number;
}

const GEM_COLORS: Record<GemType, string[]> = {
  ruby: ['#ef4444', '#f87171', '#b91c1c', '#fee2e2'],
  diamond: ['#ffffff', '#cbd5e1', '#94a3b8', '#e2e8f0', '#38bdf8'],
  amber: ['#f97316', '#fbbf24', '#ea580c', '#fef08a'],
  sapphire: ['#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd'],
  topaz: ['#eab308', '#facc15', '#fef08a', '#ca8a04'],
  emerald: ['#22c55e', '#4ade80', '#15803d', '#86efac'],
  amethyst: ['#a855f7', '#c084fc', '#7e22ce', '#f5d0fe'],
};

interface ParticleCanvasProps {
  triggers: ParticleTrigger[];
  width: number;
  height: number;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  triggers,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Spawn new particles when triggers change
  useEffect(() => {
    if (!triggers || triggers.length === 0) return;

    triggers.forEach((trigger) => {
      const colors = GEM_COLORS[trigger.type] || ['#ffffff'];
      const count = trigger.count || 14;

      for (let i = 0; i < count; i++) {
        const speed = 2 + Math.random() * 5;
        const angle = Math.random() * Math.PI * 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = Math.random() > 0.4 ? 'shard' : 'spark';

        particlesRef.current.push({
          x: trigger.x,
          y: trigger.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (Math.random() * 1.5),
          size: 3 + Math.random() * 5,
          color,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.025,
          shape,
          angle: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }

      // If special explosion, add shockwave burst
      if (trigger.isSpecial === 'flame') {
        for (let i = 0; i < 20; i++) {
          const speed = 4 + Math.random() * 7;
          const angle = Math.random() * Math.PI * 2;
          particlesRef.current.push({
            x: trigger.x,
            y: trigger.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 5 + Math.random() * 6,
            color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
            alpha: 1,
            decay: 0.03,
            shape: 'circle',
            angle: 0,
            rotationSpeed: 0,
          });
        }
      }
    });
  }, [triggers]);

  // Main animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const remaining: Particle[] = [];
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gentle gravity
        p.alpha -= p.decay;
        p.angle += p.rotationSpeed;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.fillStyle = p.color;

          if (p.shape === 'shard') {
            ctx.beginPath();
            ctx.moveTo(0, -p.size);
            ctx.lineTo(p.size * 0.7, p.size * 0.7);
            ctx.lineTo(-p.size * 0.7, p.size * 0.7);
            ctx.closePath();
            ctx.fill();
          } else if (p.shape === 'spark') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
          remaining.push(p);
        }
      }

      particlesRef.current = remaining;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
};
