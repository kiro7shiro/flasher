/**
 * Add basic event handling scheme for a control.
 * If the wrapped HTMLElement has a "data-action" attribute.
 * A custom event is fired with the action as the name.
 * Additionally a "data-detail" attribute can be provided which will be
 * added to the event detail.
 * @param {Control} control to add the events to
 * @param {Array} eventNames on which the element should fire custom events
 */
function addEvents(control, eventNames = ['click', 'input']) {
    const { element } = control
    for (const eventName of eventNames) {
        element.addEventListener(eventName, function (event) {
            const { target } = event
            if (target.hasAttribute('data-action')) {
                const { action, detail } = target.dataset
                element.dispatchEvent(new CustomEvent(action, { detail }))
            }
        })
    }
}

/**
 * Base class that adds the rendered template into the dom and adds
 * convenience functions to the given element.
 */
class Control {
    /**
     * Construct a new control.
     * @param {HTMLElement|String} source
     */
    constructor(source) {
        if (source === null && source === undefined) throw new Error('Source must be given.')
        if (!(source instanceof HTMLElement) && !(typeof source === 'string'))
            throw new Error('Source element must be of type string or an instance of HTMLElement.')
        if (typeof source === 'string') {
            const container = document.createElement('div')
            container.insertAdjacentHTML('afterbegin', source)
            this.element = container.firstChild
        } else {
            this.element = source
        }
    }
    get visible() {
        return this.element.style.display === 'block'
    }
    on(event, handler) {
        this.element.addEventListener(event, handler)
    }
    off(event, handler) {
        this.element.removeEventListener(event, handler)
    }
    show() {
        this.element.style.display = 'block'
    }
    hide() {
        this.element.style.display = 'none'
    }
}

export { addEvents, Control }
