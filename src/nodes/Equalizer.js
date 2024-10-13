import { CustomNode } from './CustomNode.js'

class Equalizer extends CustomNode {
    constructor(context, options = {}) {
        super(context, options)
        this.low = new BiquadFilterNode(context, { type: 'bandpass', frequency: 93.75, Q: 1 })
        this.mid = new BiquadFilterNode(context, { type: 'bandpass', frequency: 187.5, Q: 1 })
        this.high = new BiquadFilterNode(context, { type: 'bandpass', frequency: 375, Q: 1 })
        this.lowGain = new GainNode(context, { gain: 1 })
        this.midGain = new GainNode(context, { gain: 1 })
        this.highGain = new GainNode(context, { gain: 1 })
        this.input.connect(this.low)
        this.input.connect(this.mid)
        this.input.connect(this.high)
        this.low.connect(this.lowGain)
        this.mid.connect(this.midGain)
        this.high.connect(this.highGain)
        this.lowGain.connect(this.output)
        this.midGain.connect(this.output)
        this.highGain.connect(this.output)
    }
}

export { Equalizer }
