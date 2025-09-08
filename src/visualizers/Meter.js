import { Control } from '/src/Control.js'
import { Screen } from './Screen.js'
import { AudioNodes } from '../nodes/nodes.js'

const timerDebugTemplate = '<div class="w3-text-white">fps: <%= rate.toFixed(2) %></div>'

const defaultColors = (function () {
    const startColor = new Color('#890189ff')
    const endColor = new Color('#e2dc18')
    const colorRamp = startColor.steps(endColor, {
        space: 'srgb',
        outputSpace: 'srgb',
        maxDeltaE: 1, // max deltaE between consecutive steps (optional)
        steps: 1, // min number of steps
        maxSteps: 128
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
    static Animations = {
        Up: 'Up',
        Down: 'Down',
        Left: 'Left',
        Right: 'Right'
    }
    static defaults = {
        template: '/views/Visualizer.ejs',
        data: { header: 'meter' },
        container: 'div',
        events: ['click'],
        width: 512,
        height: 128,
        fftSize: 256,
        minDecibels: -100,
        maxDecibels: -60,
        smoothingTimeConstant: 0.33,
        direction: Meter.Animations.Right,
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
        const { direction, width, height, colors, fftSize, maxDecibels, minDecibels, smoothingTimeConstant } = options
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
        this.analyzer.minDecibels = minDecibels
        this.analyzer.maxDecibels = maxDecibels
        this.analyzer.smoothingTimeConstant = smoothingTimeConstant
        // ui events
        // TODO : make audio nodes a control too
        this.audioNodes = AudioNodes.addScrollEffect(this.container.querySelector('.audio-nodes'))
        this.analyzerControl = AudioNodes.AnalyserNode.buildSync(this.analyzer)
        this.audioNodes.insertAdjacentElement('afterbegin', this.analyzerControl.container)
        // animation
        this.direction = direction
        this.colors = colors
        this.timer = {
            delta: 0,
            last: 0,
            start: null,
            rate: 0,
            interval: 1000 / 60
        }
        this.animator = {
            sx: 0,
            sy: 0,
            sWidth: 0,
            sHeight: 0,
            dx: 0,
            dy: 0,
            dWidth: 0,
            dHeight: 0,
            barWidth: 0,
            barHeightL: 0,
            barHeightR: 0,
            barGap: 0
        }
        this.handle = null
        // create screen and bar
        this.screen = new Screen(width, height)
        if (direction === Meter.Animations.Up) {
            // create a bar from bottom up
            this.animator.barWidth = Math.ceil(width / 5)
            this.animator.barGap = this.animator.barWidth
            this.offscreen = new Screen(this.animator.barWidth, height, { offscreen: true })
            this.gradient = this.offscreen.context.createLinearGradient(this.animator.barWidth / 2, height, this.animator.barWidth / 2, 0)
            this.gradient.addColorStop(0, colors[0])
            this.gradient.addColorStop(1, colors[colors.length - 1])
            this.offscreen.context.fillStyle = this.gradient
            this.offscreen.context.fillRect(0, 0, this.animator.barWidth, height)
        } else if (direction === Meter.Animations.Down) {
            // create a bar from top to bottom
            this.animator.barWidth = Math.ceil(width / 5)
            this.animator.barGap = this.animator.barWidth
            this.offscreen = new Screen(this.animator.barWidth, height, { offscreen: true })
            this.gradient = this.offscreen.context.createLinearGradient(this.animator.barWidth / 2, 0, this.animator.barWidth / 2, height)
            this.gradient.addColorStop(0, colors[0])
            this.gradient.addColorStop(1, colors[colors.length - 1])
            this.offscreen.context.fillStyle = this.gradient
            this.offscreen.context.fillRect(0, 0, this.animator.barWidth, height)
        } else if (direction === Meter.Animations.Left) {
            // create the bar from right to left
            this.animator.barWidth = Math.ceil(height / 5)
            this.animator.barGap = this.animator.barWidth
            this.offscreen = new Screen(width, this.animator.barWidth, { offscreen: true })
            this.gradient = this.offscreen.context.createLinearGradient(width, this.animator.barWidth / 2, 0, this.animator.barWidth / 2)
            this.gradient.addColorStop(0, colors[0])
            this.gradient.addColorStop(1, colors[colors.length - 1])
            this.offscreen.context.fillStyle = this.gradient
            this.offscreen.context.fillRect(0, 0, width, this.animator.barWidth)
        } else if (direction === Meter.Animations.Right) {
            // create the bar from left to right
            this.animator.barWidth = Math.ceil(height / 5)
            this.animator.barGap = this.animator.barWidth
            this.offscreen = new Screen(width, this.animator.barWidth, { offscreen: true })
            this.gradient = this.offscreen.context.createLinearGradient(0, this.animator.barWidth / 2, width, this.animator.barWidth / 2)
            this.gradient.addColorStop(0, colors[0])
            this.gradient.addColorStop(1, colors[colors.length - 1])
            this.offscreen.context.fillStyle = this.gradient
            this.offscreen.context.fillRect(0, 0, width, this.animator.barWidth)
        }
        // setup the background
        this.screen.canvas.style.left = '22px'
        this.scaleCanvas = this.screen.background
        this.scaleCanvas.width = width
        this.scaleCanvas.height = height + this.animator.barWidth * 2
        this.scaleCanvas.style.zIndex = 3
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: new Array(100).fill(0).map((_, i) => i + 1),
                datasets: [
                    {
                        axis: 'y',
                        data: []
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                animation: false,
                scales: {
                    y: {
                        title: {
                            display: false,
                            text: [['R\t\t|\t\tL']]
                        },
                        type: 'linear',
                        min: 0,
                        max: 1,
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: true,
                            callback: function name(value, index, ticks) {
                                if (value === 0.2) return 'R'
                                if (value === 0.8) return 'L'
                                return ''
                            }
                        }
                    },
                    x: {
                        title: { display: true, text: 'dB' },
                        min: 0,
                        max: 100,
                        type: 'linear',
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
        screenContainer.insertAdjacentElement('afterbegin', this.screen.container)
    }
    draw(timestamp) {
        // timing
        const { direction, screen, offscreen, timer } = this
        if (timer.start === null) timer.start = 0
        timer.delta = timestamp - timer.last
        timer.last = timestamp
        timer.rate = 1000 / timer.delta
        // update
        this.update()
        // draw bars
        screen.clear()
        if (direction === Meter.Animations.Up) {
            const { barHeightL, barHeightR, barGap, sx, dx } = this.animator
            // draw left channel
            screen.context.drawImage(
                offscreen.canvas,
                sx,
                offscreen.height - barHeightL,
                offscreen.width,
                offscreen.height,
                dx + barGap,
                offscreen.height - barHeightL,
                offscreen.width,
                offscreen.height
            )
            // draw right channel
            screen.context.drawImage(
                offscreen.canvas,
                sx,
                offscreen.height - barHeightR,
                offscreen.width,
                offscreen.height,
                dx + 3 * barGap,
                offscreen.height - barHeightR,
                offscreen.width,
                offscreen.height
            )
        } else if (direction === Meter.Animations.Down) {
            const { barHeightL, barHeightR, barGap, sx, sy, dx, dy } = this.animator
            // draw left channel
            screen.context.drawImage(offscreen.canvas, sx, sy, offscreen.width, barHeightL, dx + barGap, dy, offscreen.width, barHeightL)
            // draw right channel
            screen.context.drawImage(offscreen.canvas, sx, sy, offscreen.width, barHeightR, dx + 3 * barGap, dy, offscreen.width, barHeightR)
        } else if (direction === Meter.Animations.Left) {
            const { barHeightL, barHeightR, barWidth, barGap, sy, dy } = this.animator
            // draw left channel
            screen.context.drawImage(
                offscreen.canvas,
                offscreen.width - barHeightL,
                sy,
                offscreen.width,
                barWidth,
                offscreen.width - barHeightL,
                dy + barGap,
                offscreen.width,
                barWidth
            )
            // draw right channel
            screen.context.drawImage(
                offscreen.canvas,
                offscreen.width - barHeightR,
                sy,
                offscreen.width,
                barWidth,
                offscreen.width - barHeightR,
                dy + 3 * barGap,
                offscreen.width,
                barWidth
            )
        } else if (direction === Meter.Animations.Right) {
            const { barHeightL, barHeightR, barWidth, barGap, sx, sy, dx, dy } = this.animator
            // draw left channel
            screen.context.drawImage(offscreen.canvas, sx, sy, barHeightL, barWidth, dx, dy + barGap, barHeightL, barWidth)
            // draw right channel
            screen.context.drawImage(offscreen.canvas, sx, sy, barHeightR, barWidth, dx, dy + 3 * barGap, barHeightR, barWidth)
        }
        // loop
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { analyzerL, analyzerR, bufferL, bufferR, direction, offscreen } = this
        // update buffer
        analyzerL.getByteFrequencyData(bufferL)
        analyzerR.getByteFrequencyData(bufferR)
        // update amplitudes
        const amplitudeL = Math.sqrt(
            bufferL.reduce(function (accu, curr) {
                return (accu += curr * curr)
            }, 0) / bufferL.length
        )
        const amplitudeR = Math.sqrt(
            bufferR.reduce(function (accu, curr) {
                return (accu += curr * curr)
            }, 0) / bufferR.length
        )
        if (direction === Meter.Animations.Left || direction === Meter.Animations.Right) {
            this.animator.barHeightL = Math.ceil((amplitudeL / 255) * offscreen.width)
            this.animator.barHeightR = Math.ceil((amplitudeR / 255) * offscreen.width)
        } else {
            this.animator.barHeightL = Math.ceil((amplitudeL / 255) * offscreen.height)
            this.animator.barHeightR = Math.ceil((amplitudeR / 255) * offscreen.height)
        }
    }
}
