import * as controls from './index.js'

/**
 * Request and render template files from the server.
 * @param {String} path of the template file to render
 * @param {Object} locals values to render into the template
 * @returns {String}
 */
export async function render(path, locals = {}) {
    if (!path.endsWith('.ejs')) path = `${path}.ejs`
    const resp = await fetch(`/views/${path}`)
    const text = await resp.text()
    if (resp.status !== 200) throw new Error(text)
    const renderer = ejs.compile(text, { client: true, async: true })
    const html = await renderer(locals, null, render)
    return html
}

/**
 * Construct a new instance of a control class.
 * Requests the html from the server, renders it and
 * makes a new wrapper instance with the resulting html element
 * attached.
 * @param {String} source of the class to construct
 * @param {Object} options to apply to the new instance
 * @returns {controls.Control}
 */
export async function construct(source, options = {}) {
    // assign defaults
    options = Object.assign({}, { events: true }, options)
    // construct new instance
    let constructor = null
    let result = null
    if (typeof source === 'string') {
        let identifier = source
        if (identifier.includes('/')) identifier = source.split('/').slice(-1)[0]
        constructor = controls[identifier]
        if (!constructor) constructor = controls.Control
        const html = await render(`${source}`, options)
        result = new constructor(html, options)
    } else {
        result = new controls.Control(source, options)
    }
    // add events
    if (options.events) {
        if (Array.isArray(options.events)) {
            controls.addEvents(result, options.events)
        } else {
            controls.addEvents(result)
        }
    }
    return result
}
