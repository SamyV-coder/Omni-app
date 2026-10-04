// Ambient Synthesizer & Sound Effects using Web Audio API (zero external assets, 100% offline, ultra fast)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private noiseGain: GainNode | null = null;
  private isAmbiencePlaying: boolean = false;
  private currentMode: "rain" | "waves" | "space" | "fire" | "bowl" | "off" = "off";

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Bip de démarrage de session Focus
  playStart() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Ignorer si audio bloqué par autoplay policy
    }
  }

  // Son de fin de session Focus (Gong relaxant)
  playComplete() {
    try {
      const ctx = this.getContext();
      const freqs = [528, 660, 792]; // Accord harmonieux Solfeggio
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        gain.gain.setValueAtTime(0.1 / (i + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 2.5);
      });
    } catch (e) {
      // Ignorer
    }
  }

  // Click subtil futuriste
  playClick() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  // Sonnerie festive / succès / carillon pour alarme et routines
  playSuccess() {
    try {
      const ctx = this.getContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.35);
      });
    } catch (e) {}
  }

  // Notification subtile pour réception d'email ou création de note
  playNotification() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  }

  // Générateur de bruit blanc/rose pour concentration (Deep Work)
  setAmbience(mode: "rain" | "waves" | "space" | "fire" | "bowl" | "off") {
    if (mode === "off" || mode === this.currentMode) {
      this.stopAmbience();
      this.currentMode = "off";
      return "off";
    }

    this.stopAmbience();
    try {
      const ctx = this.getContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink / Brown noise synthesis
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brownian noise integration
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter according to mode
      const filter = ctx.createBiquadFilter();
      if (mode === "rain") {
        filter.type = "lowpass";
        filter.frequency.value = 800;
      } else if (mode === "waves") {
        filter.type = "bandpass";
        filter.frequency.value = 450;
        filter.Q.value = 1.2;
      } else if (mode === "space") {
        filter.type = "lowpass";
        filter.frequency.value = 250;
      } else if (mode === "fire") {
        filter.type = "bandpass";
        filter.frequency.value = 1200;
        filter.Q.value = 2.5;
      } else if (mode === "bowl") {
        filter.type = "lowpass";
        filter.frequency.value = 528;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(mode === "fire" ? 0.05 : 0.08, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      this.noiseNode = noiseSource;
      this.noiseGain = gain;
      this.isAmbiencePlaying = true;
      this.currentMode = mode;
      return mode;
    } catch (e) {
      return "off";
    }
  }

  stopAmbience() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
    this.isAmbiencePlaying = false;
    this.currentMode = "off";
  }

  getAmbienceState() {
    return {
      isPlaying: this.isAmbiencePlaying,
      mode: this.currentMode
    };
  }
}

export const sound = new SoundEngine();
