import { Sound } from './Sound.js'
import { Screen } from './Screen.js'
import { getControls } from './visualizers/controls.js'
import { Visualizers } from './visualizers/Visualizers.js'
import Color from 'https://colorjs.io/dist/color.js'

const channelsList = document.querySelector('#channels')
const currentTrack = document.querySelector('#currentTrack')
const player = document.querySelector('#player')
const visualizers = document.querySelector('#visualizers')
const controls = document.querySelector('#controls')

async function main() {
    const sound = new Sound()
    sound.connect(player)

    const screen1 = new Screen(512, 256)
    const screen2 = new Screen(512, 256)
    visualizers.append(screen1.canvas)
    visualizers.append(screen2.canvas)

    const highpass = sound.createBiquadFilter('highpass', { frequency: 11000, gain: 40 })
    const lowpass = sound.createBiquadFilter('lowpass', { frequency: 11000, gain: 40 })

    const grid = new Visualizers.Grid(sound, 256, 0, 256, 128, 16, 8)
    grid.audioGraph.push(lowpass)
    grid.audioGraph.push(highpass)
    grid.connect(sound)

    const wave = new Visualizers.Waveform(sound, 0, 128, 256, 128)
    wave.connect(sound)

    const bars = new Visualizers.Bars(sound, 256, 0, 256, 128)
    bars.connect(sound)

    const delay = sound.context.createDelay(1)

    const tool = new Visualizers.ClubberTool(sound, 0, 0, 256, 128)
    tool.audioGraph.push(delay)
    tool.addBand({
        template: '0123', // alternately [0, 1, 2, 3]
        from: 4, // minimum midi note to watch
        to: 6, // maximum midi note, up to 160
        low: 32, // Low velocity/power threshold
        high: 192, // High velocity/power threshold
        smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for the values
        adapt: [0.25, 0.33, 0.25, 0.33], // Adaptive bounds setup
        snap: 0.33
    })
    tool.addBand({
        template: '0123', // alternately [0, 1, 2, 3]
        from: 46, // minimum midi note to watch
        to: 48, // maximum midi note, up to 160
        low: 16, // Low velocity/power threshold
        high: 192, // High velocity/power threshold
        smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for the values
        adapt: [0.25, 0.33, 0.25, 0.33], // Adaptive bounds setup
        snap: 0.33
    })
    tool.addBand({
        template: '0123', // alternately [0, 1, 2, 3]
        from: 84, // minimum midi note to watch
        to: 86, // maximum midi note, up to 160
        low: 16, // Low velocity/power threshold
        high: 192, // High velocity/power threshold
        smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for the values
        adapt: [0.25, 0.33, 0.25, 0.33], // Adaptive bounds setup
        snap: 0.33
    })
    tool.connect(sound)

    const fft = new Visualizers.FFT(sound, 0, 0, 256, 128)
    fft.connect(sound)

    const stft = new Visualizers.STFT(sound, 256, 0, 256, 128)
    stft.connect(sound)

    const meter = new Visualizers.Meter(sound, 256, 128, 256, 128)
    meter.connect(sound)

    const toolControls = await getControls(tool)
    controls.append(toolControls)

    const gridControls = await getControls(grid)
    controls.append(gridControls)

    /* const waveControls = await getControls(wave)
    visualizer.append(waveControls) */

    /* const barsControls = await getControls(bars)
    visualizer.append(barsControls) */

    const background = new Color('rgb(32, 32, 32)')
    screen1.drawBackground(background.toString())

    const queue = [wave, fft, stft, meter]
    let lastDraw = 0
    function draw(timestamp) {
        screen1.clear()
        screen1.drawBackground(background.toString())
        /* screen2.clear()
        screen2.drawBackground(background.toString()) */

        let delta = timestamp - lastDraw
        while(delta && queue.length) {
            const vis = queue.shift()
            vis.update(timestamp)
            vis.draw(screen1)
            delta -= 1000 / 60
        }
       
        queue.push(wave)
        queue.push(fft)
        queue.push(stft)
        queue.push(meter)
        lastDraw = timestamp
        requestAnimationFrame(draw)
    }

    let requesting = false
    let last = 0
    player.addEventListener('timeupdate', async function (event) {
        if (event.timeStamp >= last + 2000 && !requesting) {
            requesting = true
            const resp = await fetch(`./currentTrack?channelId=${channelsList.dataset.selectedChannel}`)
            const trackInfo = await resp.json()
            currentTrack.innerText = `${trackInfo.title} - ${trackInfo.artistCredits}`
            last = event.timeStamp
            requesting = false
        }
    })
    player.addEventListener('play', draw)
    player.play()

    window.grid = grid
    window.tool = tool
    window.stft = stft
}

// startup
main().catch(function (err) {
    console.error(err)
})
