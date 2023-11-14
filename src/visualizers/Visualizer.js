import { Sound } from '../Sound.js'

class Visualizer {
    constructor(sound) {
        this.analyser = this.analyser = sound.createAnalyser()
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.connected = false
        this.source = null
        this.connect(sound)
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
        this.connected = false
        if (!sound instanceof Sound) throw new Error(`Argument must be an instance of Sound.`)
        if (!sound.source) throw new Error(`No sound source found.`)
        sound.source.connect(this.analyser)
        this.source = sound.source
        this.connected = true
    }
    disconnect() {
        if (this.analyser) this.analyser.disconnect()
        this.connected = false
    }
}

export { Visualizer }
