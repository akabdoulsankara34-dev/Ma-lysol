// Web Audio API Sound Synthesizer for POS / Live Remote Sales Ping
class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  // Melodic dual-tone chime when a sale happens in real-time
  playSaleChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Note 1 (E5 - 659Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (B5 - 987Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.12);
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Realistic mechanical cash drawer spring-release + register bell chime ("Cha-Ching!")
  playCashDrawerSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // 1. Mechanical solenoid release "CLACK" (low thud + metallic pop)
      const oscClack = this.ctx.createOscillator();
      const gainClack = this.ctx.createGain();
      oscClack.type = 'triangle';
      oscClack.frequency.setValueAtTime(140, now);
      oscClack.frequency.exponentialRampToValueAtTime(35, now + 0.08);
      gainClack.gain.setValueAtTime(0.35, now);
      gainClack.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      oscClack.connect(gainClack);
      gainClack.connect(this.ctx.destination);
      oscClack.start(now);
      oscClack.stop(now + 0.09);

      // 2. High metallic latch click
      const oscLatch = this.ctx.createOscillator();
      const gainLatch = this.ctx.createGain();
      oscLatch.type = 'square';
      oscLatch.frequency.setValueAtTime(820, now + 0.02);
      oscLatch.frequency.exponentialRampToValueAtTime(200, now + 0.07);
      gainLatch.gain.setValueAtTime(0.18, now + 0.02);
      gainLatch.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      oscLatch.connect(gainLatch);
      gainLatch.connect(this.ctx.destination);
      oscLatch.start(now + 0.02);
      oscLatch.stop(now + 0.08);

      // 3. Resonant Register Bell ("DING!") - Note 1 (G6 ~ 1568Hz)
      const oscBell1 = this.ctx.createOscillator();
      const gainBell1 = this.ctx.createGain();
      oscBell1.type = 'sine';
      oscBell1.frequency.setValueAtTime(1567.98, now + 0.06);
      gainBell1.gain.setValueAtTime(0.25, now + 0.06);
      gainBell1.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      oscBell1.connect(gainBell1);
      gainBell1.connect(this.ctx.destination);
      oscBell1.start(now + 0.06);
      oscBell1.stop(now + 0.75);

      // 4. Register Bell Harmonic ("DING!") - Note 2 (High overtone 3136Hz)
      const oscBell2 = this.ctx.createOscillator();
      const gainBell2 = this.ctx.createGain();
      oscBell2.type = 'sine';
      oscBell2.frequency.setValueAtTime(3135.96, now + 0.06);
      gainBell2.gain.setValueAtTime(0.12, now + 0.06);
      gainBell2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      oscBell2.connect(gainBell2);
      gainBell2.connect(this.ctx.destination);
      oscBell2.start(now + 0.06);
      oscBell2.stop(now + 0.45);

    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const soundEffects = new SoundEffects();
