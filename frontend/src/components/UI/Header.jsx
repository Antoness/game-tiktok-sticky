import { useGameStore } from '../../store/gameStore';

export function Header() {
  const { tiktokConnected, winStreak } = useGameStore();

  return (
    <header className="relative z-20 flex flex-col items-center pt-3 pb-2 px-6 w-full select-none">
      {/* ── TOP MLBB OFFICIAL LOGO & STATUS BAR ── */}
      <div className="flex items-center justify-between w-full max-w-[1020px] mb-2">
        {/* TikTok Live Status */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-900/95 via-blue-950/90 to-slate-900/95 border-2 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-xl">
          <span className={`w-3.5 h-3.5 rounded-full ${tiktokConnected ? 'bg-emerald-400 animate-ping shadow-[0_0_12px_#34d399]' : 'bg-amber-400'}`} />
          <span className="text-sm font-black tracking-wider text-cyan-200">
            {tiktokConnected ? '🔴 TIKTOK LIVE AKTIF' : '⚡ TIKTOK CONNECTED'}
          </span>
        </div>

        {/* Center Official MLBB Logo Banner */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo/mlbb_logo.svg"
            alt="Mobile Legends Bang Bang"
            className="h-16 md:h-20 object-contain filter drop-shadow-[0_4px_20px_rgba(251,191,36,0.8)] animate-pulse"
          />
          <span className="text-xs font-black text-cyan-300 tracking-[0.35em] uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] -mt-1">
            ⚔️ LAND OF DAWN BATTLE ARENA ⚔️
          </span>
        </div>

        {/* Win Streak Pill */}
        <div className="flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-950/95 via-yellow-900/90 to-amber-950/95 border-2 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.6)] backdrop-blur-xl">
          <span className="text-xl">🔥</span>
          <span className="text-sm font-black text-amber-300 tracking-wider">
            STREAK: {winStreak}x WIN
          </span>
        </div>
      </div>

      {/* ── LIVE INTERACTION & SKILL GUIDE BAR (EXTRA LARGE & SUPER READABLE) ── */}
      <div className="w-full max-w-[1040px] grid grid-cols-5 gap-3 p-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/80 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.95)]">
        {/* 1. Chat Join */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-blue-900/70 to-blue-950/95 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-2xl md:text-3xl">💬</span>
            <span className="text-base md:text-lg font-black text-cyan-200 uppercase tracking-wider drop-shadow">"JOIN"</span>
          </div>
          <span className="text-xs md:text-sm font-black text-cyan-300 px-3 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-400/70 shadow-sm">
            GRATIS
          </span>
          <span className="text-xs font-extrabold text-slate-200 mt-1.5 text-center">Masuk Antrean</span>
        </div>

        {/* 2. Like 50x */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-rose-900/70 to-rose-950/95 border-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.35)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-2xl md:text-3xl">❤️</span>
            <span className="text-base md:text-lg font-black text-rose-200 uppercase tracking-wider drop-shadow">LIKE 50x</span>
          </div>
          <span className="text-xs md:text-sm font-black text-rose-300 px-3 py-0.5 rounded-full bg-rose-500/30 border border-rose-400/70 shadow-sm">
            AUTO JOIN
          </span>
          <span className="text-xs font-extrabold text-slate-200 mt-1.5 text-center">Masuk Otomatis</span>
        </div>

        {/* 3. Gift 20 Koin - Skill 1 */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-amber-900/70 to-amber-950/95 border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.4)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-2xl md:text-3xl">💥</span>
            <span className="text-base md:text-lg font-black text-amber-200 uppercase tracking-wider drop-shadow">20 🪙 SKILL 1</span>
          </div>
          <span className="text-xs md:text-sm font-black text-amber-300 px-3 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/70 shadow-sm">
            +75 HP
          </span>
          <span className="text-xs font-extrabold text-amber-100 mt-1.5 text-center">Burst Damage</span>
        </div>

        {/* 4. Gift 50 Koin - Skill 2 */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-purple-900/70 to-purple-950/95 border-2 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.4)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-2xl md:text-3xl">🌀</span>
            <span className="text-base md:text-lg font-black text-purple-200 uppercase tracking-wider drop-shadow">50 🪙 SKILL 2</span>
          </div>
          <span className="text-xs md:text-sm font-black text-purple-300 px-3 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/70 shadow-sm">
            +150 HP
          </span>
          <span className="text-xs font-extrabold text-purple-100 mt-1.5 text-center">Combo Strike FX</span>
        </div>

        {/* 5. Gift 100+ Koin - ULTIMATE */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-red-900/90 via-amber-900/90 to-red-950/95 border-2 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-2xl md:text-3xl">🔥</span>
            <span className="text-base md:text-lg font-black text-yellow-300 uppercase tracking-wider drop-shadow">100 🪙 ULTI</span>
          </div>
          <span className="text-xs md:text-sm font-black text-red-200 px-3 py-0.5 rounded-full bg-red-500/40 border border-red-300/80 shadow-sm">
            +300 HP
          </span>
          <span className="text-xs font-black text-yellow-200 mt-1.5 text-center">FULLSCREEN FX</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
