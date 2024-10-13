import * as nodes from './nodes.js'
import { Equalizer } from './Equalizer.js'
import { DelayAdd } from './DelayAdd.js'

const customNodes = {
    DelayAdd,
    Equalizer
}

export { customNodes }

export function addEvents(node, control) {
    const nodeName = node.constructor.name
    const adder = nodes[nodeName]
    if (!adder) return null
    adder(node, control)
}

export function selectable() {
    const notSelectable = ['AudioNodes', 'AnalyserNode']
    const displayNodes = Object.keys(nodes).filter(function (node) {
        return notSelectable.includes(node) === false
    })
    return displayNodes
}
