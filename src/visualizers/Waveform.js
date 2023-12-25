import { Visualizer } from './Visualizer.js'

class Waveform extends Visualizer {
    constructor(sound, x, y, width, height, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, x, y, width, height, { fftSize, smoothingTimeConstant })
        const { offscreen } = this
        this.chart = new Chart(offscreen.canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'waveform',
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
                scales: {
                    y: {
                        min: -1,
                        max: 1
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
        this.analyser.smoothingTimeConstant = 0.77
    }
    draw(timestamp) {
        const { screen, offscreen } = this
        screen.clear()
        screen.context.drawImage(offscreen.canvas, 0, 0)
        return performance.now() - timestamp
    }
    update(timestamp) {
        const { analyser, buffer, chart } = this
        analyser.getByteTimeDomainData(buffer)
        const data = []
        chart.data.labels = buffer.reduce(function (accu, curr, index) {
            accu.push(index)
            data.push(1 - buffer[index] / 128)
            return accu
        }, [])
        chart.data.datasets[0].data = data
        chart.update()
        // NOTE : chart.update() clears the canvas, too.
        return performance.now() - timestamp
    }
}

export { Waveform }
