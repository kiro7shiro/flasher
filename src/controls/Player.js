class Player {
    constructor(element) {
        this.element = element
        this.player = element.querySelector('audio')
        this.currentTrack = element.querySelector('#currentTrack')
        this.trackImage = element.querySelector('#trackImage')

        this.requesting = false
        this.lastRequest = 0
    }
    on(event, handler) {
        if (!this.player) return
        this.player.addEventListener(event, handler)
    }
    off(event, handler) {
        if (!this.player) return
        this.player.removeEventListener(event, handler)
    }
}

export { Player }
