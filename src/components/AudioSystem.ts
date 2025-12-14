import { AppConfig } from '../assets/data/config';

export class AudioSystem {
  private audio: HTMLAudioElement;
  private isPlaying: boolean = false;

  constructor() {
    this.audio = new Audio(AppConfig.audio.backgroundMusic);
    this.audio.loop = true;
    this.audio.volume = AppConfig.audio.volume;
  }

  public play() {
    this.audio.play().then(() => {
      this.isPlaying = true;
    }).catch(e => {
      console.warn("Audio autoplay blocked, waiting for interaction", e);
    });
  }

  public pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  public setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  public setSource(src: string) {
    const wasPlaying = this.isPlaying;
    this.audio.src = src;
    if (wasPlaying) this.play();
  }
}
