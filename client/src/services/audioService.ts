type SoundKind = 'success' | 'warning' | 'drama';

export type KitchenSound = 'blanch' | 'lift' | 'pour' | 'perfect' | 'golden';
export function playKitchenSound(kind: KitchenSound) {
  try {
    if (!window.AudioContext) return;
    audioContext ??= new window.AudioContext();
    const context = audioContext;
    if (context.state === 'suspended') void context.resume();
    const notes = kind === 'golden' ? [523, 659, 784, 1047]
      : kind === 'perfect' ? [660, 880, 1320]
      : kind === 'pour' ? [310, 390, 450]
      : kind === 'lift' ? [710, 1000] : [210, 280];
    notes.forEach((frequency, index) => {
      const start = context.currentTime + index * .085;
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = kind === 'blanch' || kind === 'pour' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(.065, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .17);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + .18);
    });
  } catch { /* Sound is optional; a blocked audio device never interrupts cooking. */ }
}

let audioContext: AudioContext | null = null;

export function playUiSound(kind: SoundKind) {
  try {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    audioContext ??= new AudioContextConstructor();
    if (audioContext.state === 'suspended') void audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startAt = audioContext.currentTime;
    const frequency = kind === 'success' ? 660 : kind === 'drama' ? 190 : 340;

    oscillator.type = kind === 'drama' ? 'sawtooth' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (kind === 'success' ? 1.5 : 0.7), startAt + 0.14);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.2);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.21);
  } catch (error) {
    console.warn('Không thể phát hiệu ứng âm thanh.', error);
  }
}
