// 3840 * 2160
// 1920 * 1080
// 1280 * 720
// 640  * 360
// 320  * 180
// 160  * 90
// 80   * 45

import { Sound } from './Sound.js'
import { Screen } from './Screen.js'
import { getControls } from './visualizers/controls.js'
import { Visualizers } from './visualizers/Visualizers.js'
import Color from 'https://colorjs.io/dist/color.js'

const channelsList = document.querySelector('#channelsList')
const currentTrack = document.querySelector('#currentTrack')
const player = document.querySelector('#player')
const workspace = document.querySelector('#workspace')

channelsList.channels = JSON.parse(channelsList.dataset.channels)
channelsList.addEventListener('click', function (event) {
    console.log(event.target.innerText)
    const [selectedChannel] = channelsList.channels.filter(function (ch) {
        return ch.displayName === event.target.innerText
    })
    console.log(selectedChannel)
    player.pause()
    player.src = selectedChannel.streams[1].url
    channelsList.dataset.selectedChannel = selectedChannel.channelId
    player.load()
    player.play()
})

async function main() {
    const sound = new Sound()
    sound.connect(player)

    const background = new Color('#1b1b1b')

    const fft = new Visualizers.FFT(sound, 256, 128, 0, 0)
    fft.connect(sound)
    fft.screen.drawBackground(background.toString())
    workspace.append(fft.screen.container)

    const stft = new Visualizers.STFT(sound, 512, 256, 0, 128, { fftSize: 1024, timeframe: 125 })
    stft.connect(sound)
    stft.screen.drawBackground(background.toString())
    workspace.append(stft.screen.container)

    window.stft = stft

    const meter = new Visualizers.Meter(sound, 256, 128, 256, 0)
    meter.connect(sound)
    meter.screen.drawBackground(background.toString())
    workspace.append(meter.screen.container)

    const wave = new Visualizers.Waveform(sound, 256, 128, 512, 0)
    wave.connect(sound)
    wave.screen.drawBackground(background.toString())
    workspace.append(wave.screen.container)

    const queue = [stft, meter, wave, fft]
    let lastDraw = 0
    function draw(timestamp) {
        let delta = timestamp - lastDraw
        while (delta > 0 && queue.length) {
            const visualizer = queue.shift()
            let duration = visualizer.update(timestamp)
            duration += visualizer.draw(timestamp)
            delta -= duration
        }
        queue.push(stft)
        queue.push(meter)
        queue.push(wave)
        queue.push(fft)
        lastDraw = timestamp
        requestAnimationFrame(draw)
    }

    let requesting = false
    let lastRequest = 0
    player.addEventListener('timeupdate', async function (event) {
        if (event.timeStamp >= lastRequest + 2000 && !requesting) {
            requesting = true
            const resp = await fetch(`./currentTrack?channelId=${channelsList.dataset.selectedChannel}`)
            const trackInfo = await resp.json()
            currentTrack.innerText = `${trackInfo.title} - ${trackInfo.artistCredits}`
            lastRequest = event.timeStamp
            requesting = false
        }
    })
    player.addEventListener('play', draw)
    player.play()
}

// startup
main().catch(function (err) {
    console.error(err)
})
