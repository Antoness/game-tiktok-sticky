import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getRandomHero } from '../../data/mlbbHeroes';

export function MockControls() {
  const [isOpen, setIsOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  const {
    addToQueue,
    resetGame,
    triggerHeroSkill,
    champion,
    challenger,
    battleState,
  } = useGameStore();

  const handleAddPlayer = () => {
    const hero = getRandomHero();
    const name = customName.trim() || `Player_${hero.name}_${Math.floor(Math.random() * 900 + 100)}`;
    addToQueue({
      username: name,
      hero,
      hp: 100,
      maxHp: 100,
      source: 'manual',
      avatar: hero.avatar,
    });
    setCustomName('');
  };

  return (
    <div className="fixed bottom-3 right-3 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all"
      >
        <span>🛠️</span>
        <span>{isOpen ? 'Tutup Kontrol' : 'Mock Panel MLBB'}</span>
      </button>

      {/* Control Panel Modal */}
      {isOpen && (
        <div className="absolute bottom-10 right-0 w-80 p-4 rounded-xl bg-slate-950/95 border-2 border-amber-500/60 shadow-2xl backdrop-blur-xl flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <span>🎮</span> MLBB Test Controller
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">Dev Mode</span>
          </div>

          {/* Add Player Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama pemain (opsional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={handleAddPlayer}
              className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs rounded-lg shadow transition-all"
            >
              + Join
            </button>
          </div>

          {/* Skill Triggers for Champion */}
          <div className="flex flex-col gap-1.5 bg-blue-950/40 p-2.5 rounded-lg border border-blue-500/30">
            <span className="text-[10px] font-black text-blue-300 uppercase">
              👑 Champion: {champion?.hero?.name || 'Empty'}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                disabled={!champion || battleState !== 'fighting'}
                onClick={() => triggerHeroSkill('champion', 'skill1')}
                className="px-2 py-1 bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-[10px] rounded transition disabled:opacity-40"
              >
                Skill 1 (20🪙)
              </button>
              <button
                disabled={!champion || battleState !== 'fighting'}
                onClick={() => triggerHeroSkill('champion', 'skill2')}
                className="px-2 py-1 bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-[10px] rounded transition disabled:opacity-40"
              >
                Skill 2 (50🪙)
              </button>
              <button
                disabled={!champion || battleState !== 'fighting'}
                onClick={() => triggerHeroSkill('champion', 'ultimate')}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded shadow-md transition disabled:opacity-40 animate-pulse"
              >
                🔥 ULTI (100🪙)
              </button>
            </div>
          </div>

          {/* Skill Triggers for Challenger */}
          <div className="flex flex-col gap-1.5 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
            <span className="text-[10px] font-black text-rose-300 uppercase">
              ⚔️ Challenger: {challenger?.hero?.name || 'Empty'}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                disabled={!challenger || battleState !== 'fighting'}
                onClick={() => triggerHeroSkill('challenger', 'skill1')}
                className="px-2 py-1 bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-[10px] rounded transition disabled:opacity-40"
              >
                Skill 1 (20🪙)
              </button>
              <button
                disabled={!challenger || battleState !== 'fighting'}
                onClick={() => triggerHeroSkill('challenger', 'skill2')}
                className="px-2 py-1 bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-[10px] rounded transition disabled:opacity-40"
              >
                Skill 2 (50🪙)
              </button>
              <button
                disabled={!challenger || battleState !== 'fighting'}
                onClick={() => triggerHeroSkill('challenger', 'ultimate')}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded shadow-md transition disabled:opacity-40 animate-pulse"
              >
                🔥 ULTI (100🪙)
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetGame}
            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold text-xs rounded-lg transition"
          >
            🔄 Reset & Spawn Bot Arena
          </button>
        </div>
      )}
    </div>
  );
}

export default MockControls;
