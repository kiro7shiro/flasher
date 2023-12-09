import { Visualizer } from './Visualizer.js'

class Analyser extends Visualizer {
    constructor(sound, x, y, width, height) {
        super(sound, x, y, width, height)
        this.fftChart = null
        this.stftChart = null

    }
    draw(screen) {
        super.draw(screen)
    }
}

export { Analyser }