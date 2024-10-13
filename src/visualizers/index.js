import * as visualizers from './visualizers.js'
import { CustomNode } from '../nodes/CustomNode.js'
import { customNodes } from '../nodes/index.js'

/**
 * Adds a new audio node to the visualizers audio graph.
 * @param {Object} visualizer to which to add the node
 * @param {String} nodeName of the new node
 * @param {Object} options for setting the new node
 * @returns {AudioNode}
 */
export function addNode(visualizer, nodeName, options = {}) {
    const constructor = window[nodeName] || customNodes[nodeName]
    if (!constructor) throw new Error(`${nodeName} not defined.`)
    const { context } = visualizer.analyzer
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
    const nodesContainer = element.querySelector('.audio-nodes')
    const analyzer = nodesContainer.querySelector('#analyzer')
    //nodesContainer.append(controls.element)
    nodesContainer.insertBefore(controls.element, analyzer)
    nodesContainer.insertBefore(document.createElement('hr'), analyzer)
    //nodesContainer.insertAdjacentElement('afterbegin', controls.element)
}

/**
 * Connect a visualizers analyzer with the audioGraph and the audio source.
 * @param {Object} visualizer
 */
export function connect(sound, visualizer) {
    if (visualizer.audioGraph.length) {
        let prev = visualizer.audioGraph[visualizer.audioGraph.length - 1]
        if (prev instanceof CustomNode) {
            prev.output.connect(visualizer.analyzer)
        } else {
            prev.connect(visualizer.analyzer)
        }
        for (let nCnt = visualizer.audioGraph.length - 2; nCnt >= 0; nCnt--) {
            const next = visualizer.audioGraph[nCnt]
            switch (true) {
                case next instanceof CustomNode && prev instanceof CustomNode:
                    next.output.connect(prev.input)
                    break
                case next instanceof CustomNode && !(prev instanceof CustomNode):
                    next.output.connect(prev)
                    break
                case prev instanceof CustomNode:
                    next.connect(prev.input)
                    break
                default:
                    next.connect(prev)
                    break
            }
            prev = next
        }
        const last = visualizer.audioGraph[0]
        if (last instanceof CustomNode) {
            sound.source.connect(last.input)
        } else {
            sound.source.connect(last)
        }
    } else {
        sound.source.connect(visualizer.analyzer)
    }
    // FIX : single responsibility
    const start = sound.context.currentTime * 1000
    visualizer.timer.last = 0
    visualizer.draw(start)
}

/**
 * Disconnect a visualizers analyzer from the audioGraph and the audio source.
 * @param {Object} visualizer
 */
export function disconnect(visualizer) {
    // FIX : single responsibility 
    cancelAnimationFrame(visualizer.handle)
    visualizer.audioGraph.map(function (node) {
        if (node instanceof CustomNode) {
            node.output.disconnect()
        } else {
            node.disconnect()
        }
    })
    //visualizer.analyzer.disconnect()
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
