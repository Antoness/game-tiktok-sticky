import { useState, useEffect } from 'react';
import { bgmEngine } from '../../utils/bgmSynth';

export default function MusicController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(35);

  const togglePlay = () => {
    if (isPlaying) {
      bgmEngine.stop();
      setIsPlaying(false);
    } else {
      bgmEngine.start();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    bgmEngine.setVolume(val / 100);
  };

  // Auto-start BGM on first user interaction anywhere on page
  useEffect(() => {
    const handleFirstClick = () => {
      if (!isPlaying) {
        bgmEngine.start();
        setIsPlaying(true);
      }
      window.removeEventListener('click', handleFirstClick);
    };

    window.addEventListener('click', handleFirstClick);
    return () => window.removeEventListener('click', handleFirstClick);
  }, [isPlaying]);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '30px',
      zIndex: 90,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: 'rgba(5, 12, 35, 0.9)',
      border: '1.5px solid rgba(0, 212, 255, 0.6)',
      borderRadius: '30px',
      padding: '6px 14px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 0 15px rgba(0,180,255,0.3)',
    }}>
      {/* Play/Stop Button */}
      <button
        onClick={togglePlay}
        style={{
          background: isPlaying
            ? 'linear-gradient(135deg, #00FF88, #00AA50)'
            : 'linear-gradient(135deg, #FF3366, #CC0033)',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 900,
          boxShadow: isPlaying ? '0 0 10px #00FF88' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isPlaying ? '🎵' : '🔇'}
      </button>

      <span style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '12px',
        fontWeight: 800,
        color: isPlaying ? '#00FF88' : '#FF6688',
        letterSpacing: '1px',
      }}>
        {isPlaying ? 'BGM ON' : 'BGM OFF'}
      </span>

      {/* Volume Slider */}
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={handleVolumeChange}
        style={{
          width: '60px',
          accentColor: '#00D4FF',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
