import { Visualizer } from './Visualizer.js'

class STFT extends Visualizer {
    constructor(sound, x, y, width, height, { timeframe = 16 } = {}) {
        super(sound, x, y, width, height)
        const { buffer, offscreen } = this
        this.timeframe = timeframe
        this.pointer = 0
        const labels = buffer.reduce(function (accu, curr, index) {
            accu.push(index)
            return accu
        }, [])
        const datasets = new Array(timeframe).fill(0).reduce(function (accu, curr, index) {
            //#4f5559
            //#e8e6e3
            accu.push({
                data: new Array(timeframe),
                backgroundColor: '#e8e6e3',
                borderColor: '#e8e6e3',
                borderSkipped: true,
                borderRadius: 0,
                borderWidth: 0,
                categoryPercentage: 1
            })
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
                        max: timeframe * 255,
                        stacked: true
                    },
                    x: {
                        min: 0,
                        max: buffer.length,
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
        this.analyser.smoothingTimeConstant = 0.33
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        const { buffer, chart, timeframe } = this
        // update stft chart
        /* const temp = []
        buffer.map(function (val) {
            temp.push([val/255, 1])
        }) */
        chart.data.datasets[this.pointer].data = buffer
        this.pointer++
        if (this.pointer === timeframe) this.pointer = 0
        // NOTE : chart.update() clears the canvas, too.
        chart.update('none')
    }
}

export { STFT }
