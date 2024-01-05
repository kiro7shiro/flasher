import { Bars } from './Bars.js'
import { ClubberTool } from './ClubberTool.js'
import { FFT } from './FFT.js'
import { Grid } from './Grid.js'
import { Meter } from './Meter.js'
import { STFT } from './STFT.js'
import { Waveform } from './Waveform.js'

class Visualizers {
    static Bars = Bars
    static ClubberTool = ClubberTool
    static FFT = FFT
    static Grid = Grid
    static Meter = Meter
    static STFT = STFT
    static Waveform = Waveform
    static mapNumRange = function (num, inMin, inMax, outMin, outMax) {
        return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
    }
}

export { Visualizers }
