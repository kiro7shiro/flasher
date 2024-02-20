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
    clear() {
        this.element.textContent = ''
    }
    showControls(controls) {
        this.element.textContent = ''
        this.element.insertAdjacentElement('beforeend', controls)   
    }
}

class Workspace {
    constructor(element) {
        this.element = element
        this.menu = new WorkspaceMenu(element.querySelector('#workspaceMenu'))
        this.controlsList = new WorkspaceControlsList(element.querySelector('#controlsList'))
        this.visualizersContainer = element.querySelector('#workspace')
        this.visualizers = []
        this.visualizersNextId = 0
        //
        this.selectedVisualizer = null
        // redirect subclass events
        const self = this
        self.visualizersContainer.addEventListener('click', function (event) {
            event.preventDefault()
            const { target } = event
            const screen = target.closest('.screen')
            self.element.dispatchEvent(new CustomEvent('select-visualizer', { detail: screen.id }))
        })
        self.menu.on('add-visualizer', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
        self.menu.on('del-visualizer', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
        self.menu.on('add-node', function (event) {
            self.element.dispatchEvent(new CustomEvent(event.type, { detail: event.detail }))
        })
        self.menu.on('del-node', function (event) {
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
        this.visualizersContainer.insertAdjacentElement('beforeend', visualizer.screen.container)
        this.visualizers[this.visualizersNextId] = visualizer
        visualizer.screen.container.setAttribute('id', this.visualizersNextId)
        this.visualizersNextId++
    }
    delVisualizer(visualizer) {
        visualizer.stop()
        this.visualizersContainer.removeChild(visualizer.screen.container)
    }
    selectVisualizer(identifier) {
        const selectedVisualizer = this.visualizers[this.selectedVisualizer]
        if (selectedVisualizer) selectedVisualizer.screen.container.classList.remove('selectedVisualizer')
        this.visualizers[identifier].screen.container.classList.add('selectedVisualizer')
        this.selectedVisualizer = identifier
    }
    showControls(identifier) {
        const { controlsList, visualizers } = this
        controlsList.showControls(visualizers[identifier].controls)
    }
    clearControls() {
        const { controlsList } = this
        controlsList.clear()
    }
}

export { Workspace }
