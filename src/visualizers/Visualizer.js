import { Sound } from '../Sound.js'
import { Screen } from '../Screen.js'

class Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        this.analyser = sound.createAnalyser({ fftSize, smoothingTimeConstant })
        this.audioGraph = []
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
        this.delta = 0
        this.handle = 0
        this.initalized = false
        this.lastDraw = 0
        this.offscreen = new Screen(width, height)
        this.screen = new Screen(width, height, left, top)
        this.sound = sound
        this.timer = {
            delta: 0,
            frames: 0,
            last: 0
        }
    }
    connect(sound = null) {
        if (!this.sound && !sound) throw new Error(`A sound instance must be given.`)
        if (!sound) sound = this.sound
        if (!sound instanceof Sound) throw new Error(`Argument must be an instance of Sound.`)
        if (sound instanceof Sound && !sound.source) throw new Error(`No sound source found.`)
        this.connected = false
        if (this.audioGraph.length) {
            let prev = this.audioGraph[0]
            prev.connect(this.analyser)
            for (let nCnt = 1; nCnt < this.audioGraph.length; nCnt++) {
                const next = this.audioGraph[nCnt]
                next.connect(prev)
                prev = next
            }
            const last = this.audioGraph[this.audioGraph.length - 1]
            sound.source.connect(last)
            this.connected = true
        } else if (sound instanceof Sound) {
            sound.source.connect(this.analyser)
            this.connected = true
        }
    }
    disconnect() {
        for (let nCnt = 0; nCnt < this.audioGraph.length; nCnt++) {
            const node = this.audioGraph[nCnt]
            node.disconnect()
        }
        this.analyser.disconnect()
        this.connected = false
    }
    stop() {
        if (this.handle) cancelAnimationFrame(this.handle)
        this.handle = null
    }
}

export { Visualizer }
