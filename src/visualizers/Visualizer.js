import { Sound } from '../Sound.js'

class Visualizer {
    constructor(sound) {
        this.analyser = this.analyser = sound.createAnalyser()
        this.audioGraph = []
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
        this.source = null
    }
    get controls() {
        const container = document.createElement('div')
        container.classList.add('w3-container')
        container.innerHTML = `
        <div>minDecibels</div>
        <input type="range" min="-100" max="0" value="${this.analyser.minDecibels}" id="minDecibels">
        <br>
        <div>maxDecibels</div>
        <input type="range" min="-100" max="0" value="${this.analyser.maxDecibels}" id="maxDecibels">
        <br>
        <div>smoothingTimeConstant</div>
        <input type="range" min="0" max="1" step=".05" value="${this.analyser.smoothingTimeConstant}" id="smoothingTimeConstant">
        `
        const self = this
        const minDecibels = container.querySelector('#minDecibels')
        const maxDecibels = container.querySelector('#maxDecibels')
        const smoothingTimeConstant = container.querySelector('#smoothingTimeConstant')
        minDecibels.addEventListener('change', function (event) {
            self.analyser.minDecibels = event.target.value
        })
        maxDecibels.addEventListener('change', function (event) {
            self.analyser.maxDecibels = event.target.value
        })
        smoothingTimeConstant.addEventListener('change', function (event) {
            self.analyser.smoothingTimeConstant = event.target.value
        })
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
