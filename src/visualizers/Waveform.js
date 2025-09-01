//import { Control } from '../Control.js'
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

class Waveform {
    static Animations = {
        horizontal: 'horizontal',
        vertical: 'vertical'
    }
    constructor(
        source,
        { sound, width, height, fftSize = 256, smoothingTimeConstant = 0, direction = Waveform.Animations.horizontal, colors = defaultColors } = {}
    ) {
        //
        if (!sound) throw new Error('A sound instance must be given.')
        if (width === null && width === undefined) throw new Error('Width must be given.')
        if (height === null && height === undefined) throw new Error('Height must be given.')
        //
        this.control = new Control(source)
        this.element = this.control.element
        //
        this.sound = sound
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
        this.colors = colors
        this.timer = {
            last: 0,
            rate: 0,
            interval: 1000 / 60
        }
        this.handle = null
        // create offscreen
        this.screen = new Screen(width, height)
        this.offscreen = new Screen(width, height)
        this.offscreen.width = this.offscreen.width - this.scaleOffsetX
        this.offscreen.height = this.offscreen.height - this.borderBottom
        // create pixel buffer
        const { offscreen, buffer } = this
        this.stepSize = null
        this.pixels = null
        if (direction === Waveform.Animations.horizontal) {
            this.stepSize = offscreen.width / buffer.length
            this.chunkDivisor = offscreen.width
        } else {
            this.stepSize = offscreen.height / buffer.length
            this.chunkDivisor = offscreen.height
        }
        this.binModulo = Math.round(this.stepSize)
        this.pixels = offscreen.context.createImageData(offscreen.width, offscreen.height)
        // load zero color
        const pixels = this.pixels
        const zeroColor = this.colors[0]
        for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
            pixels.data[pCnt] = zeroColor.buffer[0]
            pixels.data[pCnt + 1] = zeroColor.buffer[1]
            pixels.data[pCnt + 2] = zeroColor.buffer[2]
            pixels.data[pCnt + 3] = 0
        }
        // create scale canvas
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
                        min: -1,
                        max: 1,
                        reverse: false,
                        grid: {
                            display: true,
                            color: '#272727'
                        }
                    },
                    x: {
                        min: 0,
                        max: (fftSize / sound.context.sampleRate) * 1000,
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
        // append screen to container
        const { element } = this
        const screenContainer = element.querySelector('#screen-container')
        screenContainer.append(this.screen.container)
    }
    draw(timestamp) {
        //
        const { timer, offscreen, pixels } = this
        const deltaTime = timestamp - timer.last
        timer.rate = 1000 / deltaTime
        //
        if (deltaTime > timer.interval) {
            // update
            timer.last = timestamp
            this.update()
            //offscreen.clear()
            offscreen.context.putImageData(pixels, 0, 0)
            // draw frame
            const { scaleOffsetX, scaleOffsetY, screen } = this
            screen.clear()
            screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
            screen.debug(ejs.render(timerDebugTemplate, timer))
        }
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { analyzer, buffer, pixels, stepSize, chunkDivisor, colors } = this
        // update buffer
        analyzer.getByteTimeDomainData(buffer)
        // update pixels
        // const red = y * (width * 4) + x * 4
        const lowColor = colors[0]
        const highColor = colors[colors.length - 1]
        for (let pIndex = 0; pIndex < pixels.data.length; pIndex += 4) {
            pixels.data[pIndex] = lowColor.buffer[0]
            pixels.data[pIndex + 1] = lowColor.buffer[1]
            pixels.data[pIndex + 2] = lowColor.buffer[2]
            pixels.data[pIndex + 3] = 127
        }

        if (stepSize < 1) {
            // buffer is larger than screen height or width
            // calculate an average for frequency bins
            const chunkSize = buffer.length / chunkDivisor
            const average = []
            for (let index = 0; index < buffer.length; index += chunkSize) {
                const chunk = buffer.slice(index, index + chunkSize)
                const chunkAvrg = chunk.reduce((sum, num) => sum + num, 0) / chunk.length
                average.push(Math.round(chunkAvrg))
            }
            let buffCnt = 0
            for (let x = 0; x < pixels.width; x++) {
                const value = average[buffCnt] / 255
                buffCnt++
                const y = Math.floor(value * pixels.height)
                const pIndex = Math.floor(y * (pixels.width * 4) + x * 4)
                pixels.data[pIndex] = highColor.buffer[0]
                pixels.data[pIndex + 1] = highColor.buffer[1]
                pixels.data[pIndex + 2] = highColor.buffer[2]
                pixels.data[pIndex + 3] = 255
            }
        } else {
            // buffer as equal length or is shorter than screen height or width
            let buffCnt = 0
            for (let x = 0; x < pixels.width; x++) {
                if (x % this.binModulo === 0) buffCnt++
                const value = buffer[buffCnt] / 255
                const y = Math.floor(value * pixels.height + 6)
                const pIndex = Math.floor(y * (pixels.width * 4) + x * 4)
                pixels.data[pIndex] = highColor.buffer[0]
                pixels.data[pIndex + 1] = highColor.buffer[1]
                pixels.data[pIndex + 2] = highColor.buffer[2]
                pixels.data[pIndex + 3] = 255
            }
        }
    }
}

export { Waveform }
