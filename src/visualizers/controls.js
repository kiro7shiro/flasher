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
    const maxDecibels = container.querySelector('#maxDecibels')
    const smoothingTimeConstant = container.querySelector('#smoothingTimeConstant')
    minDecibels.addEventListener('change', function (event) {
        analyser.minDecibels = event.target.value
    })
    maxDecibels.addEventListener('change', function (event) {
        analyser.maxDecibels = event.target.value
    })
    smoothingTimeConstant.addEventListener('change', function (event) {
        analyser.smoothingTimeConstant = event.target.value
    })
    minDecibels.value = analyser.minDecibels
    maxDecibels.value = analyser.maxDecibels
    smoothingTimeConstant.value = analyser.smoothingTimeConstant
    return container
}

/**
 * Holds events for each AudioNode from WebAudioApi
 */
const audioGraphEvents = {
    BiquadFilterNode: function (filter, container) {
        const frequency = container.querySelector('#frequency')
        const detune = container.querySelector('#detune')
        const Q = container.querySelector('#Q')
        const gain = container.querySelector('#gain')
        frequency.addEventListener('change', function (event) {
            filter.frequency.value = event.target.value
            console.log(filter.frequency.value)
        })
        detune.addEventListener('change', function (event) {
            filter.detune.value = event.target.value
        })
        Q.addEventListener('change', function (event) {
            filter.Q.value = event.target.value
        })
        gain.addEventListener('change', function (event) {
            filter.gain.value = event.target.value
        })
        frequency.value = filter.frequency.value
        detune.value = filter.detune.value
        Q.value = filter.Q.value
        gain.value = filter.gain.value
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
