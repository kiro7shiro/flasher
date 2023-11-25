const visualizers = {}

export async function getControls(visualizer) {
    const className = visualizer.constructor.name
    // increase count
    if (!visualizers[className]) visualizer[className] = 0
    visualizer[className]++
    // get class controls
    const resp = await fetch(`./controls?visualizer=${className}&id=${className}${visualizer[className]}`)
    let html = await resp.text()
    // get audio graph controls
    for (let aCnt = 0; aCnt < visualizer.audioGraph.length; aCnt++) {
        const node = visualizer.audioGraph[aCnt]
        const nodeClassName = node.constructor.name
        if (!visualizers[nodeClassName]) visualizer[nodeClassName] = 0
        visualizer[nodeClassName]++
        const resp2 = await fetch(`./controls?visualizer=${nodeClassName}&id=${nodeClassName}${visualizer[nodeClassName]}`)
        const html2 = await resp2.text()
        html += html2
    }
    const controls = visualizer.addControlsEvents(html)
    return controls
}

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

const audioGraphEvents = {
    BiquadFilterNode: function (filter, container) {
        const frequency = container.querySelector('#frequency')
        const detune = container.querySelector('#detune')
        const Q = container.querySelector('#Q')
        const gain = container.querySelector('#gain')
        frequency.addEventListener('change', function (event) {
            filter.frequency.value = event.target.value
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

export function addAudioGraphEvents(visualizer, container) {
    for (let nCnt = 0; nCnt < visualizer.audioGraph.length; nCnt++) {
        const node = visualizer.audioGraph[nCnt]
        const nodeClassName = node.constructor.name
        const events = audioGraphEvents[nodeClassName]
        events(node, container)
    }
}

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