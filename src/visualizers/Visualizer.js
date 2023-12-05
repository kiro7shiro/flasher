import { Sound } from '../Sound.js'
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
    constructor(sound) {
        this.analyser = sound.createAnalyser()
        this.audioGraph = []
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
        const clubberAnalyzer = sound.createAnalyser()
        sound.source.connect(clubberAnalyzer)
        this.clubber = new Clubber({
            size: clubberAnalyzer.fftSize,
            mute: false,
            context: sound.context,
            analyser: clubberAnalyzer
        })
        this.bands = []
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
    draw() {
        this.clubber.update()
        for (let bCnt = 0; bCnt < this.bands.length; bCnt++) {
            const { band, buffer, options } = this.bands[bCnt]
            let { template } = options
            if (typeof template === 'string') template = template.split('')
            const rect = band(buffer)
            const self = this
            const result = template.reduce(function (accu, curr, index) {
                accu.push({ description: self.clubber.descriptions[index], value: buffer[index] })
                return accu
            }, [])
            //console.table(result)
        }
    }
}

export { Visualizer }
