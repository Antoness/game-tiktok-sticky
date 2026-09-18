import { useEffect, useRef } from 'react';

export function CyberpunkArena() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // Floating Starlight & Magic Runes
    const particles = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -Math.random() * 1.5 - 0.4,
        radius: Math.random() * 3.5 + 1.2,
        color: ['#38bdf8', '#fbbf24', '#e879f9', '#60a5fa', '#f59e0b', '#34d399'][Math.floor(Math.random() * 6)],
        alpha: Math.random() * 0.8 + 0.2,
      });
    }

    let animId;
    let tick = 0;

    const draw = () => {
      tick++;

      // ── 1. LAND OF DAWN DEEP CELESTIAL SKY GRADIENT ──
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.25, '#07152e');
      skyGrad.addColorStop(0.55, '#0b1e42');
      skyGrad.addColorStop(0.8, '#081226');
      skyGrad.addColorStop(1, '#020617');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // ── 2. CELESTIAL SANCTUM AURORA BEAMS ──
      ctx.save();
      const auroraGrad = ctx.createRadialGradient(W * 0.5, H * 0.32, 60, W * 0.5, H * 0.32, W * 0.65);
      auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
      auroraGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.16)');
      auroraGrad.addColorStop(0.75, 'rgba(234, 179, 8, 0.08)');
      auroraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // ── 3. FLOATING STARLIGHT & GOLD EMBERS ──
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = H;
          p.x = Math.random() * W;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha * (Math.sin(tick * 0.05 + p.x) * 0.3 + 0.7);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '1080px', height: '1920px', pointerEvents: 'none', zIndex: 0 }} />;
}

export default CyberpunkArena;
