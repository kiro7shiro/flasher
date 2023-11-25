import * as fluxfm from './src/flux-fm.js'
import { Sound } from './src/Sound.js'
import { Screen } from './src/Screen.js'
import { Waveform } from './src/visualizers/Waveform.js'
import { Bars } from './src/visualizers/Bars.js'
import { Grid } from './src/visualizers/Grid.js'
import Color from 'https://colorjs.io/dist/color.js'
import { preload } from './src/visualizers/controls/controls.js'

const channelsList = document.querySelector('#streams')
const currentTrack = document.querySelector('#currentTrack')
const player = document.querySelector('#player')
const visualizer = document.querySelector('#visualizer')

const sound = new Sound()
sound.connect(player)

const screen = new Screen(512, 256)
visualizer.append(screen.canvas)

const lowpass = sound.createBiquadFilter('lowpass', { frequency: 22000, gain: 40 })
const highpass = sound.createBiquadFilter('highpass', { frequency: 11000, gain: 40 })

const waveform = new Waveform(sound, { lineWidth: 10 })
const bars = new Bars(sound, { barsCount: 32 })
const grid = new Grid(sound, 128, 1)

//grid.audioGraph.push(lowpass)
grid.audioGraph.push(highpass)
grid.connect(sound)

visualizer.append(grid.controls)

const background = new Color('rgb(32, 32, 32)')
screen.drawBackground(background.toString())

function draw() {
    screen.clear()
    screen.drawBackground(background.toString())
    grid.draw(screen)
    //bars.draw(screen)
    //waveform.draw(screen)
    requestAnimationFrame(draw)
}

function play(channel) {
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

async function setup() {}

async function main() {
    await preload()

    const channels = await fluxfm.channels()
    const lastChannel = localStorage.getItem('lastChannel')
    const result = channels.find(function (channel) {
        return channel.displayName === lastChannel
    })

    const bt = document.createElement('button')
    bt.innerText = result.displayName
    bt.classList.add('w3-button', 'w3-block', 'w3-gray', 'w3-border-bottom')
    channelsList.appendChild(bt)

    play(result)
}

window.onload = main