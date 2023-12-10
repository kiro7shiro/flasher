import { Visualizer } from './Visualizer.js'

class Meter extends Visualizer {
    constructor(sound, x, y, width, height) {
        super(sound, x, y, width, height)
        const { offscreen } = this
        this.chart = new Chart(offscreen.canvas, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'volume',
                        display: false,
                        data: [],
                        borderWidth: 1,
                        fill: true,
                        borderColor: '#e8e6e3'
                        //backgroundColor: '#4f5559',
                    }
                ]
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: -1,
                        max: 0,
                        reverse: false,
                        stacked: true
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
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        // draw volume chart
        const { buffer, chart } = this
        chart.data.labels = ['abs', 'rel']
        let sum = 0
        for (const amplitude of buffer) {
            sum += amplitude * amplitude
        }
        const ampMin = Math.min(...buffer)
        const ampMax = Math.max(...buffer)
        const volume = Math.sqrt(sum / buffer.length)
        const vAbs = 1 - Visualizer.mapNumRange(volume, 0, 256, 0, 1)
        const vRel = 1 - Visualizer.mapNumRange(volume, ampMin, ampMax, 0, 1)
        chart.data.datasets[0].data = [
            [-vAbs, -1],
            [-vRel, -1]
        ]
        // NOTE : chart.update() clears the canvas, too.
        chart.update()
    }
}

export { Meter }
