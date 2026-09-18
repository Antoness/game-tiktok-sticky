// RulesPanel.jsx — Horizontal Top Action Bar (Never blocks HP bars or fighters)
export default function RulesPanel() {
  const rules = [
    { icon: '💬', title: 'KETIK "JOIN"', desc: 'Masuk Antrean', badge: 'GRATIS', color: '#00F0FF', border: 'rgba(0,240,255,0.7)', bg: 'rgba(0,100,200,0.18)' },
    { icon: '❤️', title: 'LIKE 50x', desc: 'Auto Join', badge: 'FREE', color: '#FF3366', border: 'rgba(255,51,102,0.7)', bg: 'rgba(255,0,80,0.18)' },
    { icon: '👤', title: 'FOLLOW', desc: 'Slot Prioritas', badge: 'BONUS', color: '#B55FE6', border: 'rgba(181,95,230,0.7)', bg: 'rgba(150,50,255,0.18)' },
    { icon: '🎁', title: 'GIFT KOIN', desc: '1 Koin = +25 HP', badge: 'BUFF HP', color: '#FFD700', border: 'rgba(255,215,0,0.8)', bg: 'rgba(255,180,0,0.18)' },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '200px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '1020px',
      zIndex: 70,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* 4 Quick Rules Cards in 1 Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
      }}>
        {rules.map((rule, i) => (
          <div key={i} style={{
            background: 'rgba(6, 12, 32, 0.95)',
            border: `2px solid ${rule.border}`,
            borderRadius: '14px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: `0 4px 16px ${rule.bg}, inset 0 0 12px ${rule.bg}`,
            backdropFilter: 'blur(10px)',
          }}>
            {/* Icon */}
            <div style={{
              fontSize: '26px',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: rule.bg,
              border: `1.5px solid ${rule.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {rule.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2px',
              }}>
                <span style={{
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: '15px',
                  fontWeight: 900,
                  color: rule.color,
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 3px #000',
                  whiteSpace: 'nowrap',
                }}>
                  {rule.title}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  fontFamily: 'Orbitron',
                  background: rule.color,
                  color: '#000',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  boxShadow: `0 0 8px ${rule.color}`,
                }}>
                  {rule.badge}
                </span>
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: '#FFFFFF',
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px #000',
              }}>
                {rule.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sub-banner: Rules summary */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(255,68,68,0.2) 0%, rgba(255,215,0,0.25) 50%, rgba(0,212,255,0.2) 100%)',
        border: '1.5px solid rgba(255, 215, 0, 0.4)',
        borderRadius: '10px',
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '13px',
          fontWeight: 800,
          color: '#FFD700',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚡ ATURAN MAIN:
          <span style={{ color: '#FFFFFF', fontFamily: 'Rajdhani', fontSize: '15px', fontWeight: 700 }}>
            Pemenang duel otomatis lanjut lawan Challenger berikutnya!
          </span>
        </div>
        <div style={{
          fontFamily: 'Orbitron',
          fontSize: '12px',
          fontWeight: 900,
          color: '#00FF88',
          letterSpacing: '1px',
        }}>
          🏆 REBUT MAHKOTA
        </div>
      </div>
    </div>
  );
}


