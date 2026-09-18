// bgmSynth.js — Copyright-Free Cyberpunk Synthesized BGM Engine (Web Audio API)
// Generates continuous energizing arcade combat beats directly in browser

class BGMSynth {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.35;
    this.timerId = null;
    this.step = 0;
    this.tempo = 126; // BPM
    this.masterGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;

    const stepInterval = (60 / this.tempo / 4) * 1000; // 16th note in ms

    this.timerId = setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      this.playStep(this.step);
      this.step = (this.step + 1) % 32;
    }, stepInterval);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
    return !this.isMuted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  playStep(step) {
    const t = this.ctx.currentTime;

    // ── 1. KICK DRUM (every beat: 0, 4, 8, 12, 16, 20, 24, 28) ──
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.connect(kickGain);
      kickGain.connect(this.masterGain);

      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

      kickGain.gain.setValueAtTime(0.7, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      kickOsc.start(t);
      kickOsc.stop(t + 0.16);
    }

    // ── 2. SNARE / CLAP (beats 4, 12, 20, 28) ──
    if (step % 8 === 4) {
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.4, t);
      snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      noise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.12);
    }

    // ── 3. HI-HAT (every 2 steps) ──
    if (step % 2 === 0) {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const hat = this.ctx.createBufferSource();
      hat.buffer = buffer;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.value = 6000;

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.22 : 0.12, t);
      hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.masterGain);

      hat.start(t);
      hat.stop(t + 0.04);
    }

    // ── 4. SYNTH BASSLINE (Cyberpunk 8-bar rolling bass) ──
    // Root notes: F# -> A -> B -> D
    const bassNotes = [
      92.5, 92.5, 92.5, 92.5,   // F#2
      110.0, 110.0, 110.0, 110.0, // A2
      123.47, 123.47, 123.47, 123.47, // B2
      146.83, 146.83, 138.59, 123.47, // D3 -> C#3 -> B2
    ];
    const bassFreq = bassNotes[Math.floor(step / 2) % bassNotes.length];

    if (step % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(450, t);
      bassFilter.frequency.exponentialRampToValueAtTime(120, t + 0.14);

      bassGain.gain.setValueAtTime(0.3, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(t);
      bassOsc.stop(t + 0.15);
    }

    // ── 5. SYNTH LEAD ARPEGGIO (Epic energetic melody) ──
    const arpeggio = [
      370, 440, 554, 740, 880, 740, 554, 440,
      440, 554, 659, 880, 987, 880, 659, 554,
    ];
    const arpFreq = arpeggio[step % arpeggio.length];

    const arpOsc = this.ctx.createOscillator();
    const arpGain = this.ctx.createGain();

    arpOsc.type = 'triangle';
    arpOsc.frequency.setValueAtTime(arpFreq, t);

    arpGain.gain.setValueAtTime(0.12, t);
    arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    arpOsc.connect(arpGain);
    arpGain.connect(this.masterGain);

    arpOsc.start(t);
    arpOsc.stop(t + 0.1);
  }
}

export const bgmEngine = new BGMSynth();
