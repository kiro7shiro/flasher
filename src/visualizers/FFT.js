import { Visualizer } from './Visualizer.js'

class FFT extends Visualizer {
    constructor(sound, x, y, width, height) {
        super(sound, x, y, width, height)
        const { offscreen } = this
        this.chart = new Chart(offscreen.canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'freq',
                        display: false,
                        data: [],
                        borderWidth: 1,
                        fill: true,
                        borderColor: '#e8e6e3',
                        //backgroundColor: '#4f5559',
                        tension: 0.25,
                        pointStyle: false
                    }
                ]
            },
            options: {
                animation: false,
                animations: {
                    x: false
                },
                scales: {
                    y: {
                        min: 1,
                        max: 256
                    },
                    x: {
                        min: 1,
                        max: 128
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
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.33
    }
    draw(screen) {
        const duration = super.draw(screen)
        return duration
    }
    update(timestamp) {
        super.update(timestamp)
        // draw fft chart
        const { buffer, chart } = this
        chart.data.labels = buffer.reduce(function (accu, curr, index) {
            accu.push(index)
            return accu
        }, [])
        chart.data.datasets[0].data = buffer
        // NOTE : chart.update() clears the canvas, too.
        chart.update()
    }
}

export { FFT }
