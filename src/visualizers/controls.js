import { Visualizer } from './Visualizer.js'
import { Grid } from './Grid.js'

/**
 * Get the html controls for a visualizer.
 * Adds events, too.
 * @param {Visualizer} visualizer the visualizer to get the controls for
 * @returns {HTMLDivElement}
 */
export async function getControls(visualizer) {
    const visualizerClass = visualizer.constructor.name
    // build audio graph query
    const audioGraph = []
    for (let aCnt = 0; aCnt < visualizer.audioGraph.length; aCnt++) {
        const node = visualizer.audioGraph[aCnt]
        const nodeClass = node.constructor.name
        const data = {
            class: nodeClass,
            type: node.type
        }
        audioGraph.push(data)
    }
    // stringify audioGraph
    const params = new URLSearchParams()
    params.append('visualizer', visualizerClass)
    params.append('audioGraph', JSON.stringify(audioGraph))
    // get class controls
    const resp = await fetch(`./controls?${params}`)
    const html = await resp.text()
    // get audio graph controls
    const controls = visualizer.addControlsEvents(html)
    return controls
}

/**
 * Add events for an analyser node
 * @param {AnalyserNode} analyser the analyser to bind the events for
 * @param {HTMLDivElement} html the html container to wich the events are added
 * @returns {HTMLDivElement}
 */
export function addAnalyzerEvents(analyser, html) {
    const container = document.createElement('div')
    container.classList.add('w3-container')
    container.innerHTML = html
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
    return container
}

/**
 * Holds events for each AudioNode from WebAudioApi
 */
const audioGraphEvents = {
    BiquadFilterNode: function (filter, container) {
        const frequency = container.querySelector('#frequency')
        const freqValue = container.querySelector('#frequency-value')
        const detune = container.querySelector('#detune')
        const detuneValue = container.querySelector('#detune-value')
        const Q = container.querySelector('#Q')
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
            Q.value = `${filter.Q.value}`
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
    }
}

/**
 * Add events for each node in the audioGraph of a visualizer
 * @param {Visualizer} visualizer the visualizer to bind the events
 * @param {HTMLDivElement} container the html container to wich the events are added
 */
export function addAudioGraphEvents(visualizer, container) {
    for (let nCnt = 0; nCnt < visualizer.audioGraph.length; nCnt++) {
        const node = visualizer.audioGraph[nCnt]
        const nodeClassName = node.constructor.name
        const events = audioGraphEvents[nodeClassName]
        const id = `${nodeClassName}${nCnt + 1}`
        const nodeContainer = container.querySelector(`#${id}`)
        events(node, nodeContainer)
    }
}

/**
 * Add events for a Grid.js visualizer class
 * @param {Grid} grid a grid visualizer class to bind the events
 * @param {HTMLDivElement} container the html container to wich the events are added
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
