import { Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as nodes from '../nodes/nodes.js'

const timerDebugTemplate = '<div class="w3-text-white">fps: <%= rate.toFixed(2) %></div>'

const defaultColors = (function () {
    const startColor = new Color('#200020')
    const endColor = new Color('#e2dc18')
    const colorRamp = startColor.steps(endColor, {
        space: 'lch',
        outputSpace: 'srgb',
        maxDeltaE: 3, // max deltaE between consecutive steps (optional)
        steps: 256 // min number of steps
    })
    colorRamp.map(function (color) {
        color.buffer = color
            .toString({
                format: {
                    name: 'b',
                    coords: ['<number>[0, 255]', '<number>[0, 255]', '<number>[0, 255]'],
                    commas: true
                }
            })
            .replace('b(', '')
            .replace(')', '')
            .split(',')
            .map(function (num) {
                return Math.floor(Number(num.trim()))
            })
    })
    return colorRamp
})()

class Spectrum {
    static Animations = {
        up: 'up',
        down: 'down',
        left: 'left',
        right: 'right',
        floating: 'floating',
        rolling: 'rolling'
    }
    constructor(
        source,
        {
            sound,
            width,
            height,
            fftSize = 256,
            smoothingTimeConstant = 0,
            timeframe = 256,
            direction = Spectrum.Animations.right,
            effect = Spectrum.Animations.rolling,
            colors = defaultColors
        } = {}
    ) {
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
        this.analyzer.maxDecibels = 0
        // ui event handling
        nodes.AudioNodes(this)
        nodes.AnalyserNode(this)
        // offsets for the scale canvas
        this.scaleOffsetX = 37
        this.scaleOffsetY = 10
        this.borderBottom = 50
        // animation
        this.direction = direction
        this.effect = effect
        this.timeframe = timeframe
        this.pixels = null
        this.cellsSize = null
        this.chunkDivisor = null
        this.loadBuff = null
        this.buffCnt = null
        this.binModulo = null
        this.stepSize = null
        this.skipFrames = null
        this.frameCount = 0
        this.timer = {
            last: 0,
            rate: 0,
            interval: 1000 / 60
        }
        this.colors = colors
        this.handle = null
        // create offscreen
        const { buffer } = this
        this.screen = new Screen(width, height)
        this.offscreen = new Screen(width, height)
        this.offscreen.width = this.offscreen.width - this.scaleOffsetX
        this.offscreen.height = this.offscreen.height - this.borderBottom
        const { offscreen } = this
        // pixels buffer
        if (direction === Spectrum.Animations.up || direction === Spectrum.Animations.down) {
            this.pixels = offscreen.context.createImageData(offscreen.width, 1)
            this.cellsSize = offscreen.width / buffer.length
            this.stepSize = offscreen.height / this.timeframe
            this.chunkDivisor = offscreen.width
            this.buffCnt = 0
            this.loadBuff = function (cnt) {
                return (cnt += 1)
            }
        } else {
            this.pixels = offscreen.context.createImageData(1, offscreen.height)
            this.cellsSize = offscreen.height / buffer.length
            this.stepSize = offscreen.width / this.timeframe
            this.chunkDivisor = offscreen.height
            this.buffCnt = buffer.length - 1
            this.loadBuff = function (cnt) {
                return (cnt -= 1)
            }
        }
        this.binModulo = Math.round(this.cellsSize)
        this.skipFrames = Math.floor(1 / this.stepSize)
        this.skipFrames = this.skipFrames > 0 ? this.skipFrames : 1
        // load zero color
        const pixels = this.pixels
        const zeroColor = this.colors[0]
        for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
            pixels.data[pCnt] = zeroColor.buffer[0]
            pixels.data[pCnt + 1] = zeroColor.buffer[1]
            pixels.data[pCnt + 2] = zeroColor.buffer[2]
            pixels.data[pCnt + 3] = 0
        }
        // double buffer frames
        this.firstFrame = 0
        this.secondFrame = 1
        this.frames = [new Screen(offscreen.width, offscreen.height), new Screen(offscreen.width, offscreen.height)]
        // create scale canvas
        this.scaleCanvas = this.screen.background
        this.scaleCanvas.width = width
        this.scaleCanvas.height = height
        this.scaleCanvas.style.position = 'absolute'
        this.scaleCanvas.style.zIndex = 1
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: new Array(timeframe).fill(0).reduce(function (accu, curr, index) {
                    accu.push(index + 1)
                    return accu
                }, [])
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: 20,
                        max: sound.context.sampleRate / 2,
                        type: 'linear',
                        grid: {
                            display: true
                        },
                        ticks: {
                            callback: function (value, index, ticks) {
                                return value.toLocaleString('en-US', { notation: 'compact', compactDisplay: 'short' })
                            },
                            crossAlign: 'far'
                        }
                    },
                    x: {
                        min: 1,
                        max: timeframe,
                        grid: {
                            display: true,
                            color: '#272727'
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
        // append screen to container
        const { element } = this
        const screenContainer = element.querySelector('#screen-container')
        screenContainer.append(this.screen.container)
    }
    draw(timestamp) {
        // loop
        const { timer } = this
        const deltaTime = timestamp - timer.last
        timer.rate = 1000 / deltaTime
        if (deltaTime > timer.interval) {
            // update
            timer.last = timestamp
            this.update()
            // animate
            const { firstFrame, secondFrame, skipFrames, frames, timeframe, offscreen, direction, effect, stepSize, pixels } = this
            if (this.frameCount % skipFrames === 0) {
                const delta = Math.floor(this.frameCount * stepSize)
                const frame = frames[secondFrame]
                offscreen.clear()
                switch (direction) {
                    case Spectrum.Animations.up:
                        if (effect === Spectrum.Animations.floating) {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, 0, offscreen.height - step - delta)
                            }
                            offscreen.context.drawImage(frame.canvas, 0, 0)
                        } else {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, 0, step + delta)
                            }
                            offscreen.context.drawImage(frames[firstFrame].canvas, 0, -delta)
                            offscreen.context.drawImage(frames[secondFrame].canvas, 0, offscreen.height - delta)
                        }
                        break
                    case Spectrum.Animations.down:
                        if (effect === Spectrum.Animations.floating) {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, 0, step + delta)
                            }
                            offscreen.context.drawImage(frame.canvas, 0, 0)
                        } else {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, 0, offscreen.height - step - delta)
                            }
                            offscreen.context.drawImage(frames[firstFrame].canvas, 0, delta)
                            offscreen.context.drawImage(frames[secondFrame].canvas, 0, -offscreen.height + delta)
                        }
                        break
                    case Spectrum.Animations.right:
                        if (effect === Spectrum.Animations.floating) {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, step + delta, 0)
                            }
                            offscreen.context.drawImage(frame.canvas, 0, 0)
                        } else {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, offscreen.width - step - delta, 0)
                            }
                            offscreen.context.drawImage(frames[firstFrame].canvas, delta, 0)
                            offscreen.context.drawImage(frames[secondFrame].canvas, -offscreen.width + delta, 0)
                        }
                        break
                    case Spectrum.Animations.left:
                        if (effect === Spectrum.Animations.floating) {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, offscreen.width - step - delta, 0)
                            }
                            offscreen.context.drawImage(frame.canvas, 0, 0)
                        } else {
                            for (let step = 0; step < stepSize; step++) {
                                frame.context.putImageData(pixels, step + delta, 0)
                            }
                            offscreen.context.drawImage(frames[firstFrame].canvas, -delta, 0)
                            offscreen.context.drawImage(frames[secondFrame].canvas, offscreen.width - delta, 0)
                        }
                        break
                }
            }
            // draw frames
            const { scaleOffsetX, scaleOffsetY, screen } = this
            screen.clear()
            screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
            screen.debug(ejs.render(timerDebugTemplate, timer))
            // update frame order
            this.frameCount++
            if (this.frameCount > timeframe + 1) {
                this.frameCount = 0
                if (effect === Spectrum.Animations.rolling) {
                    this.firstFrame = secondFrame
                    this.secondFrame = firstFrame
                }
            }
        }
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { analyzer, buffer, cellsSize, chunkDivisor, direction, loadBuff, binModulo, colors, pixels } = this
        // update buffer
        analyzer.getByteFrequencyData(buffer)
        // update pixels
        if (cellsSize < 1) {
            // buffer is larger than screen height or width
            // calculate an average for frequency bins
            const chunkSize = buffer.length / chunkDivisor
            const average = []
            for (let index = 0; index < buffer.length; index += chunkSize) {
                const chunk = buffer.slice(index, index + chunkSize)
                const chunkAvrg = chunk.reduce((sum, num) => sum + num, 0) / chunk.length
                average.push(Math.round(chunkAvrg))
            }
            this.buffCnt = direction === Spectrum.Animations.up || direction === Spectrum.Animations.down ? 0 : average.length - 1
            for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
                this.buffCnt = loadBuff(this.buffCnt)
                if (this.buffCnt > average.length - 1 || this.buffCnt < 0) continue
                const value = average[this.buffCnt]
                const color = colors[value]
                pixels.data[pCnt] = color.buffer[0]
                pixels.data[pCnt + 1] = color.buffer[1]
                pixels.data[pCnt + 2] = color.buffer[2]
                pixels.data[pCnt + 3] = 255
            }
        } else {
            this.buffCnt = direction === Spectrum.Animations.up || direction === Spectrum.Animations.down ? 0 : buffer.length - 1
            // buffer as equal length or is shorter than screen height or width
            for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
                if (pCnt % (binModulo * 4) === 0) this.buffCnt = loadBuff(this.buffCnt)
                if (this.buffCnt > buffer.length - 1 || this.buffCnt < 0) continue
                const value = buffer[this.buffCnt]
                const color = colors[value]
                pixels.data[pCnt] = color.buffer[0]
                pixels.data[pCnt + 1] = color.buffer[1]
                pixels.data[pCnt + 2] = color.buffer[2]
                pixels.data[pCnt + 3] = 255
            }
        }
    }
}

export { Spectrum }
