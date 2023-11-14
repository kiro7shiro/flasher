import * as fluxfm from './src/flux-fm.js'
import { Sound } from './src/Sound.js'
import { Screen } from './src/Screen.js'
import { Waveform } from './src/visualizers/Waveform.js'
import { Bars } from './src/visualizers/Bars.js'
import { Grid } from './src/visualizers/Grid.js'
import Color from 'https://colorjs.io/dist/color.js'

const channelsList = document.querySelector('#streams')
const currentTrack = document.querySelector('#currentTrack')
const player = document.querySelector('#player')
const visualizer = document.querySelector('#visualizer')

const sound = new Sound()
sound.connect(player)
window.sound = sound

const screen = new Screen(1024, 512)
visualizer.append(screen.canvas)

const waveform = new Waveform(sound, { lineWidth: 10 })
const bars = new Bars(sound, { barsCount: 32 })
const grid = new Grid(sound, 32, 1)

window.components = [waveform, bars, grid]

visualizer.append(grid.controls)

const background = new Color('rgb(64, 64, 64)')
screen.drawBackground(background.toString())


function draw() {
    screen.clear()
    screen.drawBackground(background.toString())
    grid.draw(screen)
    //bars.draw(screen)
    //waveform.draw(screen)
    requestAnimationFrame(draw)
}

async function play(channel) {
    let lastUpdate = 0
    player.addEventListener('timeupdate', async function () {
        const now = Date.now()
        if (now >= lastUpdate + 1500) {
            const trackInfo = await fluxfm.currentTrack(channel)
            currentTrack.innerText = `${trackInfo.artistCredits} - ${trackInfo.title}`
            lastUpdate = now
        }
    })
    localStorage.setItem('lastChannel', channel.displayName)
    player.src = channel.streams[0].url
    player.play()
    draw()
}

async function main() {
    const channels = await fluxfm.channels()
    const lastChannel = localStorage.getItem('lastChannel')
    const result = channels.find(function (channel) {
        return channel.displayName === lastChannel
    })

    const bt = document.createElement('button')
    bt.innerText = result.displayName
    bt.classList.add('w3-button', 'w3-block', 'w3-gray', 'w3-border-bottom')
    channelsList.appendChild(bt)

    await play(result)
}

window.onload = main
