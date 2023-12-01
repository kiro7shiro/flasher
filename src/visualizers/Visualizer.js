import { Sound } from '../Sound.js'
import { addAnalyzerEvents, addAudioGraphEvents } from './controls.js'

class Visualizer {
    constructor(sound) {
        this.analyser = sound.createAnalyser()
        this.audioGraph = []
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
        this.clubber = new Clubber({
            size: this.analyser.fftSize, // Samples for the fourier transform. The produced linear frequency bins will be 1/2 that.
            mute: false, // whether the audio source should be connected to web audio context destination.
            context: sound.context,
            analyser: this.analyser
        })
        this.band = this.clubber.band({
            template: '0123', // alternately [0, 1, 2, 3]
            from: 1, // minimum midi note to watch
            to: 32, // maximum midi note, up to 160
            low: 1, // Low velocity/power threshold
            high: 128, // High velocity/power threshold
            smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for the values
            adapt: [1, 1, 1, 1], // Adaptive bounds setup
            snap: 0.33
        })
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

        // Specify the audio source to analyse. Can be an audio/video element or an instance of AudioNode.
        this.clubber.listen(sound.source)

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
        this.clubber.update()
        const buffer = new Float32Array(4)
        this.band(buffer)

        const test = this.clubber.descriptions.slice(0, 4).reduce(function (accu, curr, index, self) {
            accu.push({ description: self[index], value: (128 * buffer[index]).toFixed(2) })
            return accu
        }, [])
        console.table(test)
    }
}

export { Visualizer }
