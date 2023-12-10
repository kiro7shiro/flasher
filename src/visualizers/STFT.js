import { Visualizer } from './Visualizer.js'

class STFT extends Visualizer {
    constructor(sound, x, y, width, height) {
        super(sound, x, y, width, height)
        this.chart = null
        this.bins = new Array()
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.88
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        const { buffer, chart } = this
        
        // draw fft chart
        const { offscreen } = this
        this.chart = new Chart(offscreen.canvas, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        type: 'line',
                        fill: false,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        yAxisID: 'y-axis-2'
                    },
                    {
                        type: 'bar',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        yAxisID: 'y-axis-1'
                    }
                ]
            },
            options: {
                scales: {
                    yAxes: [
                        {
                            id: 'y-axis-1',
                            type: 'linear',
                            position: 'left'
                        },
                        {
                            id: 'y-axis-2',
                            type: 'linear',
                            position: 'right',
                            ticks: {
                                max: Math.max(...cumulativeSum),
                                min: Math.min(0, ...cumulativeSum)
                            }
                        }
                    ]
                }
            }
        })
        chart.data.labels = cumulativeSum.reduce(function (accu, curr, index) {
            accu.push(index)
            return accu
        }, [])
        chart.data.datasets[0].data = cumulativeSum
        chart.data.datasets[1].data = buffer
        // NOTE : chart.update() clears the canvas, too.
        chart.update()
    }
}

export { STFT }
