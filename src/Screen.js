// TODO : add optimisation for drawing the background
// TODO : make background transparent
// TODO : place a second canvas behind this screen
// TODO : draw background once
// TODO : clear only the foreground canvas
class Screen {
    constructor(width, height) {
        this.canvas = document.createElement('canvas')
        const { canvas } = this
        canvas.width = width
        canvas.height = height
        this.context = canvas.getContext('2d')
    }
    get width() {
        return this.canvas.width
    }
    set width(value) {
        this.canvas.width = value
    }
    get height() {
        return this.canvas.height
    }
    set height(value) {
        this.canvas.height = value
    }
    get top() {
        return this.canvas.style.top
    }
    set top(value) {
        this.canvas.style.top = value
    }
    get left() {
        return this.canvas.style.left
    }
    set left(value) {
        this.canvas.style.left = value
    }
    clear() {
        const { context, width, height } = this
        context.clearRect(0, 0, width, height)
    }
    debug(text, { font = '20px Arial', style = 'rgb(0,0,255)', pos = { x: 5, y: 25 } } = {}) {
        const { context } = this
        context.font = font
        context.fillStyle = style
        context.fillText(text, pos.x, pos.y)
    }
    drawBackground(color) {
        const { context, width, height } = this
        context.fillStyle = color
        context.fillRect(0, 0, width, height)
    }
}

export { Screen }
