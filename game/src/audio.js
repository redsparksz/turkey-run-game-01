// Procedural WebAudio for Gobbles: no audio files, everything is synthesised
// at run time — footsteps, gobbles, a knife's whistle, an oven's sizzle, and a
// light dawn melody that keeps time with the run.

const DAWN_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 783.99, 659.25];
const MELODY_STEP_SECONDS = 0.42;

export function createAudio() {
  return {
    context: null,
    master: null,
    muted: false,
    musicTimer: 0,
    melodyIndex: 0,
    stepAlternate: false,

    ensure() {
      if (this.context) {
        if (this.context.state === 'suspended') this.context.resume();
        return;
      }
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.context = new Ctor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.context.destination);
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
      return this.muted;
    },

    tone(freq, seconds, type, volume, when = 0) {
      if (!this.context || this.muted) return;
      const start = this.context.currentTime + when;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(start);
      osc.stop(start + seconds + 0.05);
    },

    noise(seconds, volume, filterFreq, when = 0) {
      if (!this.context || this.muted) return;
      const start = this.context.currentTime + when;
      const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      const filter = this.context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      filter.Q.value = 0.8;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(start);
      source.stop(start + seconds);
    },

    // -- Game sounds -------------------------------------------------------
    footstep() {
      this.stepAlternate = !this.stepAlternate;
      this.noise(0.07, 0.10, this.stepAlternate ? 500 : 380);
    },

    gobble() {
      // A turkey's gobble: three quick descending blips.
      this.tone(320, 0.09, 'square', 0.10);
      this.tone(260, 0.09, 'square', 0.10, 0.09);
      this.tone(200, 0.14, 'square', 0.12, 0.18);
    },

    knifeWhoosh() {
      this.noise(0.35, 0.16, 2400);
      this.tone(1400, 0.3, 'sine', 0.05);
    },

    ovenSizzle() {
      this.noise(0.5, 0.14, 900);
    },

    pickup(golden) {
      this.tone(golden ? 880 : 660, 0.09, 'sine', 0.14);
      this.tone(golden ? 1318 : 990, 0.14, 'sine', 0.12, 0.07);
    },

    hurt() {
      this.tone(180, 0.22, 'sawtooth', 0.16);
      this.tone(120, 0.3, 'sawtooth', 0.14, 0.08);
      this.gobble();
    },

    farmerClose() {
      // Heavy boots getting nearer: two low thuds.
      this.tone(70, 0.16, 'sine', 0.22);
      this.tone(65, 0.16, 'sine', 0.22, 0.18);
    },

    escapedFanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, i) => this.tone(freq, 0.35, 'triangle', 0.16, i * 0.13));
      this.gobble();
    },

    caughtSting() {
      const notes = [392, 311, 233, 175];
      notes.forEach((freq, i) => this.tone(freq, 0.4, 'triangle', 0.14, i * 0.16));
    },

    // -- Dawn music: one soft plucked note per step while running -----------
    updateMusic(dt, running) {
      if (!this.context || this.muted || !running) return;
      this.musicTimer += dt;
      if (this.musicTimer < MELODY_STEP_SECONDS) return;
      this.musicTimer = 0;
      const note = DAWN_NOTES[this.melodyIndex % DAWN_NOTES.length];
      this.melodyIndex += 1;
      this.tone(note, 0.5, 'triangle', 0.045);
      if (this.melodyIndex % 4 === 0) this.tone(note / 2, 0.6, 'sine', 0.05);
    },
  };
}
