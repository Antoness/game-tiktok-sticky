import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

// ═══════════════════════════════════════════
// 🖼️ IMAGE PRELOADER CACHE FOR HEROES & LOGO
// ═══════════════════════════════════════════
const imageCache = {};

function getHeroImage(heroId) {
  if (!heroId) return null;
  if (!imageCache[heroId]) {
    const img = new Image();
    img.src = `/heroes/${heroId}.png`;
    imageCache[heroId] = img;
  }
  return imageCache[heroId];
}

let logoImage = null;
function getLogoImage() {
  if (!logoImage) {
    logoImage = new Image();
    logoImage.src = '/logo/mlbb_logo.svg';
  }
  return logoImage;
}

// ═══════════════════════════════════════════
// 🔊 WEB AUDIO API — MLBB Combat Synthesizer
// ═══════════════════════════════════════════
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playAttackSound(attackType = 'melee') {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (attackType === 'ranged') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function playSkillSound(skillType) {
  try {
    const ctx = getAudioCtx();
    if (skillType === 'ultimate') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(150, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(400, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.7, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.7);
      osc2.stop(ctx.currentTime + 0.7);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

function playAnnounceSound() {
  try {
    const ctx = getAudioCtx();
    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.04);
      osc.stop(ctx.currentTime + idx * 0.04 + 0.5);
    });
  } catch (e) {}
}

// ═══════════════════════════════════════════
// ⚔️ MAIN ARENA CANVAS COMPONENT
// ═══════════════════════════════════════════
export function ArenaCanvas() {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const {
    champion,
    challenger,
    battleState,
    waitingCountdown,
    damagePopups,
    skillEvent,
    ultimateCutscene,
    mlbbAnnouncer,
    winStreak,
    koAnimation,
  } = useGameStore();

  const stateRef = useRef({
    tick: 0,
    projectiles: [],
    particles: [],
    slashes: [],
    champPos: { x: 0, y: 0, attackOffset: 0 },
    challPos: { x: 0, y: 0, attackOffset: 0 },
    screenShake: 0,
  });

  // Preload logo and current hero images
  useEffect(() => {
    getLogoImage();
    if (champion?.hero?.id) getHeroImage(champion.hero.id);
    if (challenger?.hero?.id) getHeroImage(challenger.hero.id);
  }, [champion, challenger]);

  useEffect(() => {
    if (skillEvent) {
      playSkillSound(skillEvent.skillType);
      stateRef.current.screenShake = skillEvent.skillType === 'ultimate' ? 22 : 10;
    }
  }, [skillEvent]);

  useEffect(() => {
    if (mlbbAnnouncer) {
      playAnnounceSound();
    }
  }, [mlbbAnnouncer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let lastAttackTime = 0;

    const render = (timestamp) => {
      const w = canvas.getBoundingClientRect().width;
      const h = canvas.getBoundingClientRect().height;
      const s = stateRef.current;
      s.tick += 1;

      let shakeX = 0;
      let shakeY = 0;
      if (s.screenShake > 0) {
        shakeX = (Math.random() - 0.5) * s.screenShake;
        shakeY = (Math.random() - 0.5) * s.screenShake;
        s.screenShake *= 0.88;
        if (s.screenShake < 0.3) s.screenShake = 0;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);
      ctx.clearRect(0, 0, w, h);

      // ── 1. DRAW MYTHIC ARENA COMBAT FLOOR WITH OFFICIAL MLBB LOGO ──
      drawMythicArenaFloor(ctx, w, h, s.tick, battleState);

      const centerY = h * 0.54;
      const champBaseX = w * 0.28;
      const challBaseX = w * 0.72;

      // ── 2. ATTACK TIMING & PROJECTILES ──
      if (battleState === 'fighting' && champion && challenger) {
        if (timestamp - lastAttackTime > 700) {
          lastAttackTime = timestamp;

          // Champion Attack
          const champHero = champion.hero;
          if (champHero?.attackType === 'ranged' || champHero?.attackType === 'ranged_melee') {
            s.projectiles.push({
              x: champBaseX + 50,
              y: centerY - 50,
              targetX: challBaseX,
              targetY: centerY - 50,
              speed: 18,
              color: champHero.primaryColor || '#06b6d4',
              type: champHero.weaponType,
              side: 'champion',
            });
            playAttackSound('ranged');
          } else {
            s.champPos.attackOffset = 45;
            s.slashes.push({
              x: challBaseX - 30,
              y: centerY - 50,
              color: champHero?.primaryColor || '#ef4444',
              radius: 55,
              life: 1,
            });
            playAttackSound('melee');
          }

          // Challenger Attack
          const challHero = challenger.hero;
          if (challHero?.attackType === 'ranged' || challHero?.attackType === 'ranged_melee') {
            s.projectiles.push({
              x: challBaseX - 50,
              y: centerY - 50,
              targetX: champBaseX,
              targetY: centerY - 50,
              speed: 18,
              color: challHero.primaryColor || '#ec4899',
              type: challHero.weaponType,
              side: 'challenger',
            });
            playAttackSound('ranged');
          } else {
            s.challPos.attackOffset = -45;
            s.slashes.push({
              x: champBaseX + 30,
              y: centerY - 50,
              color: challHero?.primaryColor || '#f59e0b',
              radius: 55,
              life: 1,
            });
            playAttackSound('melee');
          }
        }
      }

      s.champPos.attackOffset *= 0.82;
      s.challPos.attackOffset *= 0.82;

      const champX = champBaseX + s.champPos.attackOffset;
      const challX = challBaseX + s.challPos.attackOffset;

      // ── 3. UPDATE & DRAW PROJECTILES ──
      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const p = s.projectiles[i];
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist > p.speed) {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;

          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 24;

          if (p.type === 'cannon') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 4;
            ctx.stroke();
          } else if (p.type === 'daggers') {
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p.x - 16, p.y);
            ctx.lineTo(p.x + 16, p.y);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else {
          for (let k = 0; k < 12; k++) {
            s.particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              color: p.color,
              radius: Math.random() * 5 + 2,
              life: 1,
            });
          }
          s.projectiles.splice(i, 1);
        }
      }

      // ── 4. DRAW SLASHES ──
      for (let i = s.slashes.length - 1; i >= 0; i--) {
        const sl = s.slashes[i];
        ctx.save();
        ctx.strokeStyle = sl.color;
        ctx.lineWidth = 7 * sl.life;
        ctx.shadowColor = sl.color;
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(sl.x, sl.y, sl.radius * (2 - sl.life), -0.8, 1.2);
        ctx.stroke();
        ctx.restore();

        sl.life -= 0.12;
        if (sl.life <= 0) s.slashes.splice(i, 1);
      }

      // ── 5. DRAW PARTICLES ──
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.04;

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // ── 6. DRAW REAL MLBB HEROES ──
      if (champion) {
        const isKO = koAnimation === 'champion';
        drawRealMLBBHero(
          ctx,
          champX,
          centerY,
          champion.hero,
          champion.username,
          'left',
          s.tick,
          isKO,
          champion.hp / champion.maxHp,
          skillEvent?.side === 'champion' ? skillEvent : null
        );
      }

      if (challenger) {
        const isKO = koAnimation === 'challenger';
        drawRealMLBBHero(
          ctx,
          challX,
          centerY,
          challenger.hero,
          challenger.username,
          'right',
          s.tick,
          isKO,
          challenger.hp / challenger.maxHp,
          skillEvent?.side === 'challenger' ? skillEvent : null
        );
      } else if (battleState === 'waiting') {
        drawWaitingChallengerHolo(ctx, challBaseX, centerY, s.tick, waitingCountdown);
      }

      // ── 7. DRAW SKILL FX ──
      if (skillEvent) {
        drawSkillSpecialFX(ctx, w, h, skillEvent, s.tick);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', updateSize);
    };
  }, [champion, challenger, battleState, waitingCountdown, koAnimation, skillEvent]);

  // Champion & Challenger HP Percentages
  const champHpPct = champion ? Math.max(0, Math.min(100, (champion.hp / champion.maxHp) * 100)) : 0;
  const challHpPct = challenger ? Math.max(0, Math.min(100, (challenger.hp / challenger.maxHp) * 100)) : 0;

  return (
    <div className="relative w-full h-[930px] flex items-center justify-center overflow-hidden select-none">
      {/* ── TOP MLBB HERO VS STATUS CARDS & HP BARS (REAL PORTRAITS & LARGE FONTS) ── */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[98%] max-w-[1040px] z-30 flex items-center justify-between gap-4">
        {/* CHAMPION CARD */}
        <div className="flex-1 bg-gradient-to-r from-blue-950/95 via-slate-950/95 to-blue-950/80 p-3.5 rounded-2xl border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)] backdrop-blur-xl flex items-center gap-3.5">
          {/* Official Portrait Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-amber-600 border-2 border-amber-300 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)] flex-shrink-0">
            <img
              src={champion?.hero?.portrait || '/portraits/alucard.png'}
              alt={champion?.hero?.name || 'Hero'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-amber-300 font-black text-sm tracking-wider flex items-center gap-1.5">
                <span>👑</span> JUARA ARENA
              </span>
              <span className="text-xs font-black text-amber-300 bg-amber-500/30 px-2.5 py-0.5 rounded-full border border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                🔥 {winStreak}x WINS
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-white font-black text-lg md:text-xl truncate drop-shadow-[0_2px_4px_#000]">
                {champion?.username || 'Menunggu...'}
              </h3>
              <span className="text-xs font-extrabold text-cyan-300 px-2 py-0.5 bg-blue-950 rounded-md border border-cyan-400/60">
                {champion?.hero?.name || 'Hero'}
              </span>
            </div>

            {/* Segmented Thick HP Bar */}
            <div className="w-full h-5 bg-black/90 rounded-full mt-1.5 p-0.5 border-2 border-amber-400/80 overflow-hidden relative shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-300 shadow-[0_0_12px_#34d399]"
                style={{ width: `${champHpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-[0_1px_3px_#000]">
                {champion ? `${Math.ceil(champion.hp)} / ${champion.maxHp} HP` : '0 / 0'}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER VS EMBLEM */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border-2 border-white flex items-center justify-center font-black italic text-slate-950 text-2xl shadow-[0_0_30px_rgba(251,191,36,0.9)] animate-pulse">
            VS
          </div>
        </div>

        {/* CHALLENGER CARD */}
        <div className="flex-1 bg-gradient-to-l from-rose-950/95 via-slate-950/95 to-rose-950/80 p-3.5 rounded-2xl border-2 border-cyan-400 shadow-[0_0_35px_rgba(56,189,248,0.5)] backdrop-blur-xl flex items-center gap-3.5">
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black text-cyan-300 bg-cyan-500/30 px-2.5 py-0.5 rounded-full border border-cyan-400/60">
                PENANTANG
              </span>
              <span className="text-cyan-300 font-black text-sm tracking-wider flex items-center gap-1.5">
                CHALLENGER <span>⚔️</span>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="text-xs font-extrabold text-rose-300 px-2 py-0.5 bg-rose-950 rounded-md border border-rose-400/60">
                {challenger?.hero?.name || (battleState === 'waiting' ? 'Auto Bot 30s' : 'Hero')}
              </span>
              <h3 className="text-white font-black text-lg md:text-xl truncate drop-shadow-[0_2px_4px_#000]">
                {challenger?.username || (battleState === 'waiting' ? `Menunggu (${waitingCountdown}s)` : 'Kosong')}
              </h3>
            </div>

            {/* Segmented Thick HP Bar */}
            <div className="w-full h-5 bg-black/90 rounded-full mt-1.5 p-0.5 border-2 border-cyan-400/80 overflow-hidden relative shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-rose-500 via-red-400 to-rose-300 ml-auto shadow-[0_0_12px_#f43f5e]"
                style={{ width: `${challHpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-[0_1px_3px_#000]">
                {challenger ? `${Math.ceil(challenger.hp)} / ${challenger.maxHp} HP` : '0 / 0'}
              </span>
            </div>
          </div>

          {/* Official Portrait Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-bl from-rose-600 to-cyan-600 border-2 border-cyan-300 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.6)] flex-shrink-0">
            {challenger ? (
              <img
                src={challenger.hero?.portrait || '/portraits/chou.png'}
                alt={challenger.hero?.name || 'Challenger'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl">⏳</span>
            )}
          </div>
        </div>
      </div>

      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* ── ULTIMATE FULLSCREEN CUTSCENE BANNER ── */}
      {ultimateCutscene && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/75 backdrop-blur-md animate-pulse z-40">
          <div className="relative flex flex-col items-center p-8 rounded-3xl border-4 border-amber-400 bg-gradient-to-r from-blue-950/95 via-purple-950/95 to-red-950/95 shadow-[0_0_100px_rgba(251,191,36,0.9)] max-w-2xl text-center">
            <div className="flex items-center gap-4 mb-3">
              <img
                src={ultimateCutscene.hero?.portrait || '/portraits/alucard.png'}
                alt="Ultimate Hero"
                className="w-14 h-14 rounded-full border-2 border-amber-300 object-cover shadow-lg"
              />
              <span className="text-amber-300 font-black tracking-widest text-base uppercase bg-amber-500/30 px-4 py-1.5 rounded-full border-2 border-amber-400">
                🔥 ULTIMATE SKILL ACTIVATED 🔥
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              {ultimateCutscene.skillName}
            </h2>
            <p className="text-cyan-300 font-extrabold mt-3 text-lg md:text-xl tracking-wide italic">
              "{ultimateCutscene.voice}"
            </p>
          </div>
        </div>
      )}

      {/* ── MLBB ANNOUNCER POPUP (SAVAGE / FIRST BLOOD) ── */}
      {mlbbAnnouncer && (
        <div className="absolute top-28 pointer-events-none z-35 animate-bounce flex flex-col items-center">
          <div
            className="px-8 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-xl flex items-center gap-4"
            style={{
              borderColor: mlbbAnnouncer.color,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              boxShadow: `0 0 50px ${mlbbAnnouncer.color}aa`,
            }}
          >
            <span className="text-4xl">🏆</span>
            <div>
              <h3
                className="text-3xl md:text-4xl font-black italic tracking-widest uppercase"
                style={{ color: mlbbAnnouncer.color, textShadow: `0 0 20px ${mlbbAnnouncer.color}` }}
              >
                {mlbbAnnouncer.title}
              </h3>
              {mlbbAnnouncer.subtitle && (
                <p className="text-sm text-slate-200 font-bold tracking-wider">
                  {mlbbAnnouncer.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SKILL 1 / SKILL 2 EVENT FLOATER ── */}
      {skillEvent && skillEvent.skillType !== 'ultimate' && (
        <div
          className={`absolute bottom-8 pointer-events-none z-20 transition-all duration-300 ${
            skillEvent.side === 'champion' ? 'left-8' : 'right-8'
          }`}
        >
          <div
            className="px-5 py-2.5 rounded-2xl border-2 flex items-center gap-3 shadow-2xl backdrop-blur-xl animate-bounce"
            style={{
              borderColor: skillEvent.color,
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              boxShadow: `0 0 30px ${skillEvent.color}88`,
            }}
          >
            <span className="text-2xl">{skillEvent.icon}</span>
            <div>
              <span className="text-xs font-black text-slate-300 block uppercase">
                {skillEvent.skillType === 'skill1' ? 'Skill 1' : 'Skill 2'} ({skillEvent.hero?.name})
              </span>
              <span
                className="text-base font-black tracking-wide"
                style={{ color: skillEvent.color }}
              >
                {skillEvent.skillName}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── DAMAGE & HEAL POPUPS ── */}
      {damagePopups.map((popup) => (
        <div
          key={popup.id}
          className={`absolute pointer-events-none z-25 font-black text-2xl tracking-wider animate-float-up flex items-center gap-1 ${
            popup.side === 'champion' ? 'left-[26%]' : 'left-[70%]'
          } top-[42%]`}
          style={{
            color:
              popup.type === 'heal'
                ? '#4ade80'
                : popup.type === 'ultimate'
                ? '#f59e0b'
                : '#ef4444',
            textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 20px currentColor',
          }}
        >
          {popup.skillIcon && <span>{popup.skillIcon}</span>}
          <span>{popup.type === 'heal' ? `+${popup.value}` : `-${popup.value}`}</span>
          {popup.isCrit && (
            <span className="text-xs px-2 py-0.5 bg-amber-400 text-black font-black rounded-md shadow-md">
              CRIT
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function drawMythicArenaFloor(ctx, w, h, tick, battleState) {
  const cx = w * 0.5;
  const cy = h * 0.54;
  const rx = w * 0.47;
  const ry = h * 0.32;

  ctx.save();

  // 1. Outer Glowing Mythic Battlefield Ring
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy, ry * 0.2, cx, cy, rx);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
  grad.addColorStop(0.65, 'rgba(11, 25, 46, 0.95)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = '#38bdf8';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 25;
  ctx.stroke();

  // 2. Golden Inner Mythic Inscriptions
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.75, ry * 0.75, 0, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 18;
  ctx.stroke();

  // 3. OFFICIAL MOBILE LEGENDS LOGO AS BATTLEFIELD FLOOR EMBLEM
  const logo = getLogoImage();
  if (logo && logo.complete && logo.naturalWidth > 0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = 0.22; // Subtle elegant floor watermark
    const logoW = 340;
    const logoH = 90;
    ctx.drawImage(logo, -logoW / 2, -logoH / 2, logoW, logoH);
    ctx.restore();
  }

  // 4. Rotating Energy Runes
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tick * 0.005);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * (rx * 0.6), Math.sin(angle) * (ry * 0.6), 6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function drawRealMLBBHero(ctx, x, y, hero, username, side, tick, isKO, hpRatio, skillEvent) {
  if (!hero) return;

  const flip = side === 'left' ? 1 : -1;
  const isChamp = side === 'left';
  const themeColor = isChamp ? '#fbbf24' : '#38bdf8';
  const heroColor = hero.primaryColor || themeColor;

  // Combat animation cycles
  const idleBounce = Math.sin(tick * 0.15) * 5;
  const legCycle = Math.sin(tick * 0.2);
  const armCycle = Math.cos(tick * 0.2);

  ctx.save();
  ctx.translate(x, y + idleBounce);

  if (isKO) {
    ctx.rotate(flip * 1.5);
    ctx.globalAlpha = 0.4;
  }

  // ── 1. GLOWING HERO AURA BASE ──
  ctx.save();
  const auraGrad = ctx.createRadialGradient(0, -60, 10, 0, -60, 80);
  auraGrad.addColorStop(0, `${heroColor}66`);
  auraGrad.addColorStop(0.6, `${themeColor}22`);
  auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, -60, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 2. DYNAMIC HERO CAPE (Waving with Wind) ──
  ctx.save();
  const capeWave1 = Math.sin(tick * 0.18) * 12;
  const capeWave2 = Math.cos(tick * 0.18 + 1) * 15;
  ctx.fillStyle = isChamp ? 'rgba(239, 68, 68, 0.85)' : 'rgba(14, 165, 233, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, -85);
  ctx.quadraticCurveTo(-flip * 35 + capeWave1, -60, -flip * 55 + capeWave2, -20);
  ctx.lineTo(-flip * 35 + capeWave1, -15);
  ctx.quadraticCurveTo(-flip * 20, -50, 0, -75);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── 3. ANIMATED STICKMAN LEGS ──
  ctx.save();
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1e293b';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;

  // Left Leg (Back)
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(-flip * 18 - legCycle * 8, -15);
  ctx.lineTo(-flip * 22 - legCycle * 12, 0);
  ctx.stroke();

  // Right Leg (Front)
  ctx.strokeStyle = heroColor;
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(flip * 18 + legCycle * 8, -15);
  ctx.lineTo(flip * 22 + legCycle * 12, 0);
  ctx.stroke();

  // Armored Boots
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.arc(-flip * 22 - legCycle * 12, 0, 6, 0, Math.PI * 2);
  ctx.arc(flip * 22 + legCycle * 12, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 4. STICKMAN TORSO & HERO CHESTPLATE ──
  ctx.save();
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, -85);
  ctx.lineTo(0, -35);
  ctx.stroke();

  // Hero Chestplate Armor (Glowing Emblem)
  ctx.lineWidth = 8;
  ctx.strokeStyle = heroColor;
  ctx.shadowColor = heroColor;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.lineTo(0, -45);
  ctx.stroke();

  // Center Emblem Gem
  ctx.fillStyle = themeColor;
  ctx.beginPath();
  ctx.arc(0, -62, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── 5. ANIMATED ARMS & HERO WEAPONS ──
  ctx.save();
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.strokeStyle = heroColor;
  ctx.shadowColor = heroColor;
  ctx.shadowBlur = 10;

  // Back Arm
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.lineTo(-flip * 20, -60 - armCycle * 6);
  ctx.lineTo(-flip * 32, -45);
  ctx.stroke();

  // Front Combat Arm (Aiming/Slashing forward)
  const handX = flip * 32;
  const handY = -68 + armCycle * 8;
  ctx.beginPath();
  ctx.moveTo(0, -78);
  ctx.lineTo(flip * 18, -72);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  // ── DRAW AUTHENTIC HERO WEAPON ON HAND ──
  ctx.save();
  ctx.translate(handX, handY);

  if (hero.id === 'alucard') {
    // Alucard Greatsword
    ctx.rotate(flip * 0.4 + armCycle * 0.2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.fillRect(0, -8, flip * 60, 10);
    // Gold Crossguard
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, -14, flip * 6, 22);
  } else if (hero.id === 'chou' || hero.id === 'paquito') {
    // Glowing Boxing / Karate Fist Aura
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (hero.id === 'layla' || hero.id === 'granger') {
    // Cannon / Heavy Gun
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.fillRect(0, -7, flip * 45, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(flip * 35, -5, flip * 10, 10);
  } else if (hero.id === 'gusion') {
    // Shadow Daggers
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(flip * 32, 0);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
  } else if (hero.id === 'zilong') {
    // Dragon Spear
    ctx.rotate(flip * 0.2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-flip * 20, -3, flip * 75, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(flip * 55, -8);
    ctx.lineTo(flip * 80, 0);
    ctx.lineTo(flip * 55, 8);
    ctx.closePath();
    ctx.fill();
  } else if (hero.id === 'balmond') {
    // Berserker Battle Axe
    ctx.rotate(flip * 0.3);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -4, flip * 45, 8);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(flip * 35, 0, 20, -1, 1);
    ctx.fill();
  } else if (hero.id === 'miya') {
    // Moonlight Bow
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(flip * 15, 0, 26, -1.2, 1.2);
    ctx.stroke();
  } else if (hero.id === 'saber') {
    // Dual Plasma Katana
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 20;
    ctx.fillRect(0, -6, flip * 55, 6);
    ctx.fillRect(-flip * 10, -18, flip * 45, 6);
  } else {
    // Hero Weapon Fallback
    ctx.fillStyle = heroColor;
    ctx.shadowColor = heroColor;
    ctx.shadowBlur = 15;
    ctx.fillRect(0, -5, flip * 40, 8);
  }
  ctx.restore();
  ctx.restore();

  // ── 6. REAL OFFICIAL MLBB HERO FACE / HEAD PORTRAIT ──
  const heroImg = getHeroImage(hero.id);
  const headY = -120;
  const headRadius = 36;

  ctx.save();
  ctx.translate(0, headY);

  // Rotating Runic Halo around Head
  ctx.save();
  ctx.rotate(tick * 0.03);
  ctx.strokeStyle = `${themeColor}aa`;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(0, 0, headRadius + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Clip and draw Real MLBB Hero Face
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
  ctx.clip();

  if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
    const drawSize = headRadius * 2.3;
    ctx.drawImage(heroImg, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  } else {
    ctx.fillStyle = heroColor;
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Golden / Cyan Headband Border
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = themeColor;
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // ── 7. ESPORTS DARK GLASS NAMEPLATE HUD (POSITIONED SAFELY BELOW FEET) ──
  ctx.save();
  const plateW = 210;
  const plateH = 48;
  const plateX = -plateW / 2;
  const plateY = 48; // Sits with clean breathing room below the boots

  // Background Nameplate Pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.strokeStyle = isChamp ? 'rgba(251, 191, 36, 0.85)' : 'rgba(56, 189, 248, 0.85)';
  ctx.lineWidth = 2;
  ctx.shadowColor = isChamp ? 'rgba(251, 191, 36, 0.4)' : 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateW, plateH, 12);
  ctx.fill();
  ctx.stroke();

  // Player Username
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 17px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;
  const nameToDisplay = username || hero.name;
  ctx.fillText(nameToDisplay.length > 16 ? nameToDisplay.substring(0, 15) + '...' : nameToDisplay, 0, plateY + 21);

  // Hero Name & Role Badge
  ctx.fillStyle = isChamp ? '#fbbf24' : '#7dd3fc';
  ctx.font = '900 12px sans-serif';
  ctx.shadowColor = isChamp ? '#eab308' : '#0284c7';
  ctx.shadowBlur = 6;
  ctx.fillText(`${hero.roleIcon} ${hero.name} • ${hero.title}`, 0, plateY + 39);

  ctx.restore();

  ctx.restore();
}

function drawWaitingChallengerHolo(ctx, x, y, tick, countdown) {
  ctx.save();
  ctx.translate(x, y);

  // Holographic Glowing Rings
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, -60, 75, 0, Math.PI * 2);
  ctx.stroke();

  // Hologram Silhouette
  ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
  ctx.beginPath();
  ctx.arc(0, -110, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(-25, -80, 50, 80, 10);
  ctx.fill();

  // 30s Countdown Text (Big & Bold on top of hologram)
  ctx.fillStyle = '#facc15';
  ctx.font = '900 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 25;
  ctx.fillText(`${countdown}s`, 0, -135);

  // Status Box under hologram
  ctx.save();
  const boxW = 220;
  const boxH = 54;
  const boxX = -boxW / 2;
  const boxY = 38;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#e0f2fe';
  ctx.font = '900 14px sans-serif';
  ctx.fillText('MENUNGGU PENANTANG', 0, boxY + 22);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 13px sans-serif';
  ctx.fillText('Ketik JOIN di Live!', 0, boxY + 42);
  ctx.restore();

  ctx.restore();
}

function drawSkillSpecialFX(ctx, w, h, skillEvent, tick) {
  const isChamp = skillEvent.side === 'champion';
  const sourceX = isChamp ? w * 0.32 : w * 0.68;
  const targetX = isChamp ? w * 0.72 : w * 0.28;
  const cy = h * 0.64;

  ctx.save();

  if (skillEvent.skillType === 'ultimate') {
    ctx.lineWidth = 32 + Math.sin(tick * 0.5) * 8;
    ctx.strokeStyle = skillEvent.color || '#ef4444';
    ctx.shadowColor = skillEvent.color || '#ef4444';
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.moveTo(sourceX, cy - 45);
    ctx.lineTo(targetX, cy - 45);
    ctx.stroke();

    ctx.lineWidth = 12;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(sourceX, cy - 45);
    ctx.lineTo(targetX, cy - 45);
    ctx.stroke();
  } else {
    ctx.fillStyle = `${skillEvent.color || '#38bdf8'}55`;
    ctx.beginPath();
    ctx.moveTo(sourceX, cy - 45);
    ctx.lineTo(targetX, cy - 90);
    ctx.lineTo(targetX, cy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export default ArenaCanvas;
