/**
 * The Screen class provides convenience functions for a canvas element
 */
export class Screen {
    constructor(width = 512, height = 256, { left = 0, top = 0, offscreen = false } = {}) {
        this.offscreen = offscreen
        if (!this.offscreen) {
            // container
            this.container = document.createElement('div')
            this.container.style.position = 'relative'
            // canvas and background
            this.canvas = document.createElement('canvas')
            this.background = document.createElement('canvas')
            this.canvas.style.position = 'absolute'
            this.canvas.style.zIndex = 2
            this.canvas.style.zIndex = 2
            this.background.style.position = 'absolute'
            this.background.style.zIndex = 1
            // debugging window
            this.debugWindow = document.createElement('div')
            this.debugWindow.style.position = 'absolute'
            this.debugWindow.style.zIndex = 3
            this.debugWindow.style.display = 'none'
            this.debugWindow.style.width = `${width / 4}px`
            this.debugWindow.style.left = `${width - width / 4}px`
            this.debugWindow.style.backgroundColor = '#272727'
            // background context
            this.backgroundContext = this.background.getContext('2d')
            // append elements to container
            this.container.append(this.debugWindow, this.canvas, this.background)
        } else {
            this.container = null
            this.canvas = new OffscreenCanvas(width, height)
            this.background = null
        }
        // context
        this.context = this.canvas.getContext('2d')
        this.clearImg = this.context.createImageData(width, height)
        // size and position
        this.width = width
        this.height = height
        this.left = left
        this.top = top
    }
    get width() {
        return this.canvas.width
    }
    set width(value) {
        this.canvas.width = value
        if (!this.offscreen) {
            this.container.style.width = value + 'px'
            this.background.width = value
        }
    }
    get height() {
        return this.canvas.height
    }
    set height(value) {
        this.canvas.height = value
        if (!this.offscreen) {
            this.container.style.height = value + 'px'
            this.background.height = value
        }
    }
    get top() {
        if (this.offscreen) return null
        const top = this.container.style.top
        const stripped = top.slice(0, top.length - 2)
        return parseInt(stripped)
    }
    set top(value) {
        if (this.offscreen) return
        if (typeof value !== 'string' || !value.endsWith('px')) value = value + 'px'
        this.container.style.top = value
    }
    get left() {
        if (this.offscreen) return null
        const left = this.container.style.left
        const stripped = left.slice(0, left.length - 2)
        return parseInt(stripped)
    }
    set left(value) {
        if (this.offscreen) return
        if (typeof value !== 'string' || !value.endsWith('px')) value = value + 'px'
        this.container.style.left = value
    }
    /**
     * Clear the canvas.
     * This does not affect the background canvas.
     */
    clear() {
        const { context, clearImg } = this
        context.putImageData(clearImg, 0, 0)
    }
    /**
     * Shows a debugging window with the given html content.
     * @param {string} html - The html content to be displayed in the debugging window.
     */
    debug(html) {
        const { debugWindow } = this
        debugWindow.innerHTML = html
        if (debugWindow.style.display === 'none') debugWindow.style.display = 'block'
    }
    /**
     * Draws a background with the given color onto the background canvas.
     * @param {string} color - The color to fill the background with.
     */
    drawBackground(color) {
        const { backgroundContext, width, height } = this
        backgroundContext.fillStyle = color
        backgroundContext.fillRect(0, 0, width, height)
    }
}
