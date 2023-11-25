import { Sound } from '../Sound.js'
import { addAnalyzerEvents, addAudioGraphEvents } from './controls.js'

class Visualizer {
    constructor(sound) {
        this.analyser = this.analyser = sound.createAnalyser()
        this.audioGraph = []
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
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
}

export { Visualizer }
