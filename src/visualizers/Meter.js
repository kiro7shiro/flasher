import { Visualizers } from './Visualizers.js'
import { Visualizer } from './Visualizer.js'

class Meter extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        const { analyser, buffer, offscreen } = this
        analyser.maxDecibels = 0
        analyser.smoothingTimeConstant = 0.33
        //
        this.scaleOffsetX = 28
        this.scaleOffsetY = 29
        //
        offscreen.width = offscreen.width - this.scaleOffsetX
        offscreen.height = offscreen.height - this.scaleOffsetY
        //
        this.chart = new Chart(offscreen.canvas, {
            type: 'bar',
            data: {
                labels: [0, 0],
                datasets: [
                    {
                        label: 'volume',
                        display: false,
                        data: [],
                        normalized: true,
                        fill: true,
                        borderColor: '#e8e6e3',
                        backgroundColor: '#e8e6e3'
                    }
                ]
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        display: false,
                        min: -1,
                        max: 0,
                        stacked: true,
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
        this.scaleCanvas.width = width - this.scaleOffsetX / 4
        this.scaleCanvas.height = height
        this.scaleCanvas.style.position = 'absolute'
        this.scaleCanvas.style.zIndex = 2
        this.screen.container.append(this.scaleCanvas)
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: ['abs', 'rel'],
                datasets: [
                    {
                        data: [0, 0]
                    }
                ]
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: -1,
                        max: 0,
                        grid: {
                            display: true
                        },
                        x: {
                            grid: {
                                display: true
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
    }
    draw(timestamp) {
        const { screen, offscreen, scaleOffsetX } = this
        this.update(timestamp)
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, 0)
        this.handle = requestAnimationFrame(this.draw.bind(this))
        return this.handle
    }
    update(timestamp) {
        // draw volume chart
        const { analyser, buffer, chart } = this
        analyser.getByteFrequencyData(buffer)
        let sum = 0
        for (const amplitude of buffer) {
            sum += amplitude * amplitude
        }
        const ampMin = Math.min(...buffer)
        const ampMax = Math.max(...buffer)
        const volume = Math.sqrt(sum / buffer.length)
        const vAbs = 1 - Visualizers.mapNumRange(volume, 0, 256, 0, 1)
        const vRel = 1 - Visualizers.mapNumRange(volume, ampMin, ampMax, 0, 1)
        chart.data.datasets[0].data = [
            [-vAbs, -1],
            [-vRel, -1]
        ]
        // NOTE : chart.update() clears the canvas, too.
        chart.update('none')
        return performance.now() - timestamp
    }
}

export { Meter }
