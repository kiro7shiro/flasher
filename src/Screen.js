class Screen {
    constructor(width, height, left = 0, top = 0) {
        this.container = document.createElement('div')
        this.container.classList.add('screen')

        this.canvas = document.createElement('canvas')
        this.background = document.createElement('canvas')
        this.canvas.style.position = 'absolute'
        this.canvas.style.zIndex = 2
        this.background.style.position = 'absolute'
        this.background.style.zIndex = 1

        this.context = this.canvas.getContext('2d')
        this.backgroundContext = this.background.getContext('2d')

        this.container.append(this.canvas, this.background)

        // size and position
        this.width = width
        this.height = height
        this.left = left
        this.top = top
        // dragging
        this.isDragging = false
        this.offsetX = 0
        this.offsetY = 0
        this.container.addEventListener('mousedown', this.onMouseDown.bind(this))
        this.container.addEventListener('mouseleave', this.onMouseLeave.bind(this))
    }
    get width() {
        return this.canvas.width
    }
    set width(value) {
        this.container.style.width = value + 'px'
        this.canvas.width = value
        this.background.width = value
    }
    get height() {
        return this.canvas.height
    }
    set height(value) {
        this.container.style.height = value + 'px'
        this.canvas.height = value
        this.background.height = value
    }
    get top() {
        const top = this.container.style.top
        const stripped = top.slice(0, top.length - 2)
        return parseInt(stripped)
    }
    set top(value) {
        if (typeof value !== 'string' || !value.endsWith('px')) value = value + 'px'
        this.container.style.top = value
    }
    get left() {
        const left = this.container.style.left
        const stripped = left.slice(0, left.length - 2)
        return parseInt(stripped)
    }
    set left(value) {
        if (typeof value !== 'string' || !value.endsWith('px')) value = value + 'px'
        this.container.style.left = value
    }
    clear() {
        const { context, width, height } = this
        context.clearRect(0, 0, width, height)
    }
    drawBackground(color) {
        const { backgroundContext, width, height } = this
        backgroundContext.fillStyle = color
        backgroundContext.fillRect(0, 0, width, height)
    }
    onMouseDown(event) {
        this.isDragging = true
        this.offsetX = event.clientX - parseInt(this.left)
        this.offsetY = event.clientY - parseInt(this.top)
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this))
        this.container.addEventListener('mouseup', this.onMouseUp.bind(this))
    }
    onMouseLeave() {
        if (this.isDragging) this.isDragging = false
    }
    onMouseMove(event) {
        if (this.isDragging) {
            // Calculate new div position based on mouse position and offset
            let newX = event.clientX - this.offsetX
            let newY = event.clientY - this.offsetYw
            // Get the dimensions of the parent container
            const parentRect = this.container.parentElement.getBoundingClientRect()
            // Perform boundary checks
            newX = Math.max(0, Math.min(parentRect.width - this.container.offsetWidth, newX))
            newY = Math.max(0, Math.min(parentRect.height - this.container.offsetHeight, newY))
            // Update div position
            this.left = newX
            this.top = newY
        }
    }
    onMouseUp() {
        this.isDragging = false
        this.container.removeEventListener('mousemove', this.onMouseMove)
        this.container.removeEventListener('mouseup', this.onMouseUp)
    }
}

export { Screen }
