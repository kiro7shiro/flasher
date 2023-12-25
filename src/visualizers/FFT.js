import { Visualizer } from './Visualizer.js'

class FFT extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        const { buffer, offscreen } = this
        this.chart = new Chart(offscreen.canvas, {
            type: 'bar',
            data: {
                labels: buffer.reduce(function (accu, curr, index) {
                    accu.push(index)
                    return accu
                }, []),
                datasets: [
                    {
                        label: 'freq',
                        display: false,
                        data: [],
                        //borderWidth: 1,
                        fill: true,
                        //borderColor: '#e8e6e3',
                        backgroundColor: '#e8e6e3',
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
                        max: 256,
                        grid: {
                            display: true
                        }
                    },
                    x: {
                        min: 1,
                        max: this.analyser.frequencyBinCount,
                        grid: {
                            display: true
                        }
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
        this.analyser.maxDecibels = -20
        this.analyser.smoothingTimeConstant = 0.5
    }
    draw(timestamp) {
        const { screen, offscreen } = this
        screen.clear()
        screen.context.drawImage(offscreen.canvas, 0, 0)
        return performance.now() - timestamp
    }
    update(timestamp) {
        // draw fft chart
        const { analyser, buffer, chart } = this
        analyser.getByteFrequencyData(buffer)
        chart.data.datasets[0].data = buffer
        // NOTE : chart.update() clears the canvas, too.
        chart.update()
        return performance.now() - timestamp
    }
}

export { FFT }
