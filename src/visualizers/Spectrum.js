import { Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as nodes from '../nodes/nodes.js'

const timerDebugTemplate = '<div>fps: <%= fps %></div><div>delta: <%= delta.toFixed(2) %></div>'

class Spectrum {
    constructor(source, { sound, width, height, fftSize = 256, smoothingTimeConstant = 0.5, timeframe = 256 } = {}) {
        //
        if (!sound) throw new Error('A sound instance must be given.')
        if (width === null && width === undefined) throw new Error('Width must be given.')
        if (height === null && height === undefined) throw new Error('Height must be given.')
        //
        this.control = new Control(source)
        this.element = this.control.element
        //
        this.analyser = sound.createAnalyzer({ fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.audioGraph = []
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0
        //
        nodes.AnalyserNode(this)
        //
        this.lastDraw = 0
        this.frameCount = 0
        this.firstFrame = 0
        this.secondFrame = 1
        this.timeframe = timeframe
        // offsets for the scale canvas
        this.scaleOffsetX = 37
        this.scaleOffsetY = 10
        this.borderBottom = 50
        //
        const { buffer } = this
        this.screen = new Screen(width, height)
        this.offscreen = new Screen(width, height)
        this.offscreen.width = this.offscreen.width - this.scaleOffsetX
        this.offscreen.height = this.offscreen.height - this.borderBottom
        this.cellsWidth = Math.round(this.offscreen.width / buffer.length)
        this.cellsHeight = this.offscreen.height / timeframe
        //
        const { offscreen } = this
        this.frame1 = new Screen(offscreen.width, offscreen.height)
        this.frame2 = new Screen(offscreen.width, offscreen.height)
        this.frames = [this.frame1, this.frame2]
        //
        const pixels = (this.pixels = offscreen.context.createImageData(offscreen.width, 1))
        for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
            pixels.data[pCnt] = 255
            pixels.data[pCnt + 1] = 255
            pixels.data[pCnt + 2] = 255
            pixels.data[pCnt + 3] = 0
        }
        //
        this.scaleCanvas = document.createElement('canvas')
        this.scaleCanvas.width = width
        this.scaleCanvas.height = height
        this.scaleCanvas.style.position = 'absolute'
        this.scaleCanvas.style.zIndex = 2
        this.screen.container.append(this.scaleCanvas)
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: buffer.reduce(function (accu, curr, index) {
                    accu.push(index)
                    return accu
                }, [])
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: 1,
                        max: timeframe,
                        reverse: false,
                        grid: {
                            display: true
                        }
                    },
                    x: {
                        min: 1,
                        max: buffer.length,
                        grid: {
                            display: true
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                responsive: false
            }
        })
        //
        const { control, element } = this
        const nodesContainer = element.querySelector('#nodes-container')
        nodesContainer.style.display = 'none'
        control.on('toggle-controls', function () {
            if (nodesContainer.style.display === 'none') {
                nodesContainer.style.display = 'block'
            } else {
                nodesContainer.style.display = 'none'
            }
        })
        //
        const screenContainer = element.querySelector('#screen-container')
        screenContainer.append(this.screen.container)
        //
        this.timer = {
            delta: 0,
            frames: 0,
            fps: 60,
            last: 0
        }
    }
    draw(timestamp) {
        const { timer } = this
        timer.delta = timestamp - this.lastDraw
        // update pixel buffer
        this.update()
        // draw on row of pixels
        const { cellsHeight, firstFrame, secondFrame, frames, pixels, timeframe } = this
        const frame = frames[secondFrame]
        const y = this.frameCount * cellsHeight
        for (let hCnt = 0; hCnt < cellsHeight; hCnt++) {
            frame.context.putImageData(pixels, 0, y + hCnt)
        }
        // update frames
        const { offscreen, scaleOffsetX, scaleOffsetY, screen } = this
        this.frameCount++
        if (this.frameCount > timeframe) {
            this.frameCount = 0
            this.firstFrame = secondFrame
            this.secondFrame = firstFrame
        }
        // draw frames
        const offsetDelta = parseInt(timer.delta / 16.66)
        offscreen.clear()
        offscreen.context.drawImage(frames[firstFrame].canvas, 0, -y - offsetDelta)
        offscreen.context.drawImage(frames[secondFrame].canvas, 0, offscreen.height - y - offsetDelta)
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
        // loop
        this.handle = requestAnimationFrame(this.draw.bind(this))
        if (timestamp > timer.last + 1000) {
            //screen.debug(ejs.render(timerDebugTemplate, timer))
            timer.last = performance.now()
            timer.fps = timer.frames
            timer.frames = 0
        }
        timer.frames++
        this.lastDraw = performance.now()
        return this.handle
    }
    update() {
        const { analyser, buffer, cellsWidth, offscreen, pixels } = this
        analyser.getByteFrequencyData(buffer)
        let average = []
        if (cellsWidth < 1) {
            // buffer is larger than screen width
            // calculate an average for frequency bins
            const chunkSize = buffer.length / offscreen.width
            for (let index = 0; index < buffer.length; index += chunkSize) {
                const chunk = buffer.slice(index, index + chunkSize)
                const chunkAvrg = chunk.reduce((sum, num) => sum + num, 0) / chunk.length
                average.push(chunkAvrg)
            }
        } else {
            // buffer has equal length or is shorter than screen width
            average = buffer
        }
        // set pixel buffer
        let bCnt = 0
        for (let x = 0; x < pixels.data.length; x += 4) {
            pixels.data[x + 3] = average[bCnt]
            if (x % (cellsWidth * bCnt + 1) === 0) bCnt++
        }
    }
}

export { Spectrum }

// TODO : do peak detection elsewhere
/* const peaks = []
const threshold = 64
const range = 64
for (let i = range; i < average.length - range; i++) {
    const curr = average[i]
    const before = average.slice(i - range, i)
    const after = average.slice(i + 1, i + range + 1)
    if (curr > before.every((val) => val < curr) && curr > after.every((val) => val < curr) && curr > threshold) {
        peaks.push(i)
    }
}
console.log(peaks) */
