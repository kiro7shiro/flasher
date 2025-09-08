import { Control } from '/src/Control.js'
import { Screen } from './Screen.js'
import { AudioNodes } from '../nodes/nodes.js'

const timerDebugTemplate = '<div class="w3-text-white">fps: <%= rate.toFixed(2) %></div>\n<div class="w3-text-white">dlt: <%= delta.toFixed(2) %></div>'

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

/**
 * Spectrum is a visualizer that displays a spectrum of sound frequencies
 */
export class Spectrum {
    static Animations = {
        Up: 'Up',
        Down: 'Down',
        Left: 'Left',
        Right: 'Right',
        Floating: 'Floating',
        Rolling: 'Rolling'
    }
    static defaults = {
        template: '/views/Visualizer.ejs',
        data: { header: 'spectrum' },
        container: 'div',
        events: ['click'],
        width: 600,
        height: 256,
        fftSize: 512,
        minDecibels: -100,
        maxDecibels: 0,
        smoothingTimeConstant: 0,
        duration: 5000,
        direction: Spectrum.Animations.Right,
        effect: Spectrum.Animations.Rolling,
        colors: defaultColors
    }
    static async build(sound, options = {}) {
        if (!sound) throw new Error('A sound instance must be given.')
        options = Control.buildOptions(Spectrum.defaults, options)
        const { template, data, container, events } = options
        const control = await Control.build(template, data, container, events)
        return new Spectrum(sound, control, options)
    }
    static buildSync(sound, options = {}) {
        if (!sound) throw new Error('A sound instance must be given.')
        options = Control.buildOptions(Spectrum.defaults, options)
        const { template, data, container, events } = options
        const control = Control.buildSync(template, data, container, events)
        return new Spectrum(sound, control, options)
    }
    constructor(sound, control, options = {}) {
        options = Control.buildOptions(Spectrum.defaults, options)
        const { direction, effect, width, height, colors, minDecibels, maxDecibels, fftSize, smoothingTimeConstant, duration } = options
        this.control = control
        this.container = control.container
        this.analyzer = new AnalyserNode(sound.context, { fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyzer.frequencyBinCount)
        this.audioGraph = []
        this.analyzer.minDecibels = minDecibels
        this.analyzer.maxDecibels = maxDecibels
        // ui events
        // TODO : make audio nodes a control too
        this.audioNodes = this.container.querySelector('.audio-nodes')
        this.analyzerControl = AudioNodes.AnalyserNode.buildSync(this.analyzer)
        this.audioNodes.insertAdjacentElement('afterbegin', this.analyzerControl.container)
        const self = this
        this.control.on('toggle-controls', function () {
            if (!self.audioNodes.style.display || self.audioNodes.style.display === 'none') {
                self.audioNodes.style.display = 'block'
            } else {
                self.audioNodes.style.display = 'none'
            }
        })
        // animation
        this.direction = direction
        this.effect = effect
        this.colors = colors
        this.timer = {
            delta: 0,
            duration: duration,
            last: 0,
            start: null,
            rate: 0,
            interval: 1000 / 60
        }
        this.animator = {
            sx: null,
            sy: null,
            sWidth: null,
            sHeight: null,
            dx: null,
            dy: null,
            dWidth: null,
            dHeight: null,
            lineX: null,
            lineY: null,
            floater: null
        }
        // setup the screen
        this.screen = new Screen(width, height)
        // append screen to container
        const screenContainer = this.container.querySelector('.screen-container')
        screenContainer.insertAdjacentElement('afterbegin', this.screen.container)
        // setup the animation
        if (direction === Spectrum.Animations.Up || direction === Spectrum.Animations.Down) {
            // make a horizontal line across the whole screen
            this.line = new Screen(this.buffer.length, 1, { offscreen: true })
            this.pixels = this.line.context.createImageData(this.line.width, this.line.height)
            // calculate the scaling and make the scale frame
            this.scaleFactors = {
                x: width / this.buffer.length,
                y: Math.ceil((height / this.timer.duration) * this.timer.interval)
            }
            this.scaleFrame = new Screen(width, Math.max(this.scaleFactors.y, 1), { offscreen: true })
            this.scaleFrame.context.scale(this.scaleFactors.x, this.scaleFactors.y)
            // setup the animator
            if (direction === Spectrum.Animations.Up) {
                this.animator.sx = 0
                this.animator.sy = this.scaleFrame.height
                this.animator.sWidth = this.screen.width
                this.animator.sHeight = this.screen.height - this.scaleFrame.height
                this.animator.dx = 0
                this.animator.dy = 0
                this.animator.dWidth = this.screen.width
                this.animator.dHeight = this.animator.sHeight
                this.animator.lineX = 0
                this.animator.lineY = this.screen.height - this.scaleFrame.height
                this.animator.floater = function (timer) {
                    const x = 0 // x is 0 because we only move up
                    let y = Math.floor(self.screen.height - ((timer.last - timer.start) / timer.duration) * self.screen.height)
                    if (y <= 0) {
                        y = self.screen.height
                        timer.start = timer.last
                    }
                    return { x, y }
                }
            } else {
                this.animator.sx = 0
                this.animator.sy = 0
                this.animator.sWidth = this.screen.width
                this.animator.sHeight = this.screen.height - this.scaleFrame.height
                this.animator.dx = 0
                this.animator.dy = this.scaleFrame.height
                this.animator.dWidth = this.screen.width
                this.animator.dHeight = this.animator.sHeight
                this.animator.lineX = 0
                this.animator.lineY = 0
                const self = this
                this.animator.floater = function (timer) {
                    const x = 0 // x is 0 because we only move down
                    let y = Math.floor(((timer.last - timer.start) / timer.duration) * self.screen.height)
                    if (y >= self.screen.height) {
                        y = 0
                        timer.start = timer.last
                    }
                    return { x, y }
                }
            }
        } else {
            // make a vertical line across the whole screen
            this.line = new Screen(1, this.buffer.length, { offscreen: true })
            this.pixels = this.line.context.createImageData(this.line.width, this.line.height)
            // calculate the scaling and make the scale frame
            this.scaleFactors = {
                x: Math.ceil((width / this.timer.duration) * this.timer.interval),
                y: height / this.buffer.length
            }
            this.scaleFrame = new Screen(Math.max(this.scaleFactors.x, 1), height, { offscreen: true })
            this.scaleFrame.context.scale(this.scaleFactors.x, this.scaleFactors.y)
            // setup the animator
            if (direction === Spectrum.Animations.Left) {
                this.animator.sx = this.scaleFrame.width
                this.animator.sy = 0
                this.animator.sWidth = this.screen.width - this.scaleFrame.width
                this.animator.sHeight = this.screen.height
                this.animator.dx = 0
                this.animator.dy = 0
                this.animator.dWidth = this.animator.sWidth
                this.animator.dHeight = this.screen.height
                this.animator.lineX = this.animator.sWidth
                this.animator.lineY = 0
                const self = this
                this.animator.floater = function (timer) {
                    const y = 0 // y is 0 because we only move left
                    let x = Math.floor(self.screen.width - ((timer.last - timer.start) / timer.duration) * self.screen.width)
                    if (x <= 0) {
                        x = self.screen.width
                        timer.start = timer.last
                    }
                    return { x, y }
                }
            } else {
                this.animator.sx = 0
                this.animator.sy = 0
                this.animator.sWidth = this.screen.width - this.scaleFrame.width
                this.animator.sHeight = this.screen.height
                this.animator.dx = this.scaleFrame.width
                this.animator.dy = 0
                this.animator.dWidth = this.animator.sWidth
                this.animator.dHeight = this.screen.height
                this.animator.lineX = 0
                this.animator.lineY = 0
                const self = this
                this.animator.floater = function (timer) {
                    const y = 0 // y is 0 because we only move right
                    let x = Math.floor(((timer.last - timer.start) / timer.duration) * self.screen.width)
                    if (x >= self.screen.width) {
                        x = 0
                        timer.start = timer.last
                    }
                    return { x, y }
                }
            }
        }
        // setup the background
        this.screen.canvas.style.left = '35px'
        this.scaleCanvas = this.screen.background
        this.scaleCanvas.width = width + 35
        this.scaleCanvas.height = height + 28
        this.scaleCanvas.style.zIndex = 3
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: new Array(duration).fill(0).reduce(function (accu, curr, index) {
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
                        max: duration / 1000,
                        type: 'linear',
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
    }
    draw(timestamp) {
        const { effect, timer, scaleFrame, screen } = this
        // calculate the time elapsed since the last frame
        if (timer.start === null) timer.start = 0
        timer.delta = timestamp - timer.last
        timer.last = timestamp
        timer.rate = 1000 / timer.delta
        //screen.debug(ejs.render(timerDebugTemplate, timer))
        // update
        this.update()
        // draw
        if (effect === Spectrum.Animations.Rolling) {
            // take the whole screen and move it in the direction setup by the animator
            // then draw the line on the opposite side of the screen
            const { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight, lineX, lineY } = this.animator
            screen.context.drawImage(screen.canvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            screen.context.drawImage(scaleFrame.canvas, lineX, lineY)
        } else {
            // calculate the current x and y position and draw the line on top of the screen
            const { x, y } = this.animator.floater(timer)
            screen.context.drawImage(scaleFrame.canvas, x, y)
        }
        // loop
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { analyzer, buffer, colors, line, scaleFrame, pixels } = this
        // update buffer
        analyzer.getByteFrequencyData(buffer)
        // update pixels
        for (let bCnt = 0; bCnt < buffer.length; bCnt++) {
            const value = buffer[bCnt]
            const color = colors[value]
            const index = pixels.data.length - 4 - bCnt * 4
            pixels.data[index] = color.buffer[0]
            pixels.data[index + 1] = color.buffer[1]
            pixels.data[index + 2] = color.buffer[2]
            pixels.data[index + 3] = 255
        }
        line.context.putImageData(pixels, 0, 0)
        // update scale
        scaleFrame.context.drawImage(line.canvas, 0, 0)
    }
}
