import { Visualizer } from './Visualizer.js'
import { Screen } from '../Screen.js'

const timerDebugTemplate = '<div>fps: <%= frames %></div>'

/**
 * Short time fourier transform
 */
class STFT extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5, timeframe = 250 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        const { analyser, buffer, offscreen } = this
        analyser.maxDecibels = -20
        analyser.smoothingTimeConstant = 0.33
        //
        this.lastDraw = 0
        this.frameCount = 0
        this.firstFrame = 0
        this.secondFrame = 1
        this.timeframe = timeframe
        // offsets for the scale canvas
        this.scaleOffsetX = 37
        this.scaleOffsetY = 10
        this.borderBottom = 50
        //
        offscreen.width = offscreen.width - this.scaleOffsetX
        offscreen.height = offscreen.height - this.borderBottom
        this.cellsWidth = Math.round(offscreen.width / buffer.length)
        this.cellsHeight = offscreen.height / timeframe
        //
        this.frame1 = new Screen(offscreen.width, offscreen.height)
        this.frame2 = new Screen(offscreen.width, offscreen.height)
        this.frames = [this.frame1, this.frame2]
        //
        const pixels = (this.pixels = this.offscreen.context.createImageData(offscreen.width, 1))
        for (let pCnt = 0; pCnt < pixels.data.length; pCnt += 4) {
            pixels.data[pCnt] = 255
            pixels.data[pCnt + 1] = 255
            pixels.data[pCnt + 2] = 255
            pixels.data[pCnt + 3] = 0
        }
        //
        this.scaleCanvas = document.createElement('canvas')
        this.scaleCanvas.width = width
        this.scaleCanvas.height = height
        this.scaleCanvas.style.position = 'absolute'
        this.scaleCanvas.style.zIndex = 2
        this.screen.container.append(this.scaleCanvas)
        this.scaleChart = new Chart(this.scaleCanvas, {
            type: 'bar',
            data: {
                labels: buffer.reduce(function (accu, curr, index) {
                    accu.push(index)
                    return accu
                }, [])
            },
            options: {
                animation: false,
                scales: {
                    y: {
                        min: 1,
                        max: timeframe,
                        reverse: false,
                        grid: {
                            display: true
                        }
                    },
                    x: {
                        min: 1,
                        max: buffer.length,
                        grid: {
                            display: true
                        }
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
    }
    draw(timestamp) {
        const { timer } = this
        const delta = timestamp - this.lastDraw
        timer.delta = timestamp - timer.last
        // update pixel buffer
        this.update(timestamp)
        //
        const { cellsHeight, firstFrame, secondFrame, frames, pixels, timeframe } = this
        const frame = frames[secondFrame]
        const y = this.frameCount * cellsHeight
        for (let hCnt = 0; hCnt < cellsHeight; hCnt++) {
            frame.context.putImageData(pixels, 0, y + hCnt)
        }
        const { offscreen, scaleOffsetX, scaleOffsetY, screen } = this
        this.frameCount++
        if (this.frameCount > timeframe) {
            this.frameCount = 0
            this.firstFrame = secondFrame
            this.secondFrame = firstFrame
        }
        const offsetDelta = parseInt(delta / 16.66)
        offscreen.clear()
        offscreen.context.drawImage(frames[firstFrame].canvas, 0, -y - offsetDelta)
        offscreen.context.drawImage(frames[secondFrame].canvas, 0, offscreen.height - y - offsetDelta)
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, scaleOffsetY)
        this.lastDraw = performance.now()
        // loop
        this.handle = requestAnimationFrame(this.draw.bind(this))

        if (timestamp > timer.last + 1000) {
            //screen.debug(ejs.render(timerDebugTemplate, timer))
            timer.last = performance.now()
            timer.frames = 0
        }
        timer.frames++

        return this.handle
    }
    update() {
        const { analyser, buffer, cellsWidth, offscreen, pixels } = this
        analyser.getByteFrequencyData(buffer)
        let average = []
        if (cellsWidth < 1) {
            // buffer is larger than screen width
            // calculate an average for frequency bins
            const chunkSize = buffer.length / offscreen.width
            for (let index = 0; index < buffer.length; index += chunkSize) {
                const chunk = buffer.slice(index, index + chunkSize)
                const chunkAvrg = chunk.reduce((sum, num) => sum + num, 0) / chunk.length
                average.push(chunkAvrg)
            }
        } else {
            // buffer has equal length or is shorter than screen width
            average = buffer
        }
        //
        /* const peaks = []
        const threshold = 64
        const range = 64
        for (let i = range; i < average.length - range; i++) {
            const curr = average[i]
            const before = average.slice(i - range, i)
            const after = average.slice(i + 1, i + range + 1)
            if (curr > before.every((val) => val < curr) && curr > after.every((val) => val < curr) && curr > threshold) {
                peaks.push(i)
            }
        }
        console.log(peaks) */
        // set pixel buffer
        let bCnt = 0
        for (let x = 0; x < pixels.data.length; x += 4) {
            pixels.data[x + 3] = average[bCnt]
            if (x % (cellsWidth * bCnt + 1) === 0) bCnt++
        }
    }
}

export { STFT }
