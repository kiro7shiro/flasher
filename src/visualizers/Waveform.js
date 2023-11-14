import Color from 'https://colorjs.io/dist/color.js'
import { Visualizer } from './Visualizer.js'

class Waveform extends Visualizer {
    constructor(sound, { lineColor = null, lineWidth = 1 } = {}) {
        super(sound)
        this.lineColor = lineColor === null ? new Color('rgb(255, 255, 255)') : lineColor
        this.lineWidth = lineWidth
    }
    draw(screen) {
        const { analyser, buffer } = this
        const { context } = screen
        analyser.getByteTimeDomainData(buffer)
        let x = 0
        const slice = screen.width / buffer.length
        context.lineWidth = this.lineWidth
        context.strokeStyle = this.lineColor.toString()
        context.beginPath()
        for (let i = 0; i < buffer.length; i++) {
            const v = buffer[i] / 128
            const y = v * (screen.height / 2)
            if (i === 0) {
                context.moveTo(x, y)
            } else {
                context.lineTo(x, y)
            }
            x += slice
        }
        context.lineTo(screen.width, (buffer[buffer.length - 1] / 128) * (screen.height / 2))
        context.stroke()
    }
}

export { Waveform }
