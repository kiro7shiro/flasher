class WorkspaceMenu {
    constructor(element) {
        this.element = element
        const self = this
        self.element.addEventListener('click', function (event) {
            event.preventDefault()
            const { target } = event
            if (target.hasAttribute('data-action')) {
                const { action, type } = target.dataset
                self.element.dispatchEvent(new CustomEvent(`${action}`, { detail: type }))
            }
        })
    }
    on(event, handler) {
        if (!this.element) return
        this.element.addEventListener(event, handler)
    }
    off(event, handler) {
        if (!this.element) return
        this.element.removeEventListener(event, handler)
    }
}

class WorkspaceControlsList {
    constructor(element) {
        this.element = element
    }
}

class Workspace {
    constructor(element) {
        this.element = element
        this.menu = new WorkspaceMenu(element.querySelector('#workspaceMenu'))
        this.controlsList = new WorkspaceControlsList(element.querySelector('#controlsList'))
        this.visualizers = []
        // redirect subclass events
        const self = this
        this.menu.on('add-visualizer', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
        this.menu.on('del-visualizer', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
        this.menu.on('add-node', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
        this.menu.on('del-node', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
    }
    on(event, handler) {
        if (!this.element) return
        this.element.addEventListener(event, handler)
    }
    off(event, handler) {
        if (!this.element) return
        this.element.removeEventListener(event, handler)
    }
    addVisualizer(visualizer) {
        
    }
}

export { Workspace }
