import { Visualizer } from './Visualizer.js'

class LedMatrix4x8 extends Visualizer {
    constructor(sound, width, height, left, top, { fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        super(sound, width, height, left, top, { fftSize, smoothingTimeConstant })        
        
    }
    draw(timestamp) {
        
    }
    update() {}
}

export { LedMatrix4x8 }
