import { Visualizer } from './Visualizer.js'

class Meter extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
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
                        //borderWidth: 1,
                        fill: true,
                        borderColor: '#e8e6e3',
                        backgroundColor: '#e8e6e3',
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
                    },
                    decimation: {
                        enabled: true,
                        threshold: offscreen.width / 2
                    }
                },
                responsive: false
            }
        })
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.33
    }
    draw(timestamp) {
        const { screen, offscreen } = this
        screen.clear()
        screen.context.drawImage(offscreen.canvas, 0, 0)
        return performance.now() - timestamp
    }
    update(timestamp) {
        // draw volume chart
        const { analyser, buffer, chart } = this
        analyser.getByteFrequencyData(buffer)
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
        return performance.now() - timestamp
    }
}

export { Meter }
