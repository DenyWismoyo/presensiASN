"use client";

/**
 * Audio Synthesizer Berbasis Web Audio API Native
 * Menghasilkan umpan balik audio tanpa memerlukan file MP3/WAV eksternal (0 KB asset footprint)
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Nada sukses harmonis saat Presensi Masuk / Pulang / LKH berhasil disimpan
 * Chime akord C5 -> E5 -> G5 yang ramah dan berwibawa
 */
export function playSuccessChime() {
  // 1. Haptic feedback
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([35, 45, 35]);
    } catch {}
  }

  // 2. Audio feedback
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const now = ctx.currentTime;

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + index * 0.1);

    gain.gain.setValueAtTime(0, now + index * 0.1);
    gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + index * 0.1);
    osc.stop(now + index * 0.1 + 0.4);
  });
}

/**
 * Nada peringatan saat lokasi berada di luar radius kantor atau error
 */
export function playWarningBeep() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([80, 60, 80]);
    } catch {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(392, now); // G4
  osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.25); // turun ke C4

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.35);
}

/**
 * Nada ketukan halus (tap click)
 */
export function playTapSound() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(15);
    } catch {}
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}
