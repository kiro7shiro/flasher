import { CustomNode } from './CustomNode.js'

class DelayAdd extends CustomNode {
    constructor(context, options = {}) {
        super(context, options)
        this.delay = new DelayNode(context, { delayTime: 0.4, maxDelayTime: 1 })
        this.gain = new GainNode(context, { gain: 10 })
        this.input.connect(this.delay)
        this.input.connect(this.gain)
        this.delay.connect(this.gain)        
        this.gain.connect(this.output)
    }
}

export { DelayAdd }
