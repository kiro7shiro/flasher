import { Visualizer } from './Visualizer.js'

class Waveform extends Visualizer {
    constructor(sound, x, y, width, height) {
        super(sound, x, y, width, height)
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
                    }
                },
                responsive: false
            }
        })
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.77
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
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
    }
}

export { Waveform }
