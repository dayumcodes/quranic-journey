"use client";

import { useEffect, useRef } from "react";

interface ParticleBurstProps {
  trigger: boolean;
  color: string;
  x?: string;
  y?: string;
  count?: number;
}

export default function ParticleBurst({ trigger, color, x, y, count = 40 }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!trigger || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrame = 0;
    const particles = Array.from({ length: count }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      angle: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 6,
      radius: 1 + Math.random() * 3,
      life: 1,
      decay: 0.015 + Math.random() * 0.02
    }));
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;
      particles.forEach((p) => {
        if (p.life > 0) {
          active = true;
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed + 0.8;
          p.life -= p.decay;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = color.replace(")", `, ${p.life})`).replace("rgb", "rgba");
          ctx.fill();
        }
      });
      if (active) animationFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [trigger, color, count]);
  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-50"
      style={{ left: x || "50%", top: y || "50%" }}
    />
  );
}
