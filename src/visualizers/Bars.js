import Color from 'https://colorjs.io/dist/color.js'
import { Visualizer } from './Visualizer.js'

function rainbow(length) {
    const rainbowColors = []
    for (let i = 0; i < length; i++) {
        const percent = i / (length - 1)
        const hue = percent * 360
        const color = new Color('hsv', [hue, 100, 100]).to('srgb')
        rainbowColors.push(color)
    }
    return rainbowColors
}

function freqToX(freq, sampleRate) {
    const mLog10 = Math.log(10)
    const minF = Math.log(20) / mLog10
    const maxF = Math.log(sampleRate) / mLog10
    const range = maxF - minF
    return (Math.log(freq) / mLog10 - minF) / range
}

class Bars extends Visualizer {
    constructor(sound, x, y, width, height, { barsCount = null } = {}) {
        super(sound, x, y, width, height)
        this.barsCount = barsCount === null ? this.buffer.length : barsCount
        this.barsColors = rainbow(this.barsCount)
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        const { analyser, buffer, barsCount, offscreen } = this
        analyser.getByteFrequencyData(buffer)
        const chunkSize = buffer.length / barsCount
        const average = []
        for (let index = 0; index < buffer.length; index += chunkSize) {
            const chunk = buffer.slice(index, index + chunkSize)
            const chunkAvrg = chunk.reduce((sum, num) => sum + num, 0) / chunk.length
            average.push(chunkAvrg)
        }
        offscreen.clear()
        const { context } = offscreen
        const barWidth = offscreen.width / average.length
        let x = 0
        for (let index = 0; index < average.length; index++) {
            const barHeight = parseInt((average[index] * offscreen.height) / 255)
            const color = this.barsColors[index]
            context.fillStyle = color.toString()
            context.fillRect(x, offscreen.height - barHeight, barWidth, barHeight)
            x += barWidth
        }
    }
}

export { Bars, rainbow }
