class Player {
    constructor(element) {
        this.element = element
        this.source = element.querySelector('audio')
        this.currentTrack = element.querySelector('#currentTrack')
        this.trackImage = element.querySelector('#trackImage')

        this.requesting = false
        this.lastRequest = 0
    }
    on(event, handler) {
        if (!this.source) return
        this.source.addEventListener(event, handler)
    }
    off(event, handler) {
        if (!this.source) return
        this.source.removeEventListener(event, handler)
    }
    pause() {
        this.source.pause()
    }
    play() {
        this.source.play()
    }
}

export { Player }
