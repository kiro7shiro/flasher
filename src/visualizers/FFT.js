import { Visualizer } from './Visualizer.js'

const timerDebugTemplate = '<div>fps: <%= frames %></div>'

class FFT extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        const { analyser, buffer, offscreen } = this
        analyser.maxDecibels = -20
        analyser.smoothingTimeConstant = 0.5
        //
        this.scaleOffsetX = 37
        this.scaleOffsetY = 10
        this.borderBottom = 50
        //
        offscreen.width = offscreen.width - this.scaleOffsetX
        offscreen.height = offscreen.height - this.borderBottom
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
                        display: false,
                        ticks: {
                            display: false
                        }
                    },
                    x: {
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
            timer.last = performance.now()
            timer.frames = 0
        }
        timer.frames++

        return this.handle
    }
    update() {
        // draw fft chart
        const { analyser, buffer, chart } = this
        analyser.getByteFrequencyData(buffer)
        chart.data.datasets[0].data = buffer
        // NOTE : chart.update() clears the canvas, too.
        chart.update('none')
    }
}

export { FFT }
