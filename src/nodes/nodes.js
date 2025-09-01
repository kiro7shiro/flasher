/**
 * Control classes for audio nodes
 */

import { Control } from '/src/Control.js'

class Slider {
    constructor(container) {
        this.value = container.querySelector('.value')
        this.slider = container.querySelector('.slider')
        this.header = container.querySelector('.header')
    }
}

class AnalyserNode {
    static defaults = {
        template: '/views/nodes/AnalyzerNode.ejs',
        data: {},
        container: 'div',
        events: ['click', 'change']
    }
    static async build(node, options = {}) {
        options = Control.buildOptions(AnalyserNode.defaults, options)
        const { template, data, container, events } = options
        const control = await Control.build(template, data, container, events)
        return new AnalyserNode(node, control)
    }
    static buildSync(node, options = {}) {
        options = Control.buildOptions(AnalyserNode.defaults, options)
        const { template, data, container, events } = options
        const control = Control.buildSync(template, data, container, events)
        return new AnalyserNode(node, control)
    }
    constructor(node, control) {
        this.control = control
        this.container = control.container
        this.analyzer = node
        const { analyzer, container } = this
        const minDecibels = new Slider(container.querySelector('.minDB'))
        const maxDecibels = new Slider(container.querySelector(`.maxDB`))
        const analyzerSTC = new Slider(container.querySelector(`.STC`))
        const controls = container.querySelector('.node-controls')
        minDecibels.value.innerText = analyzer.minDecibels
        minDecibels.slider.value = analyzer.minDecibels
        maxDecibels.value.innerText = analyzer.maxDecibels
        maxDecibels.slider.value = analyzer.maxDecibels
        analyzerSTC.value.innerText = analyzer.smoothingTimeConstant
        analyzerSTC.slider.value = analyzer.smoothingTimeConstant
        this.control.on('toggle-analyser', function (event) {
            controls.classList.toggle('collapsed')
        })
        this.control.on('set-analyzer', function (event) {
            const { detail: target } = event.detail.dataset
            switch (target) {
                case 'minDB':
                    analyzer.minDecibels = minDecibels.slider.value
                    minDecibels.value.innerText = minDecibels.slider.value
                    break
                case 'maxDB':
                    analyzer.maxDecibels = maxDecibels.slider.value
                    maxDecibels.value.innerText = maxDecibels.slider.value
                    break
                case 'STC':
                    analyzer.smoothingTimeConstant = analyzerSTC.slider.value
                    analyzerSTC.value.innerText = analyzerSTC.slider.value
                    break
            }
        })
    }
}

class BiquadFilterNode {
    static defaults = {
        template: '/views/nodes/BiquadFilterNode.ejs',
        data: {},
        container: 'div',
        events: ['click', 'change'],
        type: 'lowpass',
        frequency: 11000,
        detune: 0,
        Q: 1,
        gain: 1
    }
    static async build(sound, options = {}) {
        options = Control.buildOptions(BiquadFilterNode.defaults, options)
        const { template, container, events } = options
        const control = await Control.build(template, options, container, events)
        return new BiquadFilterNode(sound, control)
    }
    static buildSync(sound, options = {}) {
        options = Control.buildOptions(BiquadFilterNode.defaults, options)
        const { template, container, events } = options
        const control = Control.buildSync(template, options, container, events)
        return new BiquadFilterNode(sound, control)
    }
    constructor(sound, control, options = {}) {
        options = Control.buildOptions(BiquadFilterNode.defaults, options)
        this.control = control
        this.container = control.container
        this.node = new window.BiquadFilterNode(sound.context, options)
        const { container } = control
        const { node } = this
        const frequency = new Slider(container.querySelector('.frequency'))
        const detune = new Slider(container.querySelector('.detune'))
        const Q = new Slider(container.querySelector('.Q'))
        const gain = new Slider(container.querySelector('.gain'))
        const controls = container.querySelector('.node-controls')
        const dropDownButton = controls.querySelector('.w3-button')
        frequency.value.innerText = node.frequency.value
        frequency.slider.value = node.frequency.value
        detune.value.innerText = node.detune.value
        detune.slider.value = node.detune.value
        Q.value.innerText = node.Q.value
        Q.slider.value = node.Q.value
        gain.value.innerText = node.gain.value
        gain.slider.value = node.gain.value
        this.control.on('toggle-filter', function () {
            controls.classList.toggle('collapsed')
        })
        this.control.on('set-filter', function (event) {
            const { detail: target } = event.detail.dataset
            switch (target) {
                case 'frequency':
                    node.frequency.value = frequency.slider.value
                    frequency.value.innerText = frequency.slider.value
                    break
                case 'detune':
                    node.detune.value = detune.slider.value
                    detune.value.innerText = detune.slider.value
                    break
                case 'Q':
                    node.Q.value = Q.slider.value
                    Q.value.innerText = Q.slider.value
                    break
                case 'gain':
                    node.gain.value = gain.slider.value
                    gain.value.innerText = gain.slider.value
                    break
                case 'lowpass':
                case 'highpass':
                case 'bandpass':
                case 'lowshelf':
                case 'highshelf':
                case 'notch':
                case 'peaking':
                    node.type = target
                    dropDownButton.innerText = target
                    break
            }
        })
    }
}

