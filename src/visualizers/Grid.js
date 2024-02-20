import { Control } from '../Control.js'
import { Screen } from './Screen.js'
import * as nodes from '../nodes/index.js'

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
        this.analyser = sound.createAnalyzer({ fftSize, smoothingTimeConstant })
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount)
        this.audioGraph = []
        this.analyser.minDecibels = -80
        this.analyser.maxDecibels = -30
        this.analyser.smoothingTimeConstant = 0.33
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
        this.cells = new Array(this.rows * this.cols)
        //this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => index)
        //this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => this.cells.length - index - 1)
        this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => {
            if (index % 2 === 0) {
                return index
            } else {
                return this.cells.length - index
            }
            
        })
        /* let pCnt = 0
        const step = 2
        this.cellsMap = new Array(this.cells.length).fill(0).map((_, index) => {
            if (index % step === 0) {
                pCnt = index
            }
            return pCnt
        }) */
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
        this.chunkSize = this.buffer.length / this.colors.length
        this.chunkLength = this.colors.length / this.buffer.length
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
        const { analyser, buffer, cells, cellsMap, chunkLength, chunkSize } = this
        analyser.getByteFrequencyData(buffer)
        // adapt buffer to the length of grid size
        if (chunkSize > 1) {
            // buffer is larger than grid size
            // calculate an average for frequency bins
            cells.map(function (cell, index) {
                const mIndex = cellsMap[index]
                const bCnt = parseInt(mIndex * chunkSize)
                const chunk = buffer.slice(bCnt, bCnt + chunkSize)
                const average =
                    chunk.reduce(function (sum, num) {
                        return sum + num
                    }, 0) / chunk.length
                cell.alpha = average / 255
            })
        } else {
            // FIX : avoid this situation by choosing a larger buffer if possible
            //       or throw an error if not.
            // buffer has equal length or is shorter than grid size
            buffer.map(function (value, index) {
                const alpha = value / 255
                const cIndex = parseInt(index * chunkLength)
                const mIndex = cellsMap[cIndex]
                const chunk = cells.slice(mIndex, mIndex + chunkLength)
                chunk.map(function (cell) {
                    return (cell.alpha = alpha)
                })
            })
        }
    }
}

export { Grid }
