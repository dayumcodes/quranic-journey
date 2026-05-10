"use client";
import { useEffect, useRef } from "react";
import { useThemeStore } from "@/lib/store/themeStore";

export default function ReflectCanvasMesh() {
  const theme = useThemeStore((s) => s.theme);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animationFrameId = 0;
    const isDark = theme === "dark";
    const blobs = isDark
      ? [{ r: 350, color: "rgba(42,107,94,0.18)", speed: 0.001, t: 0 }, { r: 280, color: "rgba(184,148,63,0.12)", speed: 0.0015, t: 100 }, { r: 400, color: "rgba(8,10,14,0.9)", speed: 0.0008, t: 50 }, { r: 250, color: "rgba(30,41,59,0.4)", speed: 0.0012, t: 200 }]
      : [{ r: 380, color: "rgba(42,107,94,0.14)", speed: 0.001, t: 0 }, { r: 300, color: "rgba(184,148,63,0.18)", speed: 0.0015, t: 100 }, { r: 420, color: "rgba(245,242,235,0.95)", speed: 0.0008, t: 50 }, { r: 260, color: "rgba(148,163,184,0.22)", speed: 0.0012, t: 200 }];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize); resize();
    const render = () => { if (document.hidden) { animationFrameId = requestAnimationFrame(render); return; } ctx.clearRect(0,0,canvas.width,canvas.height); ctx.globalCompositeOperation = "screen"; blobs.forEach((b) => { b.t += b.speed; const x = canvas.width/2 + Math.sin(b.t) * (canvas.width * 0.3) + Math.cos(b.t * 0.8) * 100; const y = canvas.height/2 + Math.cos(b.t * 1.1) * (canvas.height * 0.3) + Math.sin(b.t * 0.9) * 100; ctx.beginPath(); for(let a=0; a<Math.PI*2; a+=0.1) { const noise = Math.sin(a*3 + b.t*2)*20 + Math.cos(a*5 - b.t)*15; const px = x + (b.r + noise) * Math.cos(a); const py = y + (b.r + noise) * Math.sin(a); if(a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py); } ctx.closePath(); ctx.fillStyle = b.color; ctx.fill(); }); animationFrameId = requestAnimationFrame(render); };
    render();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animationFrameId); };
  }, [theme]);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