class DelayNode {
    static defaults = {
        template: '/views/nodes/DelayNode.ejs',
        data: {},
        container: 'div',
        events: ['click', 'change'],
        delayTime: 1
    }
    static async build(sound, options = {}) {
        options = Control.buildOptions(DelayNode.defaults, options)
        const { template, container, events } = options
        const control = await Control.build(template, options, container, events)
        return new DelayNode(sound, control)
    }
    static buildSync(sound, options = {}) {
        options = Control.buildOptions(DelayNode.defaults, options)
        const { template, container, events } = options
        const control = Control.buildSync(template, options, container, events)
        return new DelayNode(sound, control)
    }
    constructor(sound, control, options = {}) {
        options = Control.buildOptions(DelayNode.defaults, options)
        this.control = control
        this.container = control.container
        this.node = new window.DelayNode(sound.context, options)
        const { container } = control
        const { node } = this
        const delayTime = new Slider(container.querySelector('.delayTime'))
        delayTime.value.innerText = node.delayTime.value
        delayTime.slider.value = node.delayTime.value
        const controls = container.querySelector('.node-controls')
        this.control.on('toggle-delay', function () {
            controls.classList.toggle('collapsed')
        })
        this.control.on('set-delay', function (event) {
            node.delayTime.value = delayTime.slider.value
            delayTime.value.innerText = delayTime.slider.value
        })
    }
}

class DynamicsCompressorNode {
    static defaults = {
        template: '/views/nodes/DynamicsCompressorNode.ejs',
        data: {},
        container: 'div',
        events: ['click', 'change'],
        threshold: -100,
        knee: 20,
        ratio: 1,
        attack: 0,
        release: 0
    }
    static async build(sound, options = {}) {
        options = Control.buildOptions(DynamicsCompressorNode.defaults, options)
        const { template, container, events } = options
        const control = await Control.build(template, options, container, events)
        return new DynamicsCompressorNode(sound, control)
    }
    static buildSync(sound, options = {}) {
        options = Control.buildOptions(DynamicsCompressorNode.defaults, options)
        const { template, container, events } = options
        const control = Control.buildSync(template, options, container, events)
        return new DynamicsCompressorNode(sound, control)
    }
    constructor(sound, control, options = {}) {
        options = Control.buildOptions(DynamicsCompressorNode.defaults, options)
        this.control = control
        this.container = control.container
        this.node = new window.DynamicsCompressorNode(sound.context, options)
        const { container } = control
        const { node } = this
        const controls = container.querySelector('.node-controls')
        const threshold = new Slider(container.querySelector('.threshold'))
        const knee = new Slider(container.querySelector('.knee'))
        const ratio = new Slider(container.querySelector('.ratio'))
        const attack = new Slider(container.querySelector('.attack'))
        const release = new Slider(container.querySelector('.release'))
        threshold.value.innerText = node.threshold.value
        threshold.slider.value = node.threshold.value
        knee.value.innerText = node.knee.value
        knee.slider.value = node.knee.value
        ratio.value.innerText = node.ratio.value
        ratio.slider.value = node.ratio.value
        attack.value.innerText = node.attack.value
        attack.slider.value = node.attack.value
        release.value.innerText = node.release.value
        release.slider.value = node.release.value
        this.control.on('toggle-compressor', function () {
            controls.classList.toggle('collapsed')
        })
        this.control.on('set-compressor', function (event) {
            const { detail: target } = event.detail.dataset
            switch (target) {
                case 'threshold':
                    node.threshold.value = threshold.slider.value
                    threshold.value.innerText = threshold.slider.value
                    break
                case 'knee':
                    node.knee.value = knee.slider.value
                    knee.value.innerText = knee.slider.value
                    break
                case 'ratio':
                    node.ratio.value = ratio.slider.value
                    ratio.value.innerText = ratio.slider.value
                    break
                case 'attack':
                    node.attack.value = attack.slider.value
                    attack.value.innerText = attack.slider.value
                    break
                case 'release':
                    node.release.value = release.slider.value
                    release.value.innerText = release.slider.value
                    break
            }
        })
    }
}

