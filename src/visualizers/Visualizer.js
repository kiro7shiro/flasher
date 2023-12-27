import { Sound } from '../Sound.js'
import { Screen } from '../Screen.js'
import { addAnalyzerEvents, addAudioGraphEvents } from './controls.js'

class Visualizer {
    static mapNumRange = function (num, inMin, inMax, outMin, outMax) {
        return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    }

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
        this.source = null
    }
    addControlsEvents(html) {
        const container = addAnalyzerEvents(this.analyser, html)
        addAudioGraphEvents(this, container)
        return container
    }
    connect(sound) {
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
            this.source = sound.source
            this.connected = true
        } else if (sound instanceof Sound) {
            sound.source.connect(this.analyser)
            this.source = sound.source
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
    draw() {
        // your code goes here
        //if (this.handle) cancelAnimationFrame(this.handle)
        this.handle = requestAnimationFrame(this.draw.bind(this))
        return this.handle
    }
    update(timestamp) {
        // your code goes here
    }
}

export { Visualizer }
