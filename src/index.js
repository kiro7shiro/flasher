// 3840 * 2160
// 1920 * 1080
// 1280 * 720
// 640  * 360
// 320  * 180
// 160  * 90
// 80   * 45

import { Sound } from './Sound.js'
import { getControls } from './visualizers/controls.js'
import { Visualizers } from './visualizers/Visualizers.js'
import Color from 'https://colorjs.io/dist/color.js'

const channelsList = document.querySelector('#channelsList')
const currentTrack = document.querySelector('#currentTrack')
const player = document.querySelector('#player')
const workspace = document.querySelector('#workspace')

const sound = new Sound()
sound.connect(player)

// channels
channelsList.channels = JSON.parse(channelsList.dataset.channels)
channelsList.addEventListener('click', function (event) {
    const [selectedChannel] = channelsList.channels.filter(function (ch) {
        return ch.displayName === event.target.innerText
    })
    async function save() {
        // nasty hack because of json.parse unable to parse '&' character
        selectedChannel.summary = selectedChannel.summary.replace('&', '')
        const resp = await fetch(`./selectedChannel?channel=${JSON.stringify(selectedChannel)}`, { method: 'POST' })
    }
    save()
    player.pause()
    player.src = selectedChannel.streams[1].url
    channelsList.dataset.selectedChannel = selectedChannel.channelId
    player.load()
    player.play()
    const selectedChannelButton = channelsList.querySelector('.selectedChannel')
    selectedChannelButton.classList.remove('selectedChannel')
    event.target.classList.add('selectedChannel')
})
const selectedChannelButton = channelsList.querySelector('.selectedChannel')
selectedChannelButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

// player
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

async function main() {
    const background = new Color('#272727')

    const fft = new Visualizers.FFT(sound, 256, 128, 0, 0)
    fft.connect(sound)
    fft.screen.drawBackground(background.toString())
    workspace.append(fft.screen.container)

    const stft = new Visualizers.STFT(sound, 512, 256, 0, 128, { fftSize: 1024, timeframe: 125 })
    stft.connect(sound)
    stft.screen.drawBackground(background.toString())
    workspace.append(stft.screen.container)

    const meter = new Visualizers.Meter(sound, 256, 128, 512, 0)
    meter.connect(sound)
    meter.screen.drawBackground(background.toString())
    workspace.append(meter.screen.container)

    const wave = new Visualizers.Waveform(sound, 256, 128, 256, 0, { fftSize: 64 })
    wave.connect(sound)
    wave.screen.drawBackground(background.toString())
    workspace.append(wave.screen.container)

    window.wave = wave

    function start() {
        const queue = [stft, meter, wave, fft]
        queue.forEach((visualizer) => {
            if (!visualizer.handle) {
                visualizer.draw()
            }
        })
    }
    start()

    player.play()
}

// startup
main().catch(function (err) {
    console.error(err)
})
