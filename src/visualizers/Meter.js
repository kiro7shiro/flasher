import { Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as nodes from '../nodes/nodes.js'
import { disconnect } from './index.js'

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

class MeterSplitter extends ChannelSplitterNode {
    constructor(context, options, analyzer0, analyzer1) {
        super(context, options)
        this.analyzer0 = analyzer0
        this.analyzer1 = analyzer1
    }
    get minDecibels() {
        return this.analyzer0.minDecibels
    }
    set minDecibels(value) {
        this.analyzer0.minDecibels = Number(value)
        this.analyzer1.minDecibels = Number(value)
    }
    get maxDecibels() {
        return this.analyzer0.maxDecibels
    }
    set maxDecibels(value) {
        this.analyzer0.maxDecibels = Number(value)
        this.analyzer1.maxDecibels = Number(value)
    }
    get smoothingTimeConstant() {
        return this.analyzer0.smoothingTimeConstant
    }
    set smoothingTimeConstant(value) {
        this.analyzer0.smoothingTimeConstant = Number(value)
        this.analyzer1.smoothingTimeConstant = Number(value)
    }
}

class Meter {
    constructor(source, { sound, width, height, fftSize = 256, smoothingTimeConstant = 0.33, colors = defaultColors } = {}) {
        //
        if (!sound) throw new Error('A sound instance must be given.')
        if (width === null && width === undefined) throw new Error('Width must be given.')
        if (height === null && height === undefined) throw new Error('Height must be given.')
        //
        this.control = new Control(source)
        this.element = this.control.element
        //
        this.sound = sound

        this.analyzer0 = sound.createAnalyzer({ fftSize, smoothingTimeConstant })
        this.analyzer1 = sound.createAnalyzer({ fftSize, smoothingTimeConstant })

        const splitter = new MeterSplitter(sound.context, { numberOfOutputs: 2 }, this.analyzer0, this.analyzer1)

        this.analyzer = splitter

        this.analyzer.connect(this.analyzer0, 0)
        this.analyzer.connect(this.analyzer1, 1)

        this.buffer0 = new Uint8Array(this.analyzer0.frequencyBinCount)
        this.buffer1 = new Uint8Array(this.analyzer1.frequencyBinCount)
        this.audioGraph = []
        this.analyzer0.maxDecibels = -40
        this.analyzer1.maxDecibels = -40
        // ui event handling
        nodes.AudioNodes(this)
        nodes.AnalyserNode(this)
        // offsets for the scale canvas
        this.scaleOffsetX = 30
        this.scaleOffsetY = -5
        this.borderBottom = 50
        // animation
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
        const { offscreen, buffer0: buffer } = this
        this.pixels0 = offscreen.context.createImageData(offscreen.width, offscreen.height / 4)
        this.pixels1 = offscreen.context.createImageData(offscreen.width, offscreen.height / 4)
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
                        title: { display: true, text: ['|'] },
                        min: 0,
                        max: 1,
                        grid: {
                            display: false
                        },
                        ticks: {
                            callback: function (value, index, ticks) {
                                return null
                            }
                        }
                    },
                    x: {
                        title: { display: true, text: 'dB' },
                        min: 0,
                        max: 100,
                        reverse: true,
                        grid: {
                            display: true,
                            color: '#272727'
                        },
                        ticks: {
                            callback: function (value, index, ticks) {
                                return value > 0 ? `-${value}` : value
                            }
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
        const { timer, offscreen, pixels0, pixels1 } = this
        const deltaTime = timestamp - timer.last
        timer.rate = 1000 / deltaTime
        //
        if (deltaTime > timer.interval) {
            // update
            timer.last = timestamp
            this.update()
            //offscreen.clear()
            offscreen.context.putImageData(pixels0, 0, pixels0.height / 2)
            offscreen.context.putImageData(pixels1, 0, offscreen.height / 2 + pixels1.height / 2)
            // draw frame
            const { scaleOffsetX, scaleOffsetY, screen } = this
            screen.clear()
            screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
            screen.debug(ejs.render(timerDebugTemplate, timer))
        }
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { analyzer0, analyzer1, buffer0, buffer1, pixels0, pixels1 } = this
        // update buffer
        //analyzer.getByteTimeDomainData(buffer)
        analyzer0.getByteFrequencyData(buffer0)
        analyzer1.getByteFrequencyData(buffer1)
        // update pixels

        for (let pIndex = 0; pIndex < pixels0.data.length; pIndex += 4) {
            pixels0.data[pIndex + 3] = 0
            pixels1.data[pIndex + 3] = 0
        }

        const amplitude0 = Math.sqrt(
            buffer0.reduce(function (accu, curr) {
                return (accu += curr * curr)
            }, 0) / buffer0.length
        )
        const amplitude1 = Math.sqrt(
            buffer1.reduce(function (accu, curr) {
                return (accu += curr * curr)
            }, 0) / buffer1.length
        )

        const endX0 = Math.round((amplitude0 / 255) * pixels0.width)
        const endX1 = Math.round((amplitude1 / 255) * pixels0.width)
        // const red = y * (width * 4) + x * 4
        for (let y = 0; y < pixels0.height; y++) {
            for (let x = 0; x <= endX0; x++) {
                const pIndex = (y * pixels0.width + x) * 4
                const colorIndex = Math.floor((x / pixels0.width) * (this.colors.length - 1))
                const color = this.colors[colorIndex]
                pixels0.data[pIndex] = color.buffer[0]
                pixels0.data[pIndex + 1] = color.buffer[1]
                pixels0.data[pIndex + 2] = color.buffer[2]
                pixels0.data[pIndex + 3] = 255
            }
        }
        for (let y = 0; y < pixels1.height; y++) {
            for (let x = 0; x <= endX1; x++) {
                const pIndex = (y * pixels1.width + x) * 4
                const colorIndex = Math.floor((x / pixels1.width) * (this.colors.length - 1))
                const color = this.colors[colorIndex]
                pixels1.data[pIndex] = color.buffer[0]
                pixels1.data[pIndex + 1] = color.buffer[1]
                pixels1.data[pIndex + 2] = color.buffer[2]
                pixels1.data[pIndex + 3] = 255
            }
        }
    }
}

export { Meter }
