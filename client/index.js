// DONE : CRUD operations for viualizers
//  - create: addVisualizer
//  - read/ update: controls
//  - delete: deleteVisualizer
// TODO : app controls : menu
//  - better menu
//  - visual update
// TODO : show source informations

// 3840 * 2160
// 1920 * 1080
// 1280 * 720
// 640  * 360
// 320  * 180
// 160  * 90
// 80   * 45

import { Sound } from '../src/Sound.js'
import { getControls } from '../src/visualizers/controls.js'
import { Visualizers } from '../src/visualizers/Visualizers.js'

const channelsList = document.querySelector('#channelsList')
const currentTrack = document.querySelector('#currentTrack')
const trackImage = document.querySelector('#trackImage')
const player = document.querySelector('#player')
const workspace = (window.workspace = document.querySelector('#workspace'))
const controls = document.querySelector('#controls')

// channels
channelsList.channels = JSON.parse(channelsList.dataset.channels)
channelsList.addEventListener('click', function (event) {
    // find newly selected channel
    const [selectedChannel] = channelsList.channels.filter(function (channel) {
        return channel.displayName === event.target.innerText
    })
    // send channelId to server for saving
    async function save() {
        const response = await fetch(`./selectedChannel?channelId=${selectedChannel.channelId}`, { method: 'POST' })
        return response
    }
    channelsList.dataset.selectedChannel = selectedChannel.channelId
    save()
    // play new stream
    // TODO : add error handler for edge cases like the 90s channel
    player.pause()
    player.src = selectedChannel.streams[1].url
    player.load()
    player.play()
    // update buttons
    const selectedChannelButton = channelsList.querySelector('.selectedChannel')
    selectedChannelButton.classList.remove('selectedChannel')
    event.target.classList.add('selectedChannel')
    event.target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
})
const selectedChannelButton = channelsList.querySelector('.selectedChannel')
selectedChannelButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

// player
let requesting = false
let lastRequest = 0
player.addEventListener('timeupdate', async function (event) {
    if (event.timeStamp >= lastRequest + 2000 && !requesting) {
        requesting = true
        const response = await fetch(`./currentTrack?channelId=${channelsList.dataset.selectedChannel}`)
        if (response.status === 200) {
            const trackInfo = await response.json()
            const { artwork } = trackInfo
            if (artwork) {
                trackImage.src = artwork
            } else {
                trackImage.src = ''
            }
            currentTrack.innerText = `${trackInfo.artistCredits} - ${trackInfo.title}`
            lastRequest = event.timeStamp
        } else {
            console.log(response)
        }
        requesting = false
    }
})

// app
const app = (window.app = {
    sound: new Sound(),
    async addNode(identifier, options = {}) {
        const constructor = window[identifier]
        if (!constructor) throw new Error(`${identifier} not defined.`)
        const node = new constructor(app.sound.context, options)
        node.controls = await getControls(node)
        const visualizer = workspace.visualizers[workspace.dataset.selectedVisualizer]
        visualizer.controls.append(node.controls)
        player.pause()
        app.disconnect()
        visualizer.audioGraph.push(node)
        app.connect()
        player.play()
        return node
    },
    async addVisualizer(name, { width = 256, height = 128, left = 0, top = 0, fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        if (!Visualizers[name]) throw new Error(`Class ${name} not implemented.`)
        const visualizer = new Visualizers[name](app.sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        visualizer.controls = await getControls(visualizer)
        visualizer.connect()
        visualizer.draw()
        workspace.addVisualizer(visualizer)
        return visualizer
    },
    connect() {
        app.sound.connect(player)
        for (const key in workspace.visualizers) {
            const visualizer = workspace.visualizers[key]
            visualizer.connect()
            visualizer.draw()
        }
    },
    disconnect() {
        app.sound.disconnect()
        for (const key in workspace.visualizers) {
            const visualizer = workspace.visualizers[key]
            visualizer.stop()
            visualizer.disconnect()
        }
    },
    showControls(identifier) {
        controls.textContent = ''
        controls.append(workspace.visualizers[identifier].controls)
    },
    setup() {
        // connect
        app.sound.connect(player)
        // setup event handlers
        const menu = document.getElementById('menu')
        menu.addEventListener('click', function (event) {
            if (event.target.hasAttribute('data-action')) {
                const { action } = event.target.dataset
                const [name, type, identifier] = action.split('-')
                //console.log(name, type, identifier)
                switch (name) {
                    case 'add':
                        if (type === 'visualizer') {
                            app.addVisualizer(identifier)
                        } else {
                            app.addNode(identifier, { type: 'highpass', frequency: 11200 })
                        }
                        break
                    case 'del':
                        // delete selected visualizer
                        workspace.removeVisualizer(workspace.dataset.selectedVisualizer)
                        break
                }
            }
        })
        workspace.addEventListener('click', function (event) {
            if (event.target.hasAttribute('data-action')) {
                const { action } = event.target.dataset
                const [name, type, identifier] = action.split('-')
                //console.log(name, type, identifier)
                switch (name) {
                    case 'click':
                        app.showControls(identifier)
                        workspace.selectVisualizer(identifier)
                        break
                }
            }
        })
    }
})

// workspace
workspace.dataset.selectedVisualizer = ''
workspace.visualizers = {}
workspace.nextId = 0
workspace.addVisualizer = function (visualizer) {
    const id = `click-visualizer-${workspace.nextId}`
    visualizer.screen.container.addEventListener('click', function (event) {
        event.target.dataset.action = id
    })
    workspace.visualizers[workspace.nextId] = visualizer
    workspace.append(visualizer.screen.container)
    workspace.nextId++
}
workspace.removeVisualizer = function (identifier) {
    const visualizer = workspace.visualizers[identifier]
    visualizer.stop()
    workspace.removeChild(visualizer.screen.container)
    delete workspace.visualizers[identifier]
}
workspace.selectVisualizer = function (identifier) {
    const selectedVisualizer = workspace.visualizers[workspace.dataset.selectedVisualizer]
    if (selectedVisualizer) selectedVisualizer.screen.container.classList.remove('selectedVisualizer')
    workspace.visualizers[identifier].screen.container.classList.add('selectedVisualizer')
    workspace.dataset.selectedVisualizer = identifier
}

async function main() {
    app.setup()
    await app.addVisualizer('STFT', { width: 512, height: 256, fftSize: 1024 })
    await app.addVisualizer('FFT', { top: 256 })
    await app.addVisualizer('Meter', { left: 256, top: 256 })
    app.showControls(0)
    workspace.selectVisualizer(0)
    player.play()
}

// startup
main().catch(function (err) {
    console.error(err)
})
