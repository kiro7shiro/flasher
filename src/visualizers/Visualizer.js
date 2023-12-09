import { Sound } from '../Sound.js'
import { Screen } from '../Screen.js'
import { addAnalyzerEvents, addAudioGraphEvents } from './controls.js'

const bandDefaults = {
    template: '0123', // alternately [0, 1, 2, 3]
    from: 1, // minimum midi note to watch
    to: 160, // maximum midi note, up to 160
    low: 1, // Low velocity/power threshold
    high: 128, // High velocity/power threshold
    smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for the values
    adapt: [1, 1, 1, 1], // Adaptive bounds setup
    snap: 0.33
}

class Visualizer {
    static mapNumRange = function (num, inMin, inMax, outMin, outMax) {
        return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    }

    constructor(sound, x, y, width, height) {
        this.analyser = sound.createAnalyser()
        this.audioGraph = []
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
        this.clubber = new Clubber({ size: this.analyser.fftSize })
        this.bands = []
        this.initalized = false
        this.lastDraw = 0
        this.offscreen = new Screen(width, height)
        // position
        this.x = x
        this.y = y
        //
        this.source = null
    }
    addBand(options) {
        const band = this.clubber.band(options)
        const buffer = new Float32Array(4)
        this.bands.push({ band, buffer, options })
        return band
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
    draw(screen) {
        // draw offscreen
        const { context } = screen
        context.drawImage(this.offscreen.canvas, this.x, this.y)
    }
    update(timestamp) {
        const { analyser, buffer, clubber } = this
        analyser.getByteFrequencyData(buffer)
        clubber.update(timestamp, buffer)
    }
}

export { Visualizer }
