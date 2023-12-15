import { Visualizer } from './Visualizer.js'

class STFT2 extends Visualizer {
    constructor(sound, x, y, width, height, { timeframe = 16 } = {}) {
        super(sound, x, y, width, height)
        this.analyser = sound.createAnalyser({ fftSize: 128 })
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        const { buffer, offscreen } = this
        this.timeframe = timeframe
        this.pointer = timeframe - 1
        this.lastDraw = 0
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
                //borderColor: '#e8e6e3',
                //borderSkipped: true,
                borderRadius: 0
                //borderWidth: 0
                //categoryPercentage: 1
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
                    /* indexAxis: 'y', */
                    y: {
                        min: 0,
                        max: timeframe,
                        stacked: true,
                        reverse: false
                    },
                    x: {
                        min: 0,
                        max: buffer.length,
                        stacked: false
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    decimation: {
                        enable: true
                        //samples: timeframe / 2,
                        //threshold: 0.5
                        //algorithm: 'lttb'
                    }
                },
                responsive: false
            }
        })
        this.analyser.maxDecibels = -30
        this.analyser.smoothingTimeConstant = 0.33
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        const { buffer, chart, timeframe } = this
        // update stft chart
        const data = []
        buffer.forEach((val) => data.push([val / 255, 1]))
        chart.data.datasets[this.pointer].data = data
        this.pointer--
        if (this.pointer < 0) this.pointer = timeframe - 1
        const now = performance.now()
        const delta = now - this.lastDraw
        if (delta >= 1000 / 25) {
            // NOTE : chart.update() clears the canvas, too.
            chart.update('none')
            this.lastDraw = now
        }
    }
}

class STFT extends Visualizer {
    constructor(sound, x, y, width, height, { timeframe = 256 } = {}) {
        super(sound, x, y, width, height)
        this.analyser = sound.createAnalyser({ fftSize: 1024 })
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.maxDecibels = 0
        this.analyser.smoothingTimeConstant = 0.33
        const { buffer, offscreen } = this
        this.width = width
        this.height = height
        this.cellsWidth = width / buffer.length
        this.cellsHeight = height / timeframe
        offscreen.width = width
        offscreen.height = height
        this.frameCount = 0
        this.timeframe = timeframe
        const pixels = (this.pixels = offscreen.context.getImageData(0, 0, width, 1))
        for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
            pixels.data[pCnt] = 255
            pixels.data[pCnt + 1] = 255
            pixels.data[pCnt + 2] = 255
            pixels.data[pCnt + 3] = 0
        }
    }
    draw(screen) {
        // draw pixels to screen
        const { cellsHeight, frameCount, timeframe, offscreen, pixels } = this
        const y = frameCount * cellsHeight
        for (let hCnt = 0; hCnt < cellsHeight; hCnt++) {
            offscreen.context.putImageData(pixels, 0, y + hCnt)   
        }
        this.frameCount++
        if (frameCount > timeframe) this.frameCount = 0
        const duration = super.draw(screen)
        return duration
    }
    update(timestamp) {
        super.update(timestamp)
        const { buffer, cellsWidth, pixels } = this
        // set pixels to buffer value
        // fill the first row of pixels
        let bCnt = 0
        for (let x = 0; x < pixels.data.length; x+=4) {
            pixels.data[x + 3] = buffer[bCnt]
            if (x % (cellsWidth * bCnt + 1) === 0) bCnt++
        }
    }
}

export { STFT }
