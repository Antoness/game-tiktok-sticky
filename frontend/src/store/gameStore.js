import { create } from 'zustand';
import { getRandomHero } from '../data/mlbbHeroes';

// ─── Constants ───────────────────────────
const BASE_HP = 100;
const COMBAT_INTERVAL_MS = 800; // Irama serangan setiap 0.8 detik
const DAMAGE_MIN = 8;
const DAMAGE_MAX = 16;
const KO_DELAY_MS = 2200;

let combatTimer = null;
let popupIdCounter = 0;

function randomDamage() {
  return Math.floor(Math.random() * (DAMAGE_MAX - DAMAGE_MIN + 1)) + DAMAGE_MIN;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── MLBB Bot Generator ──────────────────
const BOT_TITLES = [
  'MythicGlory', 'ProPlayer', 'SavageKing',
  'LordMaster', 'FastHand', 'HyperCarry',
  'RoamerGod', 'MidLaner', 'GoldLaner',
  'ExpLaner', 'TopGlobal', 'Unstoppable'
];

function generateBotPlayer() {
  const hero = getRandomHero();
  const title = BOT_TITLES[Math.floor(Math.random() * BOT_TITLES.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  const username = `Bot_${hero.name}_${num}`;
  const baseHp = 100;

  return {
    username,
    title,
    hero,
    hp: baseHp,
    maxHp: baseHp,
    source: 'bot',
    avatar: hero.avatar || '⚔️',
    wins: 0,
  };
}

let autoBotTimer = null;
let countdownInterval = null;

// ─── Game Store ──────────────────────────
export const useGameStore = create((set, get) => ({
  // ── State ──
  champion: null,   // { username, hero, hp, maxHp, wins, avatar, source }
  challenger: null, // { username, hero, hp, maxHp, avatar, source }
  queue: [],
  leaderboard: [],  // [{ username, wins, maxStreak, avatar, heroName }]
  winStreak: 0,
  battleState: 'idle', // 'idle' | 'fighting' | 'ko' | 'waiting'
  waitingCountdown: 0, // 30s countdown before bot spawns
  damagePopups: [],     // [{ id, side, value, type, isCrit, skillIcon }]
  giftFlash: null,      // { username, side, hpBonus, giftName }
  skillEvent: null,     // { side, hero, skillType, skillName, damage, heal, icon, color }
  ultimateCutscene: null, // { side, hero, skillName, voice }
  mlbbAnnouncer: null,  // { title, subtitle, color, icon }
  streakAnimation: false,
  koAnimation: null,    // 'champion' | 'challenger'
  tiktokConnected: false,
  lastEvent: null,

  // ── Actions ──
  setTikTokStatus: (connected) => set({ tiktokConnected: connected }),

  setQueue: (rawQueue) => {
    const queue = (rawQueue || []).map(p => ({
      ...p,
      hero: p.hero || getRandomHero(),
      hp: p.hp || BASE_HP,
      maxHp: p.maxHp || BASE_HP,
    }));
    set({ queue });
  },

  // 30-Second Challenger Waiting Countdown
  startWaitingForChallenger: () => {
    if (countdownInterval) clearInterval(countdownInterval);
    set({ battleState: 'waiting', waitingCountdown: 30, challenger: null });

    countdownInterval = setInterval(() => {
      const { queue, champion, waitingCountdown } = get();

      // Jika ada penonton yang join di antrean
      if (queue.length > 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        const nextChallenger = {
          ...queue[0],
          hero: queue[0].hero || getRandomHero(),
          hp: queue[0].hp || BASE_HP,
          maxHp: queue[0].maxHp || BASE_HP,
        };
        set({
          challenger: nextChallenger,
          queue: queue.slice(1),
          battleState: 'fighting',
          waitingCountdown: 0,
        });
        get()._runCombatTick();
        return;
      }

      // Hitung mundur berkurang
      if (waitingCountdown > 1) {
        set({ waitingCountdown: waitingCountdown - 1 });
      } else {
        // Waktu 30 detik habis tanpa penonton asli -> Spawn 1 Bot sebagai penantang!
        clearInterval(countdownInterval);
        countdownInterval = null;
        const botChallenger = generateBotPlayer();
        set({
          challenger: botChallenger,
          battleState: 'fighting',
          waitingCountdown: 0,
        });
        get()._runCombatTick();
      }
    }, 1000);
  },

  // Auto Bot Loop
  checkAndAutoFillBots: () => {
    const { champion, challenger, battleState } = get();

    if (!champion && !challenger && battleState === 'idle') {
      const bot1 = generateBotPlayer();
      const bot2 = generateBotPlayer();
      set({
        champion: bot1,
        challenger: bot2,
        battleState: 'fighting',
      });
      get()._runCombatTick();
    }
  },

  startAutoBotLoop: () => {
    if (autoBotTimer) clearInterval(autoBotTimer);
    get().checkAndAutoFillBots();
    autoBotTimer = setInterval(() => {
      get().checkAndAutoFillBots();
    }, 10000);
  },

  addToQueue: (player) => {
    const { queue, champion, challenger, battleState } = get();
    if (champion?.username === player.username) return;
    if (challenger?.username === player.username) return;
    if (queue.find(u => u.username === player.username)) return;

    const fullPlayer = {
      ...player,
      hero: player.hero || getRandomHero(),
      hp: player.hp || BASE_HP,
      maxHp: player.maxHp || BASE_HP,
    };

    // Jika sedang dalam countdown 30 detik menunggu lawan, langsung jadikan Challenger!
    if (battleState === 'waiting' && !challenger) {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;
      set({
        challenger: fullPlayer,
        battleState: 'fighting',
        waitingCountdown: 0,
      });
      get()._runCombatTick();
      return;
    }

    set({ queue: [...queue, fullPlayer] });
  },

  // ── Trigger Hero Skill (Skill 1, Skill 2, Ultimate) ──
  triggerHeroSkill: (side, skillType) => {
    const { champion, challenger, battleState } = get();
    if (battleState !== 'fighting') return;

    const actor = side === 'champion' ? champion : challenger;
    const target = side === 'champion' ? challenger : champion;
    if (!actor || !target || !actor.hero) return;

    const hero = actor.hero;
    const skill = hero[skillType] || hero.skill1;

    const damage = skill.damage || 40;
    const heal = skill.heal || 30;

    const newTargetHp = clamp(target.hp - damage, 0, target.maxHp);
    const newActorHp = clamp(actor.hp + heal, 0, actor.maxHp + 50);

    const popups = [...get().damagePopups];
    const dmgPopupId = ++popupIdCounter;
    const healPopupId = ++popupIdCounter;

    const targetSide = side === 'champion' ? 'challenger' : 'champion';
    popups.push({
      id: dmgPopupId,
      side: targetSide,
      value: damage,
      type: skillType === 'ultimate' ? 'ultimate' : 'skill',
      isCrit: true,
      skillIcon: skill.icon,
    });
    popups.push({
      id: healPopupId,
      side,
      value: heal,
      type: 'heal',
      isCrit: false,
      skillIcon: '💚',
    });

    const skillPayload = {
      side,
      hero,
      skillType,
      skillName: skill.name,
      damage,
      heal,
      icon: skill.icon,
      color: skill.color,
      timestamp: Date.now(),
    };

    if (skillType === 'ultimate') {
      set({
        ultimateCutscene: {
          side,
          hero,
          skillName: skill.name,
          voice: skill.voice || `${hero.name} ULTIMATE!`,
          timestamp: Date.now(),
        },
        skillEvent: skillPayload,
        champion: side === 'champion' ? { ...champion, hp: newActorHp } : { ...champion, hp: newTargetHp },
        challenger: side === 'challenger' ? { ...challenger, hp: newActorHp } : { ...challenger, hp: newTargetHp },
        damagePopups: popups,
      });

      setTimeout(() => {
        set({ ultimateCutscene: null });
      }, 2500);
    } else {
      set({
        skillEvent: skillPayload,
        champion: side === 'champion' ? { ...champion, hp: newActorHp } : { ...champion, hp: newTargetHp },
        challenger: side === 'challenger' ? { ...challenger, hp: newActorHp } : { ...challenger, hp: newTargetHp },
        damagePopups: popups,
      });
    }

    setTimeout(() => {
      set((s) => ({
        damagePopups: s.damagePopups.filter(p => p.id !== dmgPopupId && p.id !== healPopupId),
        skillEvent: s.skillEvent?.timestamp === skillPayload.timestamp ? null : s.skillEvent,
      }));
    }, 1800);
  },

  // ── Apply Gift / Coin Skill Trigger ──
  applyGiftHeal: ({ username, diamonds, hpBonus }) => {
    const { champion, challenger, battleState } = get();
    const coinCount = diamonds || Math.round((hpBonus || 25) / 25);

    let side = null;
    if (champion?.username === username) side = 'champion';
    else if (challenger?.username === username) side = 'challenger';

    // Jika pemain yang mengirim gift sedang di ring
    if (side && battleState === 'fighting') {
      if (coinCount >= 100) {
        // 🔥 ULTIMATE SKILL (100+ Koin)
        get().triggerHeroSkill(side, 'ultimate');
      } else if (coinCount >= 50) {
        // ⚡ SKILL 2 (50 - 99 Koin)
        get().triggerHeroSkill(side, 'skill2');
      } else if (coinCount >= 20) {
        // 💥 SKILL 1 (20 - 49 Koin)
        get().triggerHeroSkill(side, 'skill1');
      } else {
        // 💚 BASIC HEAL / BUFF (1 - 19 Koin)
        const current = side === 'champion' ? champion : challenger;
        const newHp = clamp(current.hp + (hpBonus || 25), 0, current.maxHp + 30);
        const id = ++popupIdCounter;

        set({
          champion: side === 'champion' ? { ...champion, hp: newHp } : champion,
          challenger: side === 'challenger' ? { ...challenger, hp: newHp } : challenger,
          giftFlash: { username, side, hpBonus: hpBonus || 25 },
          damagePopups: [...get().damagePopups, { id, side, value: hpBonus || 25, type: 'heal' }],
        });

        setTimeout(() => {
          set((s) => ({
            damagePopups: s.damagePopups.filter(p => p.id !== id),
            giftFlash: null,
          }));
        }, 1500);
      }
    }
  },

  // ── Combat Loop ──
  startBattle: () => {
    const { champion, challenger, battleState } = get();
    if (!champion || !challenger) return;
    if (battleState === 'fighting') return;

    set({ battleState: 'fighting' });
    get()._runCombatTick();
  },

  _runCombatTick: () => {
    if (combatTimer) clearInterval(combatTimer);
    combatTimer = setInterval(() => {
      const { champion, challenger, battleState } = get();
      if (battleState !== 'fighting' || !champion || !challenger) {
        clearInterval(combatTimer);
        return;
      }

      const champDmg = randomDamage();
      const challDmg = randomDamage();

      const newChampHp = clamp(champion.hp - challDmg, 0, champion.maxHp + 100);
      const newChallHp = clamp(challenger.hp - champDmg, 0, challenger.maxHp + 100);

      const popups = [...get().damagePopups];
      const champPopupId = ++popupIdCounter;
      const challPopupId = ++popupIdCounter;

      popups.push({ id: champPopupId, side: 'champion', value: challDmg, type: 'damage' });
      popups.push({ id: challPopupId, side: 'challenger', value: champDmg, type: 'damage' });

      set({
        champion: { ...champion, hp: newChampHp },
        challenger: { ...challenger, hp: newChallHp },
        damagePopups: popups,
      });

      // Remove popups after animation
      setTimeout(() => {
        set((s) => ({
          damagePopups: s.damagePopups.filter(p => p.id !== champPopupId && p.id !== challPopupId),
        }));
      }, 1200);

      // Cek KO / Kemenangan
      if (newChampHp <= 0 || newChallHp <= 0) {
        clearInterval(combatTimer);
        combatTimer = null;

        const loserSide = newChampHp <= 0 ? 'champion' : 'challenger';
        const winnerSide = loserSide === 'champion' ? 'challenger' : 'champion';

        set({ battleState: 'ko', koAnimation: loserSide });
        get()._handleKO(winnerSide, loserSide);
      }
    }, COMBAT_INTERVAL_MS);
  },

  _handleKO: (winnerSide, loserSide) => {
    setTimeout(() => {
      const { champion, challenger, queue, winStreak } = get();
      const currentChamp = champion;
      const currentChall = challenger;
      const currentQueue = [...queue];

      if (winnerSide === 'champion') {
        // Champion menang, streak bertambah
        const newStreak = winStreak + 1;
        const winnerUsername = currentChamp?.username;
        const recoveredHp = Math.min(currentChamp?.maxHp || 100, (currentChamp?.hp || 20) + 40);

        const updatedChampion = {
          ...currentChamp,
          hp: recoveredHp,
          wins: (currentChamp?.wins || 0) + 1,
        };

        // MLBB Kill Announcer Milestone
        let announceTitle = 'VICTORY!';
        let announceSubtitle = `${currentChamp?.hero?.name || 'Hero'} menang duel!`;
        let announceColor = '#fbbf24';

        if (newStreak === 1) {
          announceTitle = 'FIRST BLOOD!';
          announceSubtitle = `${winnerUsername} mencetak kill pertama!`;
          announceColor = '#ef4444';
        } else if (newStreak === 2) {
          announceTitle = 'DOUBLE KILL!';
          announceColor = '#f97316';
        } else if (newStreak === 3) {
          announceTitle = 'TRIPLE KILL!';
          announceColor = '#a855f7';
        } else if (newStreak === 4) {
          announceTitle = 'MANIAC!';
          announceColor = '#ec4899';
        } else if (newStreak >= 5) {
          announceTitle = '🔥 SAVAGE! 🔥';
          announceSubtitle = `STREAK ${newStreak}x WINS! UNSTOPPABLE!`;
          announceColor = '#fbbf24';
        }

        // Update Leaderboard
        const currentLeaderboard = [...get().leaderboard];
        const existingIdx = currentLeaderboard.findIndex(p => p.username === winnerUsername);
        if (existingIdx >= 0) {
          currentLeaderboard[existingIdx] = {
            ...currentLeaderboard[existingIdx],
            wins: currentLeaderboard[existingIdx].wins + 1,
            lastStreak: newStreak,
            maxStreak: Math.max(currentLeaderboard[existingIdx].maxStreak || 1, newStreak),
            heroName: currentChamp?.hero?.name || 'Hero',
            heroPortrait: currentChamp?.hero?.portrait || '/portraits/alucard.png',
            heroId: currentChamp?.hero?.id || 'alucard',
          };
        } else if (winnerUsername) {
          currentLeaderboard.push({
            username: winnerUsername,
            wins: 1,
            lastStreak: newStreak,
            maxStreak: newStreak,
            avatar: currentChamp?.avatar || '⚔️',
            heroName: currentChamp?.hero?.name || 'Hero',
            heroPortrait: currentChamp?.hero?.portrait || '/portraits/alucard.png',
            heroId: currentChamp?.hero?.id || 'alucard',
          });
        }
        currentLeaderboard.sort((a, b) => b.wins - a.wins || (b.maxStreak || 0) - (a.maxStreak || 0));

        set({
          mlbbAnnouncer: { title: announceTitle, subtitle: announceSubtitle, color: announceColor },
        });
        setTimeout(() => set({ mlbbAnnouncer: null }), 2000);

        if (currentQueue.length > 0) {
          const rawChallenger = currentQueue[0];
          const nextChallenger = {
            ...rawChallenger,
            hero: rawChallenger.hero || getRandomHero(),
            hp: rawChallenger.hp || BASE_HP,
            maxHp: rawChallenger.maxHp || BASE_HP,
          };
          const newQueue = currentQueue.slice(1);
          set({
            champion: updatedChampion,
            challenger: nextChallenger,
            queue: newQueue,
            winStreak: newStreak,
            leaderboard: currentLeaderboard.slice(0, 10),
            battleState: 'fighting',
            koAnimation: null,
            streakAnimation: true,
          });
          setTimeout(() => set({ streakAnimation: false }), 600);
          get()._runCombatTick();
        } else {
          // Antrean kosong -> 30 detik countdown
          set({
            champion: updatedChampion,
            challenger: null,
            winStreak: newStreak,
            leaderboard: currentLeaderboard.slice(0, 10),
            koAnimation: null,
          });
          get().startWaitingForChallenger();
        }
      } else {
        // Challenger menang & menjadi Champion baru!
        const winnerUsername = currentChall?.username;
        const recoveredHp = Math.min(100, (currentChall?.hp || 20) + 40);
        const newChampion = {
          ...currentChall,
          hero: currentChall?.hero || getRandomHero(),
          hp: recoveredHp,
          maxHp: Math.max(currentChall?.maxHp || 100, recoveredHp),
          wins: 1,
        };

        // Update Leaderboard
        const currentLeaderboard = [...get().leaderboard];
        const existingIdx = currentLeaderboard.findIndex(p => p.username === winnerUsername);
        if (existingIdx >= 0) {
          currentLeaderboard[existingIdx] = {
            ...currentLeaderboard[existingIdx],
            wins: currentLeaderboard[existingIdx].wins + 1,
            lastStreak: 1,
            maxStreak: Math.max(currentLeaderboard[existingIdx].maxStreak || 1, 1),
            heroName: currentChall?.hero?.name || 'Hero',
            heroPortrait: currentChall?.hero?.portrait || '/portraits/chou.png',
            heroId: currentChall?.hero?.id || 'chou',
          };
        } else if (winnerUsername) {
          currentLeaderboard.push({
            username: winnerUsername,
            wins: 1,
            lastStreak: 1,
            maxStreak: 1,
            avatar: currentChall?.avatar || '⚔️',
            heroName: currentChall?.hero?.name || 'Hero',
            heroPortrait: currentChall?.hero?.portrait || '/portraits/chou.png',
            heroId: currentChall?.hero?.id || 'chou',
          });
        }
        currentLeaderboard.sort((a, b) => b.wins - a.wins || (b.maxStreak || 0) - (a.maxStreak || 0));

        set({
          mlbbAnnouncer: { title: 'SHUT DOWN!', subtitle: `${winnerUsername} merebut tahta Juara!`, color: '#38bdf8' },
        });
        setTimeout(() => set({ mlbbAnnouncer: null }), 2000);

        if (currentQueue.length > 0) {
          const rawChallenger = currentQueue[0];
          const nextChallenger = {
            ...rawChallenger,
            hero: rawChallenger.hero || getRandomHero(),
            hp: rawChallenger.hp || BASE_HP,
            maxHp: rawChallenger.maxHp || BASE_HP,
          };
          const newQueue = currentQueue.slice(1);
          set({
            champion: newChampion,
            challenger: nextChallenger,
            queue: newQueue,
            winStreak: 1,
            leaderboard: currentLeaderboard.slice(0, 10),
            battleState: 'fighting',
            koAnimation: null,
          });
          get()._runCombatTick();
        } else {
          set({
            champion: newChampion,
            challenger: null,
            winStreak: 1,
            leaderboard: currentLeaderboard.slice(0, 10),
            koAnimation: null,
          });
          get().startWaitingForChallenger();
        }
      }
    }, KO_DELAY_MS);
  },

  // Manual & WebSocket Action
  handlePlayerJoin: (player) => {
    const { champion, challenger, battleState } = get();
    const fullPlayer = {
      ...player,
      hero: player.hero || getRandomHero(),
      hp: player.hp || BASE_HP,
      maxHp: player.maxHp || BASE_HP,
    };

    console.log(`[GAME] 👤 Hero Baru Masuk: @${fullPlayer.username} (${fullPlayer.hero.name})`);

    if (!champion && !challenger) {
      set({ champion: { ...fullPlayer, wins: 0 }, battleState: 'waiting' });
      get().startWaitingForChallenger();
    } else if (champion && !challenger) {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;
      set({ challenger: fullPlayer, battleState: 'fighting', waitingCountdown: 0 });
      get()._runCombatTick();
    } else {
      get().addToQueue(fullPlayer);
    }
  },

  resetGame: () => {
    if (combatTimer) clearInterval(combatTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    set({
      champion: null,
      challenger: null,
      queue: [],
      winStreak: 0,
      battleState: 'idle',
      damagePopups: [],
      giftFlash: null,
      skillEvent: null,
      ultimateCutscene: null,
      mlbbAnnouncer: null,
      koAnimation: null,
      streakAnimation: false,
    });
    setTimeout(() => {
      get().checkAndAutoFillBots();
    }, 500);
  },
}));
