import { Control } from '/src/Control.js'
import { Screen } from './Screen.js'
import { AudioNodes } from '../nodes/nodes.js'

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

export class Meter {
    static defaults = {
        template: '/views/Visualizer.ejs',
        data: { header: 'meter' },
        container: 'div',
        events: ['click'],
        width: 512,
        height: 128,
        fftSize: 256,
        smoothingTimeConstant: 0.33,
        colors: defaultColors
    }
    static async build(sound, options = {}) {
        if (!sound) throw new Error('A sound instance must be given.')
        options = Control.buildOptions(Meter.defaults, options)
        const { template, data, container, events } = options
        const control = await Control.build(template, data, container, events)
        return new Meter(sound, control, options)
    }
    static buildSync(sound, options = {}) {
        if (!sound) throw new Error('A sound instance must be given.')
        options = Control.buildOptions(Meter.defaults, options)
        const { template, data, container, events } = options
        const control = Control.buildSync(template, data, container, events)
        return new Meter(sound, control, options)
    }
    constructor(sound, control, options = {}) {
        // options
        options = Control.buildOptions(Meter.defaults, options)
        const { width, height, colors, fftSize, smoothingTimeConstant } = options
        // controls
        this.control = control
        this.container = control.container
        this.analyzerL = new AnalyserNode(sound.context, { fftSize, smoothingTimeConstant })
        this.analyzerR = new AnalyserNode(sound.context, { fftSize, smoothingTimeConstant })
        this.analyzer = new MeterSplitter(sound.context, { numberOfOutputs: 2 }, this.analyzerL, this.analyzerR)
        this.analyzer.connect(this.analyzerL, 0)
        this.analyzer.connect(this.analyzerR, 1)
        this.bufferL = new Uint8Array(this.analyzerL.frequencyBinCount)
        this.bufferR = new Uint8Array(this.analyzerR.frequencyBinCount)
        this.audioGraph = []
        this.analyzer.minDecibels = -100
        this.analyzer.maxDecibels = -40
        this.analyzer.smoothingTimeConstant = 0.33
        // ui events
        // TODO : make audio nodes a control too
        this.audioNodes = AudioNodes.addScrollEffect(this.container.querySelector('.audio-nodes'))
        this.analyzerControl = AudioNodes.AnalyserNode.buildSync(this.analyzer)
        this.audioNodes.insertAdjacentElement('afterbegin', this.analyzerControl.container)
        // offsets for the scale canvas
        this.scaleOffsetX = 37
        this.scaleOffsetY = 10
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
        const { offscreen, bufferL: buffer } = this
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
        const screenContainer = this.container.querySelector('.screen-container')
        screenContainer.insertAdjacentElement('beforeend', this.screen.container)
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
            //screen.debug(ejs.render(timerDebugTemplate, timer))
        }
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { analyzerL, analyzerR, bufferL, bufferR, pixels0, pixels1 } = this
        // update buffer
        analyzerL.getByteFrequencyData(bufferL)
        analyzerR.getByteFrequencyData(bufferR)
        // update pixels
        for (let pIndex = 0; pIndex < pixels0.data.length; pIndex += 4) {
            pixels0.data[pIndex + 3] = 0
            pixels1.data[pIndex + 3] = 0
        }
        const amplitude0 = Math.sqrt(
            bufferL.reduce(function (accu, curr) {
                return (accu += curr * curr)
            }, 0) / bufferL.length
        )
        const amplitude1 = Math.sqrt(
            bufferR.reduce(function (accu, curr) {
                return (accu += curr * curr)
            }, 0) / bufferR.length
        )
        const endX0 = Math.round((amplitude0 / 255) * pixels0.width)
        const endX1 = Math.round((amplitude1 / 255) * pixels0.width)
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
