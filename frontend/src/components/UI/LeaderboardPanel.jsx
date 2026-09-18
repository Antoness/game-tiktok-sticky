import { useGameStore } from '../../store/gameStore';

export default function LeaderboardPanel() {
  const { leaderboard } = useGameStore();

  const rankBadges = [
    { bg: 'linear-gradient(135deg, #FFD700, #FF8C00)', text: '👑 #1 MVP', border: '#FFD700', shadow: 'rgba(255,215,0,0.6)' },
    { bg: 'linear-gradient(135deg, #E2E8F0, #94A3B8)', text: '🥈 #2 GLORY', border: '#CBD5E1', shadow: 'rgba(203,213,225,0.4)' },
    { bg: 'linear-gradient(135deg, #F59E0B, #B45309)', text: '🥉 #3 MYTHIC', border: '#F59E0B', shadow: 'rgba(245,158,11,0.4)' },
  ];

  return (
    <div style={{
      flex: 1,
      background: 'rgba(6, 12, 35, 0.95)',
      border: '2.5px solid rgba(251, 191, 36, 0.7)',
      borderRadius: '22px',
      padding: '18px 20px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(251, 191, 36, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        marginBottom: '14px',
        borderBottom: '2px solid rgba(251, 191, 36, 0.4)',
      }}>
        <div style={{
          fontFamily: 'sans-serif',
          fontSize: '20px',
          fontWeight: 900,
          color: '#fbbf24',
          letterSpacing: '1.2px',
          textShadow: '0 0 16px rgba(251,191,36,0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🏆 TOP MYTHIC GLADIATOR
        </div>
        <span style={{
          background: 'rgba(251, 191, 36, 0.25)',
          border: '1.5px solid rgba(251, 191, 36, 0.8)',
          borderRadius: '14px',
          padding: '4px 14px',
          fontSize: '14px',
          fontWeight: 900,
          color: '#fbbf24',
          boxShadow: '0 0 12px rgba(251,191,36,0.4)',
        }}>
          HALL OF FAME
        </span>
      </div>

      {/* Leaderboard List */}
      {leaderboard.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          padding: '24px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚔️</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
            Belum Ada Gladiator
          </div>
          <div>
            Ketik <strong style={{ color: '#fbbf24', fontSize: '20px' }}>"JOIN"</strong> untuk bertarung!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
          {leaderboard.slice(0, 6).map((player, idx) => {
            const badge = rankBadges[idx] || {
              bg: 'rgba(255,255,255,0.15)',
              text: `#${idx + 1}`,
              border: 'rgba(255,255,255,0.3)',
              shadow: 'transparent',
            };

            return (
              <div
                key={player.username}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '11px 16px',
                  borderRadius: '16px',
                  background: idx === 0
                    ? 'linear-gradient(90deg, rgba(251,191,36,0.25) 0%, rgba(15,23,42,0.98) 100%)'
                    : 'rgba(15, 23, 42, 0.9)',
                  border: `1.5px solid ${badge.border}`,
                  boxShadow: `0 4px 16px ${badge.shadow}`,
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  padding: '5px 12px',
                  borderRadius: '9px',
                  background: badge.bg,
                  color: idx < 3 ? '#000' : '#fff',
                  fontSize: '14px',
                  fontWeight: 900,
                  flexShrink: 0,
                  boxShadow: idx === 0 ? '0 0 12px rgba(251,191,36,0.9)' : 'none',
                }}>
                  {badge.text}
                </div>

                {/* Hero Avatar */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#1e293b',
                  border: `2px solid ${badge.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(0,0,0,0.5)',
                }}>
                  <img
                    src={player.heroPortrait || `/portraits/${player.heroId || 'alucard'}.png`}
                    alt={player.heroName || 'Hero'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Username & Hero */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: idx === 0 ? '#fbbf24' : '#ffffff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textShadow: '0 1px 4px #000',
                  }}>
                    {player.username}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#38bdf8',
                    fontWeight: 800,
                    marginTop: '2px',
                  }}>
                    {player.heroName || 'Hero'} {player.maxStreak > 1 && `• 🔥 ${player.maxStreak}x`}
                  </div>
                </div>

                {/* Total Wins Callout */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.3)',
                  border: '1.5px solid rgba(239, 68, 68, 0.8)',
                  borderRadius: '10px',
                  padding: '5px 12px',
                  textAlign: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(239,68,68,0.4)',
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#f87171',
                    lineHeight: 1,
                  }}>
                    {player.wins}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    color: '#fca5a5',
                    letterSpacing: '1px',
                  }}>
                    WINS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
