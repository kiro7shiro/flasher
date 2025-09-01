export * from './Bars.js'
export * from './Grid.js'
export * from './Spectrum.js'
export * from './BeatDetector.js'
export * from './Waveform.js'
export * from './Meter.js'

import { Meter } from './Meter.js'
import { Spectrum } from './Spectrum.js'
import { CustomNode } from '../nodes/CustomNode.js'

export class Visualizers {
    static Meter = Meter
    static Spectrum = Spectrum
    static addNode(visualizer, node) {
        visualizer.audioGraph.push(node)
        visualizer.audioNodes.insertAdjacentElement('afterbegin', node.container)
    }
    static connect(sound, visualizer) {
        // FIXME : check order of connections
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
    }
    static connect2(sound, visualizer) {
        if (visualizer.audioGraph.length) {
            let prev = visualizer.audioGraph[0]
            prev.disconnect()
            prev.connect(visualizer.analyzer)
            for (let nCnt = 1; nCnt < visualizer.audioGraph.length; nCnt++) {
                const node = visualizer.audioGraph[nCnt]
                node.disconnect()
                node.connect(prev)
                prev = node
            }
            const last = visualizer.audioGraph[visualizer.audioGraph.length - 1]
            sound.source.connect(last)
        } else {
            sound.source.connect(visualizer.analyzer)
        }
    }
    static disconnect(visualizer) {
        for (let nCnt = 0; nCnt < visualizer.audioGraph.length; nCnt++) {
            const node = visualizer.audioGraph[nCnt]
            if (node instanceof CustomNode) {
                node.output.disconnect()
            } else {
                node.disconnect()
            }
        }
    }
}
