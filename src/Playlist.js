import { Control } from '/src/Control.js'
import { AudioSource } from './sources/AudioSource.js'

export class Playlist {
    static defaults = {
        template: '/views/Playlist.ejs',
        sources: [],
        container: '#playlist-container',
        events: ['click']
    }
    static ORDER = {
        ASCENDING: 'ASCENDING',
        DESCENDING: 'DESCENDING',
        SHUFFLE: 'SHUFFLE'
    }
    static async build({ template, sources, container, events } = Playlist.defaults) {
        const control = await Control.build(template, { queue: sources }, container, events)
        return new Playlist(control)
    }
    static buildSync({ template, sources, container, events } = Playlist.defaults) {
        const control = Control.buildSync(template, { queue: sources }, container, events)
        return new Playlist(control)
    }
    constructor(control) {
        this.control = control
        this.container = control.container
        this.current = -1
        this.order = Playlist.ORDER.ASCENDING
        this.queue = []
        this.repeat = false
    }
    add(sources) {
        for (let sCnt = 0; sCnt < sources.length; sCnt++) {
            const source = sources[sCnt]
            if (!(source instanceof AudioSource)) {
                this.queue.push(new AudioSource(source))
            } else {
                this.queue.push(source)
            }
        }
        this.control.renderSync({ queue: this.queue })
    }
    del(index) {
        if (index < 0 || index >= this.queue.length) return false
        this.queue.splice(index, 1)
        this.control.renderSync({ queue: this.queue })
        return true
    }
    next() {
        switch (this.order) {
            case Playlist.ORDER.ASCENDING:
                this.current++
                if (this.current >= this.queue.length) {
                    if (this.repeat === false) return null
                    this.current = 0
                }
                break
            case Playlist.ORDER.DESCENDING:
                this.current--
                if (this.current < 0) {
                    if (this.repeat === false) return null
                    this.current = this.queue.length - 1
                }
                break
            case Playlist.ORDER.SHUFFLE:
                this.current = Math.round(this.queue.length * Math.random())
                break

            default:
                break
        }
        return this.queue[this.current]
    }
    on(event, handler) {
        this.control.on(event, handler)
    }
    off(event, handler) {
        this.control.off(event, handler)
    }
}
