import { addEvents, Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as visualizers from './index.js'
import * as nodes from '../nodes/nodes.js'

const timerDebugTemplate = '<div>fps: <%= frames %></div><div>delta: <%= delta.toFixed(2) %></div>'

class BeatDetector {
    constructor(source, { sound, width, height, fftSize = 256, smoothingTimeConstant = 0.5, timeframe = 256 } = {}) {
        //
        if (!sound) throw new Error('A sound instance must be given.')
        if (width === null && width === undefined) throw new Error('Width must be given.')
        if (height === null && height === undefined) throw new Error('Height must be given.')
        //
        this.control = new Control(source)
        this.element = this.control.element
        //
        this.analyzer = sound.createAnalyzer({ fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyzer.frequencyBinCount)
        this.audioGraph = []
        this.analyzer.minDecibels = -64
        this.analyzer.maxDecibels = -20
        this.analyzer.smoothingTimeConstant = 0
        //
        nodes.AudioNodes(this)
        nodes.AnalyserNode(this)
        // preset low filter
        const lowBand = this.analyzer.context.sampleRate / this.analyzer.frequencyBinCount / 2
        const lowFilter = visualizers.addNode(this, 'BiquadFilterNode', { type: 'bandpass', frequency: lowBand, Q: 1 })
        const lowControl = new Control(this.element.querySelector('.audio-graph [id="1"]'))
        addEvents(lowControl)
        nodes.BiquadFilterNode(lowFilter, lowControl)
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
        this.scaleCanvas = this.screen.background
        this.scaleCanvas.width = width
        this.scaleCanvas.height = height
        this.scaleCanvas.style.position = 'absolute'
        this.scaleCanvas.style.zIndex = 1
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
        const { element } = this
        const screenContainer = element.querySelector('#screen-container')
        screenContainer.append(this.screen.container)
        //
        this.beatDot = element.querySelector('#beat')
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
        // draw one row of pixels onto the second frame
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
        offscreen.clear()
        offscreen.context.drawImage(frames[firstFrame].canvas, 0, -y)
        offscreen.context.drawImage(frames[secondFrame].canvas, 0, offscreen.height - y)
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
        //
        this.beatDot.style.background = `#272727`
        const cBeat = Math.round(256 / this.beat)
        this.beatDot.style.background = `#${cBeat.toString(16).repeat(3)}`
        // loop
        this.handle = requestAnimationFrame(this.draw.bind(this))
        if (timestamp > timer.last + 1000) {
            timer.last = performance.now()
            timer.fps = timer.frames
            timer.frames = 0
        }
        timer.frames++
        this.lastDraw = performance.now()
        return this.handle
    }
    update() {
        const { analyzer: analyser, buffer, cellsWidth, offscreen, pixels } = this
        analyser.getByteFrequencyData(buffer)
        this.beat = buffer.reduce((sum, num) => sum + num, 0) / buffer.length
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
            let bCnt = 0
            for (let x = 0; x < pixels.data.length; x += 4) {
                pixels.data[x + 3] = average[bCnt]
                bCnt++
            }
        } else {
            // buffer has equal length or is shorter than screen width
            average = buffer
            // set pixel buffer
            let bCnt = 0
            for (let x = 0; x < pixels.data.length; x += 4) {
                pixels.data[x + 3] = average[bCnt]
                if (x % (cellsWidth * 4) === 0) bCnt++
            }
        }
    }
}

export { BeatDetector }
