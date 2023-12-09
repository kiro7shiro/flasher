import Color from 'https://colorjs.io/dist/color.js'
import { Visualizer } from './Visualizer.js'

class Waveform extends Visualizer {
    constructor(sound, x, y, width, height, { lineColor = null, lineWidth = 1 } = {}) {
        super(sound, x, y, width, height)
        this.lineColor = lineColor === null ? new Color('rgb(255, 255, 255)') : lineColor
        this.lineWidth = lineWidth
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        super.update(timestamp)
        const { analyser, buffer, offscreen } = this
        const { context } = offscreen
        offscreen.clear()
        analyser.getByteTimeDomainData(buffer)
        let x = 0
        const slice = offscreen.width / buffer.length
        context.lineWidth = this.lineWidth
        context.strokeStyle = this.lineColor.toString()
        context.beginPath()
        for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i] / 128
            const y = v * (offscreen.height / 2)
            if (i === 0) {
                context.moveTo(x, y)
            } else {
                context.lineTo(x, y)
            }
            x += slice
        }
        context.lineTo(offscreen.width, (buffer[buffer.length - 1] / 128) * (offscreen.height / 2))
        context.stroke()
    }
}

export { Waveform }
