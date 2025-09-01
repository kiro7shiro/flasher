import { Screen } from '../src/visualizers/Screen.js'

const width = 575
const height = 256
const interval = 1000 / 60
const duration = 1000
const fftSize = 64
const scaleX = Math.ceil(width / duration * interval)
const scaleY = height / fftSize

document.getElementById('x').innerText = `X: ${scaleX}`
document.getElementById('y').innerText = `Y: ${scaleY}`

// setup the screen
const screen = new Screen(width, height)
screen.container.style.border = '1px solid black'
document.body.insertAdjacentElement('beforeend', screen.container)

// draw line
const line = new Screen(1, fftSize, { offscreen: true })
line.context.fillStyle = '#ff0000'
line.context.fillRect(0, 0, 1, fftSize)

// scale the line
const scaleFrame = new Screen(Math.max(scaleX, 1), screen.height)
scaleFrame.context.scale(scaleX, scaleY)
scaleFrame.context.drawImage(line.canvas, 0, 0)

// animate
let delta = 0
let startTime = null
let lastFrameTime = 0
// Function to generate a rainbow color based on a value between 0 and 1
function rainbowColor(value) {
    const hue = value * 360
    return `hsl(${hue}, 100%, 50%)`
}
function draw(timestamp) {
    if (startTime === undefined || startTime === null) {
        startTime = timestamp
    }
    // Calculate the time elapsed since the last frame
    const deltaTime = timestamp - lastFrameTime
    lastFrameTime = timestamp
    // Calculate the x position based on the current time and duration
    delta = ((timestamp - startTime) / duration) * width
    // Check if x has reached the end of the screen
    if (delta >= width) {
        delta = 0 // Reset x to 0
        startTime = timestamp // Reset the start time
        // Clear the canvas
        screen.clear()
    }
    // Calculate a value between 0 and 1 to use for the rainbow color
    const colorValue = (timestamp - startTime) / duration
    line.context.fillStyle = rainbowColor(colorValue)
    line.context.fillRect(0, 0, 1, fftSize)
    scaleFrame.context.drawImage(line.canvas, 0, 0)
    // Draw a vertical line at the current x position
    screen.context.drawImage(scaleFrame.canvas, delta, 0)
    /* if (scaleX > 1) {
        screen.context.drawImage(scaleFrame.canvas, x + scaleX / 4, 0)
    } */
    // Repeat the drawing process, but only if the time elapsed since the last frame is greater than or equal to 16.67ms (which is equivalent to 60 FPS)
    if (deltaTime >= interval) {
        requestAnimationFrame(draw)
    } else {
        setTimeout(() => requestAnimationFrame(draw), interval - deltaTime)
    }
}

draw(performance.now())
