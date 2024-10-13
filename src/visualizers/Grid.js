import { mapNumToRange } from '../math.js'
import { Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as nodes from '../nodes/nodes.js'

const timerDebugTemplate = '<div>fps: <%= frames %></div>'
const pi2 = Math.PI * 2

class Grid {
    constructor(source, { sound, width, height, rows, cols, fftSize = 256, smoothingTimeConstant = 0.5 }) {
        //
        if (!sound) throw new Error('A sound instance must be given.')
        if (width === null && width === undefined) throw new Error('Width must be given.')
        if (height === null && height === undefined) throw new Error('Height must be given.')
        if (rows === null && rows === undefined) throw new Error('Rows must be given.')
        if (cols === null && cols === undefined) throw new Error('Cols must be given.')
        //
        this.control = new Control(source)
        this.element = this.control.element
        //
        this.analyzer = sound.createAnalyzer({ fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyzer.frequencyBinCount)
        this.audioGraph = []
        this.analyzer.minDecibels = -80
        this.analyzer.maxDecibels = -30
        this.analyzer.smoothingTimeConstant = 0.33
        //
        nodes.AnalyserNode(this)
        //
        this.screen = new Screen(width, height)
        this.alphaLayer = new Screen(width, height)
        this.rows = rows
        this.cols = cols
        this.size = this.rows * this.cols
        this.alphaLevels = Math.max(100 / (this.size / 32), 16)
        this.cellsWidth = width / this.cols
        this.cellsHeight = height / this.rows
        this.cellsWHalf = this.cellsWidth / 2
        this.cellsHHalf = this.cellsHeight / 2
        this.cellsMinRadius = Math.min(this.cellsHHalf, this.cellsWHalf)
        this.cells = new Array(this.size)
        this.decision = this.buffer.length / this.cells.length
        this.chunkSize = Math.max(this.buffer.length, this.cells.length) / Math.min(this.buffer.length, this.cells.length)

        //this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => index)
        //this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => this.cells.length - index - 1)
        this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => {
            return index % 2 === 0 ? index : this.cells.length - index
        })
        
        const startColor = new Color('hsl', [0, 100, 50])
        const endColor = new Color('hsl', [270, 100, 50])
        this.colors = startColor.steps(endColor, {
            space: 'hsl',
            hue: 'increasing',
            outputSpace: 'srgb',
            steps: this.size,
            maxSteps: this.size
        })
        startColor.hsl.l = 62.5
        endColor.hsl.l = 62.5
        this.colorsHigh = startColor.steps(endColor, {
            space: 'hsl',
            hue: 'increasing',
            outputSpace: 'srgb',
            steps: this.size,
            maxSteps: this.size
        })
        // preset cells
        let cnt = 0
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.cells[cnt] = {
                    x: c * this.cellsWidth + this.cellsWHalf,
                    y: r * this.cellsHeight + this.cellsHHalf,
                    color: this.colors[cnt],
                    highColor: this.colorsHigh[cnt],
                    alpha: 0,
                    gradients: new Array(this.alphaLevels)
                }
                cnt++
            }
        }
        const { alphaLayer, alphaLevels } = this
        for (let cnt = 0; cnt < this.cells.length; cnt++) {
            const cell = this.cells[cnt]
            const { x, y, highColor, color } = cell
            for (let aCnt = 0; aCnt < alphaLevels; aCnt++) {
                const alpha = aCnt / alphaLevels
                color.alpha = alpha
                highColor.alpha = alpha
                const gradient = alphaLayer.context.createRadialGradient(x, y, 0, x, y, this.cellsMinRadius)
                gradient.addColorStop(0, highColor)
                gradient.addColorStop(0.2, color)
                gradient.addColorStop(0.6, color)
                gradient.addColorStop(1, '#141617')
                cell.gradients[aCnt] = gradient
            }
        }
        //
        const { control, element } = this
        const nodesContainer = element.querySelector('#nodes-container')
        nodesContainer.style.display = 'none'
        control.on('toggle-controls', function () {
            if (nodesContainer.style.display === 'none') {
                nodesContainer.style.display = 'block'
            } else {
                nodesContainer.style.display = 'none'
            }
        })
        //
        const screenContainer = this.element.querySelector('#screen-container')
        screenContainer.append(this.screen.container)
        //
        this.timer = {
            delta: 0,
            frames: 0,
            fps: 60,
            last: 0
        }
    }
    draw(timestamp) {
        const { cells, cellsMinRadius, timer, screen, alphaLevels } = this
        this.update()
        screen.clear()
        cells.map(function (cell) {
            const { x, y, alpha } = cell
            if (alpha < 0.15) return
            const index = parseInt(alphaLevels * alpha) - 1
            const radius = parseInt(cellsMinRadius * alpha)
            screen.context.fillStyle = cell.gradients[index]
            screen.context.beginPath()
            screen.context.arc(x, y, radius, 0, pi2)
            screen.context.fill()
        })
        if (timestamp > timer.last + 1000) {
            //screen.debug(ejs.render(timerDebugTemplate, timer))
            timer.last = performance.now()
            timer.fps = timer.frames
            timer.frames = 0
        }
        timer.frames++
        this.handle = requestAnimationFrame(this.draw.bind(this))
        return this.handle
    }
    update() {
        const { analyzer: analyser, buffer, cells, cellsMap, decision, chunkSize } = this
        analyser.getByteFrequencyData(buffer)
        if (decision >= 1) {
            // grid is shorter than buffer or has equal length
            cells.map(function (cell, index) {
                const mIndex = cellsMap[index]
                const bCnt = Math.floor(mIndex * decision)
                const chunk = buffer.slice(bCnt, bCnt + chunkSize)
                const average =
                    chunk.reduce(function (sum, num) {
                        return sum + num
                    }, 0) / chunk.length
                cell.alpha = average / 255
            })
        } else {
            // buffer is shorter than grid
            buffer.map(function (value, index) {
                const alpha = value / 255
                const cIndex = index * chunkSize
                const chunk = cellsMap.slice(cIndex, cIndex + chunkSize)
                chunk.map(i => cells[i].alpha = alpha)
            })
        }
    }
}

export { Grid }