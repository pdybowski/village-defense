import { AUDIO_DEFAULT_VOLUME } from './constants'

export class Audio {
  private volumeLocalStorage
  private volume: number
  private audio = document.querySelector('audio') as HTMLAudioElement
  private unmuteSpeaker = document.querySelector('.fa-volume-up') as HTMLElement
  private muteSpeaker = document.querySelector('.fa-volume-off') as HTMLElement
  private audioState: boolean = true

  constructor() {
    this.volumeLocalStorage = +localStorage.getItem('volume')!
    this.volume = this.volumeLocalStorage
      ? this.volumeLocalStorage
      : AUDIO_DEFAULT_VOLUME
    this._init()
  }

  changeAudioSource(source: string) {
    this.audio.src = source
  }

  audioSettings(volume: number) {
    this.audioState = volume == 0 ? false : true

    this.changeSpeakerState()
    this.changeAudioVolume(volume)
    this.playAudio(volume)
  }

  playAudio(volume?: number) {
    this.audio.volume = volume ?? this.volume
  }

  private _init() {
    this.bindEvents()
    this.playAudio()
  }

  private handleAudioStateChange() {
    this.audioState = !this.audioState
    this.changeSpeakerState()
  }

  private changeSpeakerState() {
    if (this.audioState) {
      this.unmute()
      this.unmuteSpeaker.classList.remove('hide')
      this.unmuteSpeaker.classList.add('show')
      this.muteSpeaker.classList.remove('show')
      this.muteSpeaker.classList.add('hide')
    } else {
      this.mute()
      this.unmuteSpeaker.classList.remove('show')
      this.unmuteSpeaker.classList.add('hide')
      this.muteSpeaker.classList.remove('hide')
      this.muteSpeaker.classList.add('show')
    }
  }

  private bindEvents() {
    this.unmuteSpeaker.addEventListener('click', () =>
      this.handleAudioStateChange()
    )
    this.muteSpeaker.addEventListener('click', () =>
      this.handleAudioStateChange()
    )
  }

  private changeAudioVolume(volume: number) {
    this.volume = volume
  }

  private mute() {
    this.audio.volume = 0
  }

  private unmute() {
    this.audio.volume = this.volume
  }
}
