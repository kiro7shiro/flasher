import { Control } from '/src/Control.js'

export class VisualizersMenu {
    static async build({
        template = '/views/VisualizersMenu.ejs',
        data = { visualizers: [], nodes: [] },
        container = '#visualizers-menu',
        events = ['click']
    } = {}) {
        const control = await Control.build(template, data, container, events)
        return new VisualizersMenu(control)
    }
    static buildSync({
        template = '/views/VisualizersMenu.ejs',
        data = { visualizers: [], nodes: [] },
        container = '#visualizers-menu',
        events = ['click']
    } = {}) {
        const control = Control.buildSync(template, data, container, events)
        return new VisualizersMenu(control)
    }
    constructor(control) {
        this.control = control
        this.container = control.container
        /* const self = this
        this.control.on('addVisualizer', function (event) {
            self.control.dispatchEvent(new CustomEvent('addVisualizer', { detail: event.target }))
        })
        this.control.on('addNode', function (event) {
            self.control.dispatchEvent(new CustomEvent('addVisualizer', { detail: event.target }))
        }) */
    }
    on(event, handler) {
        this.control.on(event, handler)
    }
    off(event, handler) {
        this.control.off(event, handler)
    }
}
