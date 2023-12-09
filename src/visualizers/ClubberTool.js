import { Visualizer } from './Visualizer.js'
import Color from 'https://colorjs.io/dist/color.js'

const rectColor = new Color('rgb(64, 64, 64)')
const chartOffsetX = 36
const chartOffsetY = 20

class ClubberTool extends Visualizer {
    constructor(sound, x, y, width, height) {
        super(sound, x, y, width, height)
        this.chart = this.createChart(this.offscreen.canvas)
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.88
    }
    createChart(canvas) {
        const chart = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'notes',
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
        return chart
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        // draw note chart
        const { chart } = this
        chart.data.labels = this.clubber.notes.reduce(function (accu, curr, index) {
            accu.push(index)
            return accu
        }, [])
        chart.data.datasets[0].data = this.clubber.notes
        // NOTE : chart.update() clears the canvas, too.
        chart.update()
        // draw bands
        const { context } = this.offscreen
        for (let bCnt = 0; bCnt < this.bands.length; bCnt++) {
            // execute band
            const { band, buffer, options } = this.bands[bCnt]
            let { template } = options
            if (typeof template === 'string') template = template.split('')
            this.clubber.time = window.performance.now()
            const rect = band(buffer)
            const self = this
            const result = template.reduce(function (accu, curr, index) {
                accu.push({ description: self.clubber.descriptions[index], value: buffer[index] })
                return accu
            }, [])
            this.bands[bCnt].rect = rect
            this.bands[bCnt].result = result
            // draw band rect
            const width =
                Visualizer.mapNumRange(rect.to, 1, 128, 0, this.offscreen.width - chartOffsetX) -
                Visualizer.mapNumRange(rect.from, 1, 128, 0, this.offscreen.width - chartOffsetX)
            const height =
                Visualizer.mapNumRange(rect.high, 1, 256, 0, this.offscreen.height - chartOffsetY) -
                Visualizer.mapNumRange(rect.low, 1, 256, 0, this.offscreen.height - chartOffsetY) -
                chartOffsetY
            const x = Visualizer.mapNumRange(rect.from, 1, 128, 0, this.offscreen.width - chartOffsetX) + chartOffsetX
            const y = this.offscreen.height - chartOffsetY - Visualizer.mapNumRange(rect.high, 1, 256, 0, this.offscreen.height - chartOffsetY)
            rectColor.alpha = 0.5
            context.fillStyle = rectColor.toString()
            context.strokeStyle = 'white'
            context.fillRect(x, y, width, height)
            context.strokeRect(x, y, width, height)
        }
    }
}

export { ClubberTool }
