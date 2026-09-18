import { useGameStore } from '../../store/gameStore';

const SOURCE_COLORS = {
  chat: { bg: 'rgba(59, 130, 246, 0.35)', border: 'rgba(56, 189, 248, 0.8)', icon: '💬' },
  like: { bg: 'rgba(244, 63, 94, 0.35)', border: 'rgba(244, 63, 94, 0.8)', icon: '❤️' },
  follow: { bg: 'rgba(168, 85, 247, 0.35)', border: 'rgba(168, 85, 247, 0.8)', icon: '👣' },
  gift: { bg: 'rgba(234, 179, 8, 0.35)', border: 'rgba(251, 191, 36, 0.9)', icon: '🎁' },
  bot: { bg: 'rgba(100, 116, 139, 0.35)', border: 'rgba(148, 163, 184, 0.7)', icon: '🤖' },
  manual: { bg: 'rgba(16, 185, 129, 0.35)', border: 'rgba(52, 211, 153, 0.8)', icon: '🛠️' },
};

function QueueCard({ player, rank }) {
  const src = SOURCE_COLORS[player.source] || SOURCE_COLORS.chat;
  const hero = player.hero;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.95)',
      border: `2px solid ${src.border}`,
      borderRadius: '16px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      backdropFilter: 'blur(10px)',
      boxShadow: `0 4px 18px ${src.bg}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Rank number */}
      <div style={{
        width: '36px',
        height: '36px',
        flexShrink: 0,
        borderRadius: '50%',
        background: rank === 1 ? 'linear-gradient(135deg, #FFD700, #FF8C00)' : 'rgba(255,255,255,0.18)',
        border: '2px solid rgba(255,255,255,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 900,
        color: rank === 1 ? '#000' : '#fff',
        boxShadow: rank === 1 ? '0 0 12px #f59e0b' : 'none',
      }}>
        {rank}
      </div>

      {/* Hero Avatar icon */}
      <div style={{
        width: '48px',
        height: '48px',
        flexShrink: 0,
        borderRadius: '14px',
        background: hero?.portraitBg || 'linear-gradient(135deg, #1e3a8a, #dc2626)',
        border: '2px solid rgba(251, 191, 36, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 14px rgba(251,191,36,0.45)',
        overflow: 'hidden',
      }}>
        <img
          src={hero?.portrait || '/portraits/alucard.png'}
          alt={hero?.name || 'Hero'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 900,
          color: '#FFFFFF',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 4px #000',
        }}>
          {player.username}
        </div>

        {/* Hero Role & HP */}
        <div style={{
          fontSize: '14px',
          color: '#38bdf8',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '3px',
        }}>
          <span>{hero?.roleIcon}</span>
          <span>{hero?.name || 'Hero'}</span>
          <span style={{ color: '#4ade80', marginLeft: 'auto', fontWeight: 900, fontSize: '14px' }}>
            HP: {Math.ceil(player.hp || 100)}
          </span>
        </div>
      </div>

      {/* Source badge */}
      <div style={{
        fontSize: '20px',
        flexShrink: 0,
        background: src.bg,
        borderRadius: '50%',
        border: `2px solid ${src.border}`,
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {src.icon}
      </div>
    </div>
  );
}

export default function QueuePanel() {
  const { queue } = useGameStore();
  const total = queue.length;

  return (
    <div style={{
      flex: 1,
      background: 'rgba(6, 12, 35, 0.95)',
      border: '2.5px solid rgba(56, 189, 248, 0.7)',
      borderRadius: '22px',
      padding: '18px 20px',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        marginBottom: '14px',
        borderBottom: '2px solid rgba(56, 189, 248, 0.4)',
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 900,
          color: '#38bdf8',
          letterSpacing: '1.2px',
          textShadow: '0 0 14px rgba(56, 189, 248, 0.8)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚔️ ANTREAN HERO
        </div>
        <span style={{
          background: 'rgba(234, 179, 8, 0.25)',
          border: '1.5px solid rgba(234, 179, 8, 0.8)',
          borderRadius: '14px',
          padding: '4px 14px',
          fontSize: '14px',
          fontWeight: 900,
          color: '#facc15',
          boxShadow: '0 0 12px rgba(250,204,21,0.4)',
        }}>
          {total} WAITING
        </span>
      </div>

      {/* Queue items */}
      {total === 0 ? (
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
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '6px' }}>
            Antrean Saat Ini Kosong
          </div>
          <div>
            Ketik <strong style={{ color: '#38bdf8', fontSize: '20px' }}>"JOIN"</strong> di Live Chat!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
          {queue.slice(0, 6).map((player, i) => (
            <QueueCard key={player.username} player={player} rank={i + 1} />
          ))}

          {total > 6 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              borderRadius: '12px',
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1.5px solid rgba(56, 189, 248, 0.5)',
              fontSize: '15px',
              fontWeight: 900,
              color: '#7dd3fc',
            }}>
              +{total - 6} hero lainnya di antrean
            </div>
          )}
        </div>
      )}
    </div>
  );
}
