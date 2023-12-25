// TODO : add optimisation for drawing the background
// TODO : make background transparent
// TODO : place a second canvas behind this screen
// TODO : draw background once
// TODO : clear only the foreground canvas
class Screen {
    constructor(width, height, left = 0, top = 0) {
        this.canvas = document.createElement('canvas')
        this.canvas.classList.add('screen')
        this.context = this.canvas.getContext('2d')
        this.width = width
        this.height = height
        this.left = left
        this.top = top
        // dragging
        this.isDragging = false
        this.offsetX = 0
        this.offsetY = 0
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this))
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
        const top = this.canvas.style.top
        const stripped = top.slice(0, top.length - 2)
        return parseInt(stripped)
    }
    set top(value) {
        if (typeof value !== 'string' || !value.endsWith('px')) value = value + 'px'
        this.canvas.style.top = value
    }
    get left() {
        const left = this.canvas.style.left
        const stripped = left.slice(0, left.length - 2)
        return parseInt(stripped)
    }
    set left(value) {
        if (typeof value !== 'string' || !value.endsWith('px')) value = value + 'px'
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
    onMouseDown(event) {
        this.isDragging = true
        this.offsetX = event.clientX - parseInt(this.left)
        this.offsetY = event.clientY - parseInt(this.top)
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    }
    onMouseLeave() {
        if (this.isDragging) this.isDragging = false
    }
    onMouseMove(event) {
        if (this.isDragging) {
            this.left = event.clientX - this.offsetX
            this.top = event.clientY - this.offsetY
        }
    }
    onMouseUp() {
        this.isDragging = false
        this.canvas.removeEventListener('mousemove', this.onMouseMove)
        this.canvas.removeEventListener('mouseup', this.onMouseUp)
    }
}

export { Screen }
