import { Control } from './Control.js'

const visualizerMenus = {
    Grid: function (menu) {
        const { element } = menu
        const cols = element.querySelector('#cols')
        const rows = element.querySelector('#rows')
        // set defaults
        cols.value = 8
        element.dataset.cols = cols.value
        rows.value = 4
        element.dataset.rows = rows.value
        cols.addEventListener('change', function (event) {
            element.dataset.cols = event.target.value
        })
        rows.addEventListener('change', function (event) {
            element.dataset.rows = event.target.value
        })
    }
}

class AddVisualizerMenu extends Control {
    constructor(source, options = {}) {
        // assign defaults
        options = Object.assign({}, { visualizer: 'none' }, options)
        // construct menu
        super(source)
        const { element } = this
        const width = element.querySelector('#width')
        const height = element.querySelector('#height')
        const fftSize = element.querySelector('#fftSize')
        // set defaults
        width.value = 512
        element.dataset.width = width.value
        height.value = 256
        element.dataset.height = height.value
        fftSize.value = 512
        element.dataset.fftSize = fftSize.value
        width.addEventListener('change', function (event) {
            element.dataset.width = event.target.value
        })
        height.addEventListener('change', function (event) {
            element.dataset.height = event.target.value
        })
        fftSize.addEventListener('change', function (event) {
            element.dataset.fftSize = event.target.value
        })
        if (options.visualizer !== 'none') {
            const addVisualizerEvents = visualizerMenus[options.visualizer]
            addVisualizerEvents(this)
        }
    }
}

export { AddVisualizerMenu }
