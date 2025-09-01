// TODO : Player
// [ ]  : display the current playing source name
// [ ]  : add scrolling text for long title names

import { Control } from '/src/Control.js'
import { AudioSource } from './sources/AudioSource.js'

export class Player {
    static defaults = {
        template: '/views/Player.ejs',
        data: {},
        container: '#player-container',
        events: ['click']
    }
    static async build({ template, data, container, events } = Player.defaults) {
        const control = await Control.build(template, data, container, events)
        return new Player(control)
    }
    static buildSync({ template, data, container, events } = Player.defaults) {
        const control = Control.buildSync(template, data, container, events)
        return new Player(control)
    }
    constructor(control) {
        this.control = control
        this.container = control.container
        this.continue = false
        this.current = null
        this.audio = this.container.querySelector('audio')
        this.trackName = this.container.querySelector('#trackName')
        this.trackImage = this.container.querySelector('#trackImage')
        const self = this
        this.audio.addEventListener('play', function (event) {
            self.control.dispatchEvent(new CustomEvent('play', { detail: event }))
        })
        this.audio.addEventListener('ended', function (event) {
            self.control.dispatchEvent(new CustomEvent('ended', { detail: event }))
        })
    }
    get paused() {
        return this.audio.paused
    }
    get src() {
        return new URL(this.audio.src)
    }
    set src(url) {
        if (!(url instanceof URL)) throw new Error(`Source must be an instance of URL.`)
        this.audio.src = url.href
    }
    on(event, handler) {
        this.control.on(event, handler)
    }
    off(event, handler) {
        this.control.off(event, handler)
    }
    pause() {
        this.audio.pause()
    }
    play(source) {
        if (!(source instanceof AudioSource)) throw new Error(`Source must be an instance of AudioSource. Got: ${typeof source} instead.`)
        switch (source.type) {
            case AudioSource.TYPES.FILE:
                this.audio.src = source.ref.href
                break
            case AudioSource.TYPES.STREAM:
                this.audio.src = source.channels[0].streams[0].url
                break
        }
        this.current = source
        this.trackName.textContent = source.name
        this.audio.play()
    }
}
