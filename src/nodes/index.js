import * as nodes from './nodes.js'

export function addEvents(node, control) {
    const nodeName = node.constructor.name
    const adder = nodes[nodeName]
    if (!adder) return null
    adder(node, control)
}

export function AnalyserNode(visualizer) {
    const { analyser, control, element } = visualizer
    const minDecibels = element.querySelector(`#analyser #minDecibels`)
    const maxDecibels = element.querySelector(`#analyser #maxDecibels`)
    const analyserSTC = element.querySelector(`#analyser #smoothingTimeConstant`)
    minDecibels.value = analyser.minDecibels
    minDecibels.parentNode.children[1].innerText = `${analyser.minDecibels} DB`
    maxDecibels.value = analyser.maxDecibels
    maxDecibels.parentNode.children[1].innerText = `${analyser.maxDecibels} DB`
    analyserSTC.value = analyser.smoothingTimeConstant
    analyserSTC.parentNode.children[1].innerText = `${analyser.smoothingTimeConstant} ms`
    control.on('set-analyser', function (event) {
        const detail = event.detail
        const target = element.querySelector(`#analyser #${detail}`)
        if (analyser[detail] !== undefined && analyser[detail] !== null) {
            if (detail === 'minDecibels' || detail === 'maxDecibels') {
                // clip range under 0
                analyser[detail] = target.value > -1 ? -1 : target.value
                target.parentNode.children[1].innerText = `${target.value} DB`
            } else {
                // smoothingTimeConstant
                // clip range between 0 and 1
                const value = target.value > 1 ? 1 : target.value < 0 ? 0 : target.value
                analyser[detail] = value
                target.parentNode.children[1].innerText = `${target.value} ms`
            }
        }
    })
}

export function BiquadFilterNode(filter, control) {
    const { element } = control
    const frequency = element.querySelector('#frequency')
    const detune = element.querySelector('#detune')
    const Q = element.querySelector('#Q')
    const gain = element.querySelector('#gain')
    frequency.value = filter.frequency.value
    frequency.parentNode.children[1].innerText = `${filter.frequency.value} Hz`
    detune.value = filter.detune.value
    detune.parentNode.children[1].innerText = `${filter.detune.value} Hz`
    Q.value = filter.Q.value
    Q.parentNode.children[1].innerText = `${filter.Q.value}`
    gain.value = filter.gain.value
    gain.parentNode.children[1].innerText = `${filter.gain.value} dB`
    control.on('set-filter', function (event) {
        const detail = event.detail
        const target = element.querySelector(`#${detail}`)
        if (filter[detail] !== undefined && filter[detail] !== null) {
            filter[detail].value = target.value
            switch (detail) {
                case 'frequency':
                case 'detune':
                    target.parentNode.children[1].innerText = `${target.value} Hz`
                    break
                case 'gain':
                    target.parentNode.children[1].innerText = `${target.value} dB`
                    break
                default:
                    target.parentNode.children[1].innerText = `${target.value}`
                    break
            }
        }
    })
}

export function DelayNode(node, control) {
    const { element } = control
    const delay = element.querySelector('#delay')
    delay.value = node.delayTime.value
    delay.parentNode.children[1].innerText = `${node.delayTime.value} ms`
    control.on('set-delay', function () {
        node.delayTime.value = delay.value
        delay.parentNode.children[1].innerText = `${delay.value} ms`
    })
}

export function DynamicsCompressorNode(compressor, control) {
    const { element } = control
    const threshold = element.querySelector('#threshold')
    const knee = element.querySelector('#knee')
    const ratio = element.querySelector('#ratio')
    const attack = element.querySelector('#attack')
    const release = element.querySelector('#release')
    threshold.value = compressor.threshold.value
    threshold.parentNode.children[1].innerText = `${compressor.threshold.value} dB`
    knee.value = compressor.knee.value
    knee.parentNode.children[1].innerText = `${compressor.knee.value}`
    ratio.value = compressor.ratio.value
    ratio.parentNode.children[1].innerText = `${compressor.ratio.value} dB`
    attack.value = compressor.attack.value
    attack.parentNode.children[1].innerText = `${compressor.attack.value.toFixed(2)} s`
    release.value = compressor.release.value
    release.parentNode.children[1].innerText = `${compressor.release.value.toFixed(2)} s`
    control.on('set-compressor', function (event) {
        const detail = event.detail
        const target = element.querySelector(`#${detail}`)
        if (compressor[detail] !== undefined && compressor[detail] !== null) {
            compressor[detail].value = target.value
            switch (detail) {
                case 'threshold':
                case 'ratio':
                    target.parentNode.children[1].innerText = `${target.value} dB`
                    break
                case 'attack':
                case 'release':
                    target.parentNode.children[1].innerText = `${target.value} s`
                    break
                default:
                    target.parentNode.children[1].innerText = `${target.value}`
                    break
            }
        }
    })
}

export function GainNode(node, control) {
    const { element } = control
    const gain = element.querySelector('#gain')
    gain.value = node.gain.value
    gain.parentNode.children[1].innerText = `${node.gain.value} dB`
    control.on('set-gain', function () {
        node.gain.value = gain.value
        gain.parentNode.children[1].innerText = `${gain.value} dB`
    })
}

export function StereoPannerNode(node, control) {
    const { element } = control
    const pan = element.querySelector('#pan')
    pan.value = node.pan.value
    pan.parentNode.children[1].innerText = `${node.pan.value}`
    control.on('set-panner', function () {
        node.pan.value = pan.value
        pan.parentNode.children[1].innerText = `${pan.value}`
    })
}

export function selectable() {
    const notSelectable = ['addEvents', 'AnalyserNode', 'selectable']
    const displayNodes = Object.keys(nodes).filter(function (node) {
        return notSelectable.includes(node) === false
    })
    return displayNodes
}
