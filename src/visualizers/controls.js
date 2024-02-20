/**
 * Handles requesting controls from the server and adds events
 * to the resulting html.
 */

import { Visualizers } from './Visualizers.js'
import { Visualizer } from './Visualizer.js'
import { Grid } from './Grid.js'

/**
 * Get the html controls for a visualizer or an audio node.
 * Adds events, too.
 * @param {Visualizer|AudioNode} instance the visualizer or node to get the controls for
 * @returns {HTMLElement}
 */
export async function getControls(instance, options = {}) {
    const className = instance.constructor.name
    // stringify params
    const isAudioNode = instance instanceof AudioNode
    const params = new URLSearchParams()
    params.append('instance', className)
    params.append('isAudioNode', isAudioNode)
    for (const key in options) {
        params.append(key, options[key])
    }
    // get controls
    const resp = await fetch(`./controls?${params}`)
    const html = await resp.text()
    // add events
    const controls = addEvents(instance, html)
    return controls
}

/**
 * Add events to html and inserts the html into the page
 * @param {Visualizer|AudioNode} instance
 * @param {String} html
 * @returns {HTMLElement}
 */
export function addEvents(instance, html) {
    const findID = /id="([a-zA-Z0-9]*)"/i
    const [match, id] = findID.exec(html)
    const controls = document.querySelector('#controlsList')
    controls.insertAdjacentHTML('beforeend', html)
    const container = controls.querySelector(`#${id}`)
    container.remove()
    container.addEventListener('click', function (event) {
        const controlId = event.target.closest('div[id]').id
        event.target.dataset.action = `click-${id}-${controlId}`
    })
    const analyserEvents = audioNodesEvents['AnalyserNode']
    switch (true) {
        case instance instanceof AudioNode:
            addAudioNodeEvents(instance, container)
            break
        case instance instanceof Visualizer:
            analyserEvents(instance.analyser, container)
        case instance instanceof Visualizers.FFT:
            break
    }
    return container
}

/**
 * Select events based on instance className
 * @param {Visualizer|AudioNode} instance
 * @param {HTMLElement} container
 */
export function addAudioNodeEvents(instance, container) {
    const className = instance.constructor.name
    const events = audioNodesEvents[className]
    if (events) events(instance, container)
}

/**
 * Holds events for some AudioNodes from WebAudioApi
 */
const audioNodesEvents = {
    AnalyserNode: function (analyser, container) {
        const minDecibels = container.querySelector('#minDecibels')
        const minDbValue = container.querySelector('#minDecibels-value')
        const maxDecibels = container.querySelector('#maxDecibels')
        const maxDbValue = container.querySelector('#maxDecibels-value')
        const smoothingTimeConstant = container.querySelector('#smoothingTimeConstant')
        const timeValue = container.querySelector('#smoothingTimeConstant-value')
        minDecibels.addEventListener('change', function (event) {
            analyser.minDecibels = event.target.value
            minDbValue.innerText = `${analyser.minDecibels} dB`
        })
        maxDecibels.addEventListener('change', function (event) {
            analyser.maxDecibels = event.target.value
            maxDbValue.innerText = `${analyser.maxDecibels} dB`
        })
        smoothingTimeConstant.addEventListener('change', function (event) {
            analyser.smoothingTimeConstant = event.target.value
            timeValue.innerText = `${analyser.smoothingTimeConstant} ms`
        })
        minDecibels.value = analyser.minDecibels
        minDbValue.innerText = `${analyser.minDecibels} dB`
        maxDecibels.value = analyser.maxDecibels
        maxDbValue.innerText = `${analyser.maxDecibels} dB`
        smoothingTimeConstant.value = analyser.smoothingTimeConstant
        timeValue.innerText = `${analyser.smoothingTimeConstant} ms`
    },
    BiquadFilterNode: function (filter, container) {
        const frequency = container.querySelector('#frequency')
        const freqValue = container.querySelector('#frequency-value')
        const detune = container.querySelector('#detune')
        const detuneValue = container.querySelector('#detune-value')
        const Q = container.querySelector('#Q')
        const QValue = container.querySelector('#Q-value')
        const gain = container.querySelector('#gain')
        const gainValue = container.querySelector('#gain-value')
        frequency.addEventListener('change', function (event) {
            filter.frequency.value = event.target.value
            freqValue.innerText = `${filter.frequency.value} Hz`
        })
        detune.addEventListener('change', function (event) {
            filter.detune.value = event.target.value
            detuneValue.innerText = `${filter.detune.value} cent`
        })
        Q.addEventListener('change', function (event) {
            filter.Q.value = event.target.value
            QValue.innerText = `${filter.Q.value.toFixed(0)}`
        })
        gain.addEventListener('change', function (event) {
            filter.gain.value = event.target.value
            gainValue.innerText = `${filter.gain.value} dB`
        })
        frequency.value = filter.frequency.value
        freqValue.innerText = `${filter.frequency.value} Hz`
        detune.value = filter.detune.value
        detuneValue.innerText = `${filter.detune.value} cent`
        Q.value = filter.Q.value
        gain.value = filter.gain.value
        gainValue.innerText = `${filter.gain.value} dB`
    },
    DelayNode: function (delay, container) {
        const delayValue = container.querySelector('#delay')
        delayValue.addEventListener('change', function (event) {
            delay.delayTime.value = event.target.value
            delayValue.value = delay.delayTime.value
        })
        delayValue.value = delay.delayTime.value
    },
    GainNode: function (gain, container) {
        const gainSlider = container.querySelector('#gain')
        const gainValue = container.querySelector('#gain-value')
        gainSlider.addEventListener('change', function (event) {
            gain.gain.value = event.target.value
            gainValue.innerText = `${gain.gain.value} dB`
        })
        gainValue.innerText = `${gain.gain.value} dB`
    }
}

/**
 * Add events for each node in the audioGraph of a visualizer
 * @param {Visualizer} visualizer the visualizer to bind the events
 * @param {HTMLDivElement} container the html container to wich the events are added
 * @deprecated
 */
export function addAudioGraphEvents(visualizer, container) {
    for (let nCnt = 0; nCnt < visualizer.audioGraph.length; nCnt++) {
        const node = visualizer.audioGraph[nCnt]
        const nodeClassName = node.constructor.name
        const events = audioNodesEvents[nodeClassName]
        const id = `${nodeClassName}${nCnt + 1}`
        const nodeContainer = container.querySelector(`#${id}`)
        events(node, nodeContainer)
    }
}

/**
 * Add events for a Grid.js visualizer class
 * @param {Grid} grid a grid visualizer class to bind the events
 * @param {HTMLDivElement} container the html container to wich the events are added
 * @deprecated
 */
export function addGridEvents(grid, container) {
    const cols = container.querySelector('#cols')
    const rows = container.querySelector('#rows')
    cols.addEventListener('change', function (event) {
        grid.cols = event.target.value
    })
    rows.addEventListener('change', function (event) {
        grid.rows = event.target.value
    })
    cols.value = grid.cols
    rows.value = grid.rows
}
