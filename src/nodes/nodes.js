/**
 * This module holds functions that add event handlers for the
 * individual elements
 */

export function AudioNodes(visualizer) {
    const { control, element } = visualizer
    const audioNodes = element.querySelector('.audio-nodes')
    control.on('toggle-controls', function () {
        if (!audioNodes.style.display || audioNodes.style.display === 'none') {
            audioNodes.style.display = 'block'
        } else {
            audioNodes.style.display = 'none'
        }
    })
}

export function AnalyserNode(visualizer) {
    const { analyzer, control, element } = visualizer
    const minDecibels = element.querySelector(`#analyzer #minDecibels`)
    const maxDecibels = element.querySelector(`#analyzer #maxDecibels`)
    const analyzerSTC = element.querySelector(`#analyzer #smoothingTimeConstant`)
    minDecibels.value = analyzer.minDecibels
    minDecibels.parentNode.children[1].innerText = `${analyzer.minDecibels} DB`
    maxDecibels.value = analyzer.maxDecibels
    maxDecibels.parentNode.children[1].innerText = `${analyzer.maxDecibels} DB`
    analyzerSTC.value = analyzer.smoothingTimeConstant
    analyzerSTC.parentNode.children[1].innerText = `${analyzer.smoothingTimeConstant} ms`
    control.on('set-analyzer', function (event) {
        const detail = event.detail
        const target = element.querySelector(`#analyzer #${detail}`)
        if (analyzer[detail] !== undefined && analyzer[detail] !== null) {
            if (detail === 'minDecibels' || detail === 'maxDecibels') {
                // clip range under 0
                analyzer[detail] = target.value > -1 ? -1 : target.value
                target.parentNode.children[1].innerText = `${target.value} DB`
            } else {
                // smoothingTimeConstant
                // clip range between 0 and 1
                const value = target.value > 1 ? 1 : target.value < 0 ? 0 : target.value
                analyzer[detail] = value
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

export function Equalizer(eq, control) {
    const { element } = control
    const low = element.querySelector('#low')
    const mid = element.querySelector('#mid')
    const high = element.querySelector('#high')
    const lowGain = element.querySelector('#low-gain')
    const midGain = element.querySelector('#mid-gain')
    const highGain = element.querySelector('#high-gain')
    const lowQ = element.querySelector('#low-Q')
    const midQ = element.querySelector('#mid-Q')
    const highQ = element.querySelector('#high-Q')
    low.value = eq.low.frequency.value
    mid.value = eq.mid.frequency.value
    high.value = eq.high.frequency.value
    lowGain.value = eq.lowGain.gain.value
    midGain.value = eq.midGain.gain.value
    highGain.value = eq.highGain.gain.value
    control.on('set-low', function () {
        eq.low.frequency.value = low.value
        low.parentNode.children[1].innerText = `${low.value} Hz`
    })
    control.on('set-mid', function () {
        eq.mid.frequency.value = mid.value
        mid.parentNode.children[1].innerText = `${mid.value} Hz`
    })
    control.on('set-high', function () {
        eq.high.frequency.value = high.value
        high.parentNode.children[1].innerText = `${high.value} Hz`
    })
    control.on('set-low-gain', function () {
        eq.lowGain.gain.value = lowGain.value
        lowGain.parentNode.children[1].innerText = `${lowGain.value} dB`
    })
    control.on('set-mid-gain', function () {
        eq.midGain.gain.value = midGain.value
        midGain.parentNode.children[1].innerText = `${midGain.value} dB`
    })
    control.on('set-high-gain', function () {
        eq.highGain.gain.value = highGain.value
        highGain.parentNode.children[1].innerText = `${highGain.value} dB`
    })
    control.on('set-low-Q', function () {
        eq.low.Q.value = lowQ.value
        lowQ.parentNode.children[1].innerText = `${lowQ.value} si`
    })
    control.on('set-mid-Q', function () {
        eq.mid.Q.value = midQ.value
        midQ.parentNode.children[1].innerText = `${midQ.value} si`
    })
    control.on('set-high-Q', function () {
        eq.high.Q.value = highQ.value
        highQ.parentNode.children[1].innerText = `${highQ.value} si`
    })
}

export function DelayAdd(delayAdd, control) {
    const { element } = control
    const delay = element.querySelector('#delay')
    const gain = element.querySelector('#gain')
    delay.value = delayAdd.delay.delayTime.value
    delay.parentNode.children[1].innerText = `${delayAdd.delay.delayTime.value} s`
    gain.value = delayAdd.gain.gain.value
    gain.parentNode.children[1].innerText = `${delayAdd.gain.gain.value} Hz`
    control.on('set-delay', function () {
        delayAdd.delay.delayTime.value = delay.value
        delay.parentNode.children[1].innerText = `${delay.value} s`
    })    
    control.on('set-gain', function () {
        delayAdd.gain.gain.value = gain.value
        gain.parentNode.children[1].innerText = `${gain.value} Hz`
    })    
}