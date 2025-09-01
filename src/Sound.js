// TODO : Sound
// [ ]  : connect video elements, too

class Sound {
    constructor() {
        this.connected = false
        this.context = null
        this.element = null
        this.source = null
    }
    createAnalyzer({ fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
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
    /**
     * Connects the audio element to the audio context. Creates a new media
     * element source from the element and connects it to the destination of
     * the context. This will allow the audio to be heard.
     * @param {HTMLElement} element - The element to connect to the context.
     */
    connect(element) {
        if (!this.context) this.context = new AudioContext()
        const { context } = this
        this.element = element
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
