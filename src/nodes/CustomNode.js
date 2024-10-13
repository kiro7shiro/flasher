class CustomNode {
    constructor(context, options = {}) {
        // assign defaults
        options = Object.assign({}, { inputGain: 1.0, outputGain: 1.0 }, options)
        // construct node
        this.input = new GainNode(context, { gain: options.inputGain })
        this.output = new GainNode(context, { gain: options.outputGain })
    }
}

export { CustomNode }