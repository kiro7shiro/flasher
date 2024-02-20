import * as visualizers from './visualizers.js'

/**
 * Adds a new audio node to the visualizers audio graph.
 * @param {Object} visualizer to which to add the node
 * @param {String} nodeName of the new node
 * @param {Object} options for setting the new node
 * @returns {AudioNode}
 */
export function addNode(visualizer, nodeName, options = {}) {
    const constructor = window[nodeName]
    if (!constructor) throw new Error(`${nodeName} not defined.`)
    const { context } = visualizer.analyser
    const node = new constructor(context, options)
    visualizer.audioGraph.push(node)
    return node
}

/**
 * Convenience function for adding node controls to the visualizers container.
 * @param {Object} visualizer to which to add the controls to
 * @param {HTMLElement} controls to add to the nodes container
 */
export function appendNodeControls(visualizer, controls) {
    const { element } = visualizer
    const nodesContainer = element.querySelector('#nodes-container')
    nodesContainer.append(controls.element)
}

/**
 * Connect a visualizers analyzer with the audioGraph and the audio source.
 * @param {Object} visualizer
 */
export function connect(sound, visualizer) {
    if (visualizer.audioGraph.length) {
        let prev = visualizer.audioGraph[0]
        prev.connect(visualizer.analyser)
        for (let nCnt = 1; nCnt < visualizer.audioGraph.length; nCnt++) {
            const next = visualizer.audioGraph[nCnt]
            next.connect(prev)
            prev = next
        }
        const last = visualizer.audioGraph[visualizer.audioGraph.length - 1]
        sound.source.connect(last)
    } else {
        sound.source.connect(visualizer.analyser)
    }
    visualizer.draw()
}

/**
 * Disconnect a visualizers analyzer from the audioGraph and the audio source.
 * @param {Object} visualizer
 */
export function disconnect(visualizer) {
    cancelAnimationFrame(visualizer.handle)
    visualizer.audioGraph.map(function (node) {
        node.disconnect()
    })
    visualizer.analyser.disconnect()
}

/**
 * Get visualizers names for displaying in the browser app.
 * @returns {Array}
 */
export function selectable() {
    return Object.keys(visualizers)
}

// TODO : for saving
export function stringify(visualizer) {}
