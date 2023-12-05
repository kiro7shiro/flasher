import { Sound } from './Sound.js'
import { Screen } from './Screen.js'
import { getControls } from './visualizers/controls.js'
import { Waveform } from './visualizers/Waveform.js'
import { Bars } from './visualizers/Bars.js'
import { Grid } from './visualizers/Grid.js'
import Color from 'https://colorjs.io/dist/color.js'

const channelsList = document.querySelector('#channels')
const currentTrack = document.querySelector('#currentTrack')
const player = document.querySelector('#player')
const visualizer = document.querySelector('#visualizer')

async function main() {
    const sound = new Sound()
    sound.connect(player)

    const screen = new Screen(512, 256)
    visualizer.append(screen.canvas)

    const highpass = sound.createBiquadFilter('highpass', { frequency: 11000, gain: 40 })
    const lowpass = sound.createBiquadFilter('lowpass', { frequency: 11000, gain: 40 })

    const grid = new Grid(sound, 16, 8)
    grid.audioGraph.push(lowpass)
    grid.audioGraph.push(highpass)
    grid.connect(sound)

    grid.addBand({
        template: '0123', // alternately [0, 1, 2, 3]
        from: 1, // minimum midi note to watch
        to: 160, // maximum midi note, up to 160
        low: 1, // Low velocity/power threshold
        high: 128, // High velocity/power threshold
        smooth: [0.1, 0.1, 0.1, 0.1], // Exponential smoothing factors for the values
        adapt: [1, 1, 1, 1], // Adaptive bounds setup
        snap: 0.33
    })

    /* const wave = new Waveform(sound)
    wave.audioGraph.push(lowpass)
    wave.connect(sound) */

    /* const bars = new Bars(sound)
    bars.audioGraph.push(highpass)
    bars.connect(sound) */

    const gridControls = await getControls(grid)
    visualizer.append(gridControls)

    /* const waveControls = await getControls(wave)
    visualizer.append(waveControls) */

    /* const barsControls = await getControls(bars)
    visualizer.append(barsControls) */

    const background = new Color('rgb(32, 32, 32)')
    screen.drawBackground(background.toString())

    function draw() {
        screen.clear()
        screen.drawBackground(background.toString())
        //bars.draw(screen)
        grid.draw(screen)
        //wave.draw(screen)
        requestAnimationFrame(draw)
    }

    let last = 0
    player.addEventListener('timeupdate', async function (event) {
        if (event.timeStamp >= last + 1000) {
            const resp = await fetch(`./currentTrack?channelId=${channelsList.dataset.selectedChannel}`)
            const trackInfo = await resp.json()
            currentTrack.innerText = `${trackInfo.title} - ${trackInfo.artistCredits}`
            last = event.timeStamp
        }
    })
    player.addEventListener('play', draw)
    player.play()

    window.grid = grid
}

// startup
main().catch(function (err) {
    console.error(err)
})
