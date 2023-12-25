import { Visualizer } from './Visualizer.js'
import { rainbow } from './Bars.js'
import { addGridEvents } from './controls.js'

class Grid extends Visualizer {
    constructor(sound, x, y, width, height, cols, rows) {
        super(sound, x, y, width, height)
        this.cols = cols
        this.rows = rows
        this.length = cols * rows
        this.cellsColors = rainbow(this.length)
    }
    addControlsEvents(html) {
        const container = super.addControlsEvents(html)
        addGridEvents(this, container)
        return container
    }
    draw(screen) {
        super.draw(screen)
    }
    update(timestamp) {
        // get bytes
        const { analyser, buffer } = this
        analyser.getByteFrequencyData(buffer)
        const chunkSize = buffer.length / this.length
        const average = []
        for (let index = 0; index < buffer.length; index += chunkSize) {
            const chunk = buffer.slice(index, index + chunkSize)
            const chunkAvrg = chunk.reduce((sum, num) => sum + num, 0) / chunk.length
            average.push(chunkAvrg)
        }
        this.offscreen.clear()
        // draw grid
        const { context } = this.offscreen
        const weight = 0.125
        const weightHalf = weight / 2
        const availWidth = this.offscreen.width - weight
        const availHeight = this.offscreen.height - weight
        const cellWidth = availWidth / this.cols
        const cellHeight = availHeight / this.rows
        context.save()
        context.translate(cellWidth / 2, cellHeight / 2)
        let index = 0
        for (let col = 0; col < this.cols; col++) {
            const x = Math.floor(col * cellWidth) + weightHalf
            for (let row = 0; row < this.rows; row++) {
                const y = row * cellHeight + weightHalf
                const color = this.cellsColors[index]
                color.alpha = average[index] / 100
                context.fillStyle = color.toString()
                const width = ((average[index] / 255) * cellWidth) / 2
                const height = ((average[index] / 255) * cellHeight) / 2
                //const width = cellWidth / 2
                //const height = cellHeight / 2
                context.fillRect(x + weightHalf, y - weightHalf, -width, height)
                context.fillRect(x + weightHalf, y + weightHalf, -width, -height)
                context.fillRect(x - weightHalf, y + weightHalf, width, -height)
                context.fillRect(x - weightHalf, y - weightHalf, width, height)
                index++
            }
        }
        context.restore()
    }
}

export { Grid }
