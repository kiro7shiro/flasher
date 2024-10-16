import { addEvents, Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as nodes from '../nodes/nodes.js'

const timerDebugTemplate = '<div>fps: <%= frames %></div><div>delta: <%= delta.toFixed(2) %></div>'

class Bars {
    constructor(source, { sound, width, height, fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        //
        if (!sound) throw new Error('A sound instance must be given.')
        if (width === null && width === undefined) throw new Error('Width must be given.')
        if (height === null && height === undefined) throw new Error('Height must be given.')
        //
        console.log(source)
        this.control = new Control(source)
        this.element = this.control.element
        console.log(this.element)
        //
        this.analyzer = sound.createAnalyzer({ fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyzer.frequencyBinCount)
        this.audioGraph = []
        this.analyzer.maxDecibels = -20
        this.analyzer.smoothingTimeConstant = 0.33
        //
        nodes.AudioNodes(this)
        nodes.AnalyserNode(this)
        //
        this.scaleOffsetX = 37
        this.scaleOffsetY = 10
        this.borderBottom = 50
        //
        this.screen = new Screen(width, height)
        this.offscreen = new Screen(width, height)
        this.offscreen.width = this.offscreen.width - this.scaleOffsetX
        this.offscreen.height = this.offscreen.height - this.borderBottom
        const { buffer, offscreen } = this
        //
        this.chart = new Chart(offscreen.canvas, {
            type: 'bar',
            data: {
                labels: new Array(buffer.length).fill(0),
                datasets: [
                    {
                        label: 'freq',
                        display: false,
                        data: [],
                        normalized: true,
                        fill: true,
                        backgroundColor: '#e8e6e3'
                    }
                ]
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: 1,
                        max: 256,
                        display: false,
                        ticks: {
                            display: false
                        }
                    },
                    x: {
                        min: 1,
                        max: buffer.length,
                        display: false,
                        ticks: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    decimation: {
                        enabled: true
                    }
                },
                responsive: false
            }
        })
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
                        max: 256,
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
        const screenContainer = this.element.querySelector('#screen-container')
        screenContainer.append(this.screen.container)
        //
        this.timer = {
            delta: 0,
            frames: 0,
            last: 0
        }
    }
    draw(timestamp) {
        const { timer } = this
        timer.delta = timestamp - timer.last

        const { screen, offscreen, scaleOffsetX, scaleOffsetY } = this
        this.update()
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
        this.handle = requestAnimationFrame(this.draw.bind(this))

        if (timestamp > timer.last + 1000) {
            //screen.debug(ejs.render(timerDebugTemplate, timer))
            timer.last = performance.now()
            timer.frames = 0
        }
        timer.frames++

        return this.handle
    }
    update() {
        // draw fft chart
        const { analyzer, buffer, chart } = this
        analyzer.getByteFrequencyData(buffer)
        chart.data.datasets[0].data = buffer
        // NOTE : chart.update() clears the canvas, too.
        chart.update('none')
    }
}

export { Bars }
