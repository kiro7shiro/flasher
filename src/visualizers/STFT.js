import { Visualizer } from './Visualizer.js'
import { Screen } from '../Screen.js'

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
        this.scaleOffsetX = 37
        this.scaleOffsetY = 40
        //
        offscreen.width = offscreen.width - this.scaleOffsetX
        offscreen.height = offscreen.height - this.scaleOffsetY
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
        this.scaleCanvas.style.zIndex = 3
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
        const delta = timestamp - this.lastDraw
        const { cellsHeight, firstFrame, secondFrame, frames, pixels, timeframe } = this
        const frame = frames[secondFrame]
        const y = this.frameCount * cellsHeight - delta / 60
        for (let hCnt = 0; hCnt < cellsHeight; hCnt++) {
            frame.context.putImageData(pixels, 0, y + hCnt)
        }
        this.frameCount++
        if (this.frameCount > timeframe) {
            this.frameCount = 0
            this.firstFrame = secondFrame
            this.secondFrame = firstFrame
        }
        const { offscreen, scaleOffsetX, screen } = this
        offscreen.clear()
        offscreen.context.drawImage(frames[firstFrame].canvas, 0, -y)
        offscreen.context.drawImage(frames[secondFrame].canvas, 0, offscreen.height - y)
        screen.clear()
        screen.context.drawImage(offscreen.canvas, scaleOffsetX, 0)
        this.lastDraw = performance.now()
        return this.lastDraw - timestamp
    }
    update(timestamp) {
        const { analyser, buffer, cellsWidth, pixels } = this
        analyser.getByteFrequencyData(buffer)
        // set pixels to buffer value
        let bCnt = 0
        for (let x = 0; x < pixels.data.length; x += 4) {
            pixels.data[x + 3] = buffer[bCnt]
            if (x % (cellsWidth * bCnt + 1) === 0) bCnt++
        }
        return performance.now() - timestamp
    }
}

export { STFT }
