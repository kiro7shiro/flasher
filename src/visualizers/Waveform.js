import { Visualizer } from './Visualizer.js'

class Waveform extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        const { analyser, buffer, offscreen } = this
        analyser.maxDecibels = 0
        analyser.smoothingTimeConstant = 0.77
        //
        this.scaleOffsetX = 31
        this.scaleOffsetY = 6
        this.borderBottom = 10
        //
        offscreen.width = offscreen.width - this.scaleOffsetX
        offscreen.height = offscreen.height - this.borderBottom
        //
        this.chart = new Chart(offscreen.canvas, {
            type: 'line',
            data: {
                labels: new Array(buffer.length).fill(0),
                datasets: [
                    {
                        label: 'waveform',
                        display: false,
                        data: [],
                        normalized: true,
                        borderWidth: 1,
                        borderColor: '#e8e6e3',
                        tension: 0.25,
                        pointStyle: false
                    }
                ]
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        display: false,
                        min: 0,
                        max: 255,
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
                        min: -1,
                        max: 1,
                        grid: {
                            display: true
                        }
                    },
                    x: {
                        display: false,
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
        const { screen, offscreen, scaleOffsetX, scaleOffsetY } = this
        this.update(timestamp)
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
        this.handle = requestAnimationFrame(this.draw.bind(this))
        return this.handle
    }
    update(timestamp) {
        const { analyser, buffer, chart } = this
        analyser.getByteTimeDomainData(buffer)
        chart.data.datasets[0].data = buffer
        chart.update('none')
        // NOTE : chart.update() clears the canvas, too.
        return performance.now() - timestamp
    }
}

export { Waveform }
