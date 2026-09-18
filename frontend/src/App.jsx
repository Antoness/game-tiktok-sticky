import Header from './components/UI/Header.jsx';
import QueuePanel from './components/UI/QueuePanel.jsx';
import LeaderboardPanel from './components/UI/LeaderboardPanel.jsx';
import MockControls from './components/UI/MockControls.jsx';
import MusicController from './components/UI/MusicController.jsx';
import ArenaCanvas from './components/Arena/ArenaCanvas.jsx';
import CyberpunkArena from './components/Background/CyberpunkArena.jsx';
import { useGameSocket } from './hooks/useGameSocket.js';
import { useGameStore } from './store/gameStore.js';
import { useEffect, useRef } from 'react';

// ─── Particle effect for ambient atmosphere ───
function AmbientParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
    size: 2 + Math.random() * 4,
    color: Math.random() > 0.5 ? 'rgba(0,200,255,0.4)' : 'rgba(255,215,0,0.3)',
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 55, overflow: 'hidden' }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          bottom: '0',
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: '50%',
          background: p.color,
          animation: `floatUp ${p.duration}s ease-out ${p.delay}s infinite`,
          boxShadow: `0 0 6px ${p.color}`,
        }} />
      ))}
    </div>
  );
}

// ─── Game Scale Wrapper ───────────────────────
// Scales the 1080×1920 canvas to fit any screen size, perfectly centered
function GameScaler({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / 1080, vh / 1920);
      containerRef.current.style.transform = `scale(${scale})`;
      containerRef.current.style.transformOrigin = 'center center';
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#020617',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div
        ref={containerRef}
        style={{
          width: '1080px',
          height: '1920px',
          position: 'relative',
          transformOrigin: 'center center',
          flexShrink: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────
export default function App() {
  // Connect to WebSocket
  useGameSocket();
  const startAutoBotLoop = useGameStore(state => state.startAutoBotLoop);

  useEffect(() => {
    startAutoBotLoop();
  }, [startAutoBotLoop]);

  return (
    <GameScaler>
      <div
        id="game-root"
        className="game-container"
        style={{ width: '1080px', height: '1920px', position: 'relative' }}
      >
        {/* ── Background Stadium ── */}
        <CyberpunkArena />

        {/* ── Ambient Particles ── */}
        <AmbientParticles />

        {/* ── Music Controller (BGM Arcade Synth) ── */}
        <MusicController />

        {/* ── Header: Title + Win Streak + 5-Skill Interaction Guide ── */}
        <Header />

        {/* ── Main Arena: Ring + MLBB Heroes + VS Cards + HP Bars (930px height) ── */}
        <div style={{ position: 'relative', width: '1080px', height: '930px' }}>
          <ArenaCanvas />
        </div>

        {/* ── Lower Deck: Dual Panel (Queue + Leaderboard) (590px height) ── */}
        <div style={{
          position: 'absolute',
          top: '1260px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1040px',
          height: '590px',
          display: 'flex',
          gap: '20px',
          zIndex: 70,
        }}>
          {/* Left: Active Fighters Queue */}
          <QueuePanel />

          {/* Right: Hall of Fame Leaderboard */}
          <LeaderboardPanel />
        </div>

        {/* ── Bottom Esports Broadcast Ticker Bar (fills 1860-1910px) ── */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1040px',
          height: '42px',
          background: 'linear-gradient(90deg, rgba(15,23,42,0.95), rgba(30,58,138,0.95), rgba(15,23,42,0.95))',
          border: '2px solid rgba(56,189,248,0.6)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          boxShadow: '0 0 25px rgba(6,182,212,0.3)',
          zIndex: 75,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: '#38bdf8', fontWeight: 900, fontSize: '13px', letterSpacing: '1px' }}>
              MOBILE LEGENDS DUEL ARENA
            </span>
          </div>
          <div style={{ color: '#facc15', fontWeight: 900, fontSize: '13px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            ⚔️ KETIK <span style={{ color: '#fff', background: '#2563eb', padding: '2px 8px', borderRadius: '6px' }}>JOIN</span> DI LIVE CHAT UNTUK MEMILIH HERO & BERTARUNG! ⚔️
          </div>
          <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '12px' }}>
            TIKTOK INTERACTIVE GAME
          </div>
        </div>

        {/* ── Mock Controls (bottom, for OBS testing) ── */}
        <MockControls />
      </div>
    </GameScaler>
  );
}

