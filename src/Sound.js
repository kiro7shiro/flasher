class Sound {
    constructor() {
        this.connected = false
        this.context = null
        this.element = null
        this.source = null
    }
    createAnalyser({ fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        if (!this.context) this.context = new AudioContext()
        const analyser = this.context.createAnalyser()
        analyser.fftSize = fftSize
        analyser.smoothingTimeConstant = smoothingTimeConstant
        return analyser
    }
    createBiquadFilter(type, { detune = 0, frequency = 350, gain = 0, Q = 1 } = {}) {
        if (!this.context) this.context = new AudioContext()
        const filter = this.context.createBiquadFilter()
        filter.detune.value = detune
        filter.frequency.value = frequency
        filter.gain.value = gain
        filter.Q.value = Q
        filter.type = type
        return filter
    }
    connect(element) {
        if (!this.context) this.context = new AudioContext()
        const { context } = this
        this.element = element
        // TODO : connect video elements, too
        /* this.stream = element.mozCaptureStream()
        this.source = context.createMediaStreamSource(this.element) */
        this.source = context.createMediaElementSource(this.element)
        this.source.connect(context.destination)
        this.connected = true
    }
    disconnect() {
        if (this.source) this.source.disconnect()
        this.source = null
        this.connected = false
    }
}

export { Sound }
