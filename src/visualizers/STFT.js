import { Visualizer } from './Visualizer.js'

class STFT extends Visualizer {
    constructor(sound, x, y, width, height, { timeframe = 6 } = {}) {
        super(sound, x, y, width, height)
        const { buffer, offscreen } = this
        this.timeframe = timeframe
        this.pointer = 0
        const labels = new Array(timeframe).fill(0).reduce(function (accu, curr, index) {
            accu.push(index)
            return accu
        }, [])
        const datasets = buffer.reduce(function (accu, curr, index) {
            accu.push({ data: [] })
            return accu
        }, [])
        this.chart = new Chart(offscreen.canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: 0,
                        max: 256 * buffer.length,
                        stacked: true
                    },
                    x: {
                        min: 0,
                        max: timeframe,
                        stacked: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    decimation: {
                        enable: true
                    }
                },
                responsive: false
            }
        })
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.88
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        const { buffer, chart, timeframe } = this
        // update stft chart
        const data = buffer.reduce(function (accu, curr) {
            const diff = 256 - curr
            accu.push([diff, 256])
            return accu
        }, [])
        chart.data.datasets[this.pointer].data = data //.slice(0)
        this.pointer++
        if (this.pointer === buffer.length) this.pointer = 0
        // NOTE : chart.update() clears the canvas, too.
        chart.update()
    }
}

export { STFT }
