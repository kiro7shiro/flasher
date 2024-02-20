import { Control } from './Control.js'
import { currentTrack } from './sources/fluxFm.js'

// TODO : AudioSource
// TODO : playlist

class PlayerHistory {
    constructor({ maxItems = 9 } = {}) {
        this.history = []
        this.maxItems = maxItems
        const saved = localStorage.getItem('playerHistory')
        if (saved) this.history = JSON.parse(saved)
    }
    get length() {
        return this.history.length
    }
    add(source) {
        if (typeof source === 'string') {
            const [name] = source.split('/').slice(-1)
            if (this.includes({ name })) return
            this.history.push({ name, source })
            if (this.history.length >= this.maxItems) {
                this.history = this.history.slice(-this.maxItems)
            }
        }
        localStorage.setItem('playerHistory', JSON.stringify(this.history))
    }
    get(source) {
        if (typeof source === 'string') {
            const [name] = source.split('/').slice(-1)
            const result = this.history.find(function (curr) {
                return curr.name === name
            })
            return result
        }
    }
    includes(source) {
        if (typeof source === 'string') {
            const [name] = source.split('/').slice(-1)
            source.name = name
        }
        const result = this.history.find(function (curr) {
            return curr.name === source.name
        })
        return result !== null && result !== undefined
    }
    last() {
        return this.history.slice(-1)[0]
    }
    moveToEnd(source) {
        if (typeof source === 'string') {
            const [name] = source.split('/').slice(-1)
            const index = this.history.findIndex(function (curr) {
                return curr.name === name
            })
            const [mover] = this.history.splice(index, 1)
            this.history.push(mover)
        }
    }
    slice(start, end) {
        return this.history.slice(start, end)
    }
    set(source, prop, value) {
        const index = this.history.findIndex(function (curr) {
            return curr.name === source.name
        })
        this.history[index][prop] = value
        localStorage.setItem('playerHistory', JSON.stringify(this.history))
    }
}

// TODO
class Playlist {
    constructor() {
        this.tracks = []
        this.repeat = true
        this.shuffle = false
    }
    add(source) {}
    del(name) {}
    next() {}
}

class Player extends Control {
    constructor(source) {
        super(source)
        this.audio = this.element.querySelector('audio')
        this.trackLabel = this.element.querySelector('#currentTrack')
        this.trackImage = this.element.querySelector('#trackImage')
        this.currentTrack = null
        this.history = new PlayerHistory()
        this.requesting = false
        this.channelId = null
        this.lastRequest = 0
        // timeupdate event handler
        // TODO : update for more sources: files, streams
        // TODO : add scrolling text for long title names
        this.audio.addEventListener(
            'timeupdate',
            async function (event) {
                if (event.timeStamp >= this.lastRequest + 2000 && !this.requesting) {
                    if (this.currentTrack) this.history.set(this.currentTrack, 'lastTime', this.audio.currentTime)
                    this.lastRequest = event.timeStamp
                    if (!this.channelId) return
                    this.requesting = true
                    const trackInfo = await currentTrack(this.channelId)
                    if (trackInfo) {
                        const { artwork } = trackInfo
                        if (artwork) {
                            this.trackImage.src = artwork
                        } else {
                            this.trackImage.src = 'views/images/no-image-64.png'
                        }
                        this.trackLabel.innerText = `${trackInfo.artistCredits} - ${trackInfo.title}`
                        this.lastRequest = event.timeStamp
                    }
                    this.requesting = false
                }
            }.bind(this)
        )
        const { element } = this
        this.audio.addEventListener('ended', function (event) {
            element.dispatchEvent(new CustomEvent('ended'))
        })
    }
    get source() {
        return this.audio.src
    }
    set source(value) {
        this.audio.src = value
    }
    pause() {
        this.audio.pause()
    }
    play(source = null) {
        if (source) {
            // check if source was played already and resume on last time if possible
            const saved = this.history.get(source)
            switch (true) {
                case saved !== null && saved !== undefined:
                    this.audio.src = saved.source
                    if (saved.lastTime) {
                        this.audio.currentTime = saved.lastTime
                    } else {
                        this.audio.currentTime = 0
                    }
                    this.history.moveToEnd(source)
                    this.currentTrack = saved
                    break

                case typeof source === 'string':
                    // TODO : check source type
                    this.audio.src = source
                    this.history.add(source)
                    this.currentTrack = this.history.slice(-1)[0]
                    break

                default:
                    // TODO : assuming this is a stream object with an "url" property
                    // currently this is a channel object coming from fluxFm
                    this.audio.src = source.streams[0].url
                    this.channelId = source.channelId
                    break
            }
        }
        this.audio.play()
    }
}

export { Player }
