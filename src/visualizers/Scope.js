import { Control } from '/src/Control.js'
import { Screen } from './Screen.js'
import { AudioNodes } from '../nodes/nodes.js'

const timerDebugTemplate = '<div class="w3-text-white">fps: <%= rate.toFixed(2) %></div>\n<div class="w3-text-white">dlt: <%= delta.toFixed(2) %></div>'

const defaultColors = (function () {
    const startColor = new Color('#e2dc18') /* new Color('#890189ff') */
    const endColor = new Color('#890189ff') /* new Color('#e2dc18') */
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

export class Scope {
    static defaults = {
        template: '/views/Visualizer.ejs',
        data: { header: 'scope' },
        container: 'div',
        events: ['click'],
        width: 512,
        height: 128,
        fftSize: 1024,
        minDecibels: -100,
        maxDecibels: 0,
        smoothingTimeConstant: 0.33,
        colors: defaultColors
    }
    static async build(sound, options = {}) {
        if (!sound) throw new Error('A sound instance must be given.')
        options = Control.buildOptions(Scope.defaults, options)
        const { template, data, container, events } = options
        const control = await Control.build(template, data, container, events)
        return new Scope(sound, control, options)
    }
    static buildSync(sound, options = {}) {
        if (!sound) throw new Error('A sound instance must be given.')
        options = Control.buildOptions(Scope.defaults, options)
        const { template, data, container, events } = options
        const control = Control.buildSync(template, data, container, events)
        return new Scope(sound, control, options)
    }
    constructor(sound, control, options = {}) {
        // options
        options = Control.buildOptions(Scope.defaults, options)
        const { width, height, colors, fftSize, maxDecibels, minDecibels, smoothingTimeConstant } = options
        // controls
        this.control = control
        this.container = control.container
        this.analyzer = new AnalyserNode(sound.context, { fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyzer.frequencyBinCount)
        this.audioGraph = []
        this.analyzer.minDecibels = minDecibels
        this.analyzer.maxDecibels = maxDecibels
        // ui events
        this.audioNodes = this.container.querySelector('.audio-nodes')
        this.analyzerControl = AudioNodes.AnalyserNode.buildSync(this.analyzer)
        this.audioNodes.insertAdjacentElement('afterbegin', this.analyzerControl.container)
        // animation
        this.colors = colors
        this.timer = {
            delta: 0,
            last: 0,
            start: null,
            rate: 0,
            interval: 1000 / 60
        }
        this.timeframe = (fftSize / sound.context.sampleRate) * 1000
        const resolutionPerPixel = width / this.buffer.length
        const scaleFactor = height / 255
        const pointsToPlot = Math.floor(width / resolutionPerPixel)
        const path = new Array(pointsToPlot).fill(null)
        const interpolationFactor = pointsToPlot / this.buffer.length
        const discardFactor = this.buffer.length / pointsToPlot
        this.animator = {
            resolutionPerPixel,
            scaleFactor,
            pointsToPlot,
            path,
            interpolationFactor,
            discardFactor
        }
        this.handle = null
        // setup the screen
        this.screen = new Screen(width, height)
        this.screen.context.lineWidth = 2
        this.screen.context.strokeStyle = colors[colors.length - 1]
        // setup the background
        this.screen.canvas.style.left = '20px'
        this.scaleCanvas = this.screen.background
        this.scaleCanvas.width = width + 20
        this.scaleCanvas.height = height + 60
        this.scaleCanvas.style.zIndex = 1
        const self = this
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: new Array(this.buffer.length).fill(0).map((_, i) => i + 1),
                datasets: [
                    {
                        data: []
                    }
                ]
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        type: 'linear',
                        min: 0,
                        max: 1,
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: true,
                            callback: function name(value, index, ticks) {
                                if (index === ticks.length / 2) return 'V'
                                return ''
                            }
                        }
                    },
                    x: {
                        title: { display: true, text: `ms` },
                        min: 0,
                        max: 1,
                        type: 'linear',
                        reverse: false,
                        grid: {
                            display: true,
                            color: '#272727'
                        },
                        ticks: {
                            callback: function (value, index, ticks) {
                                return (value * self.timeframe).toFixed(2)
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
        const { animator, screen, timer } = this
        if (timer.start === null) timer.start = 0
        timer.delta = timestamp - timer.last
        timer.last = timestamp
        timer.rate = 1000 / timer.delta
        // update
        this.update()
        // draw waveform
        screen.clear()
        //screen.debug(ejs.render(timerDebugTemplate, timer))
        for (let pCnt = 0; pCnt < animator.path.length - 1; pCnt++) {
            const { x: x1, y: y1, strokeStyle } = animator.path[pCnt]
            const { x: x2, y: y2 } = animator.path[pCnt + 1]
            screen.context.beginPath()
            screen.context.strokeStyle = strokeStyle
            screen.context.moveTo(x1, y1)
            screen.context.lineTo(x2, y2)
            screen.context.stroke()
        }
        // loop
        this.handle = requestAnimationFrame(this.draw.bind(this))
    }
    update() {
        const { animator, analyzer, buffer, colors, screen } = this
        // update buffer
        analyzer.getByteTimeDomainData(buffer)
        if (buffer.length < animator.pointsToPlot) {
            // interpolate
            for (let pCnt = 0; pCnt < animator.path.length; pCnt++) {
                const index = pCnt / animator.interpolationFactor
                const indexFloor = Math.floor(index)
                const indexCeil = Math.ceil(index)
                const fraction = index - indexFloor
                if (indexCeil >= buffer.length) {
                    animator.path[pCnt] = { valueY: buffer[buffer.length - 1] }
                } else {
                    animator.path[pCnt] = { valueY: buffer[indexFloor] + (buffer[indexCeil] - buffer[indexFloor]) * fraction }
                }
            }
        } else if (buffer.length === animator.pointsToPlot) {
            // copy
            for (let bCnt = 0; bCnt < buffer.length; bCnt++) {
                const valueY = buffer[bCnt]
                animator.path[bCnt] = { valueY }
            }
        } else if (buffer.length > animator.pointsToPlot) {
            // discard
            for (let pCnt = 0; pCnt < animator.path.length; pCnt++) {
                animator.path[pCnt] = { valueY: buffer[Math.floor(pCnt * animator.discardFactor)] }
            }
        }
        // store path coords and color
        for (let pCnt = 0; pCnt < animator.path.length; pCnt++) {
            const { valueY } = animator.path[pCnt]
            const midValue = 128
            let colorIndex
            if (valueY <= 1 || valueY >= 254) {
                // plus and minus peaks
                colorIndex = 0
            } else if (valueY === midValue) {
                // mid point
                colorIndex = colors.length - 1
            } else if (valueY < midValue) {
                colorIndex = Math.floor((valueY / midValue) * colors.length)
            } else {
                colorIndex = colors.length - 1 - Math.floor(((valueY - midValue) / midValue) * colors.length)
            }
            animator.path[pCnt].strokeStyle = colors[colorIndex]
            animator.path[pCnt].x = pCnt * animator.resolutionPerPixel
            animator.path[pCnt].y = Math.round(screen.height - valueY * animator.scaleFactor)
        }
    }
}