class GainNode {
    static defaults = {
        template: '/views/nodes/GainNode.ejs',
        data: {},
        container: 'div',
        events: ['click', 'change'],
        gain: 0
    }
    static async build(sound, options = {}) {
        options = Control.buildOptions(GainNode.defaults, options)
        const { template, container, events } = options
        const control = await Control.build(template, options, container, events)
        return new GainNode(sound, control)
    }
    static buildSync(sound, options = {}) {
        options = Control.buildOptions(GainNode.defaults, options)
        const { template, container, events } = options
        const control = Control.buildSync(template, options, container, events)
        return new GainNode(sound, control)
    }
    constructor(sound, control, options = {}) {
        options = Control.buildOptions(GainNode.defaults, options)
        this.control = control
        this.container = control.container
        this.node = new window.GainNode(sound.context, options)
        const { container } = control
        const { node } = this
        const controls = container.querySelector('.node-controls')
        const gain = new Slider(container.querySelector('.gain'))
        gain.value.innerText = node.gain.value
        gain.slider.value = node.gain.value
        this.control.on('toggle-gain', function () {
            controls.classList.toggle('collapsed')
        })
        this.control.on('set-gain', function () {
            node.gain.value = gain.slider.value
            gain.value.innerText = gain.slider.value
        })
    }
}

class StereoPannerNode {
    static defaults = {
        template: '/views/nodes/StereoPannerNode.ejs',
        data: {},
        container: 'div',
        events: ['click', 'change'],
        pan: 0
    }
    static async build(sound, options = {}) {
        options = Control.buildOptions(StereoPannerNode.defaults, options)
        const { template, container, events } = options
        const control = await Control.build(template, options, container, events)
        return new StereoPannerNode(sound, control)
    }
    static buildSync(sound, options = {}) {
        options = Control.buildOptions(StereoPannerNode.defaults, options)
        const { template, container, events } = options
        const control = Control.buildSync(template, options, container, events)
        return new StereoPannerNode(sound, control)
    }
    constructor(sound, control, options = {}) {
        options = Control.buildOptions(StereoPannerNode.defaults, options)
        this.control = control
        this.container = control.container
        this.node = new window.StereoPannerNode(sound.context, options)
        const { container } = control
        const { node } = this
        const controls = container.querySelector('.node-controls')
        const pan = new Slider(container.querySelector('.pan'))
        pan.value.innerText = node.pan.value
        pan.slider.value = node.pan.value
        this.control.on('toggle-pan', function () {
            controls.classList.toggle('collapsed')
        })
        this.control.on('set-pan', function () {
            node.pan.value = pan.slider.value
            pan.value.innerText = pan.slider.value
        })
    }
}

export class AudioNodes {
    static AnalyserNode = AnalyserNode
    static BiquadFilterNode = BiquadFilterNode
    static DelayNode = DelayNode
    static DynamicsCompressorNode = DynamicsCompressorNode
    static GainNode = GainNode
    static StereoPannerNode = StereoPannerNode
    static split(input, outputs) {
        // split one nodes connection into all output nodes
        for (let oCnt = 0; oCnt < outputs.length; oCnt++) {
            const output = outputs[oCnt]
            input.connect(output)
        }
    }
    static merge(inputs, output) {
        // merge all inputs connections into one output node
        for (let iCnt = 0; iCnt < inputs.length; iCnt++) {
            const input = inputs[iCnt]
            input.connect(output)
        }
    }
    static addScrollEffect(container) {
        const scroll = container.parentElement
        scroll.addEventListener('wheel', (event) => {
            if (event.deltaY !== 0) {
                event.preventDefault()
                const scrollAmount = event.deltaY
                const currentScrollLeft = container.scrollLeft
                const newScrollLeft = currentScrollLeft + scrollAmount
                scroll.scrollTo({
                    left: newScrollLeft,
                    behavior: 'smooth'
                })
            }
        })
        return container
    }
}
