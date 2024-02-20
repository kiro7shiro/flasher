// DONE : CRUD operations for viualizers
//  - create: addVisualizer
//  - read/ update: controls
//  - delete: deleteVisualizer
// TODO : app controls : menu
//  - add options for audio nodes and visualizers
//      - color, background, size
//  - visual update, make the page more appealing
// TODO : show source informations

// 3840 * 2160
// 1920 * 1080
// 1280 * 720
// 640  * 360
// 320  * 180
// 160  * 90
// 80   * 45

/* import { addEvents } from '../src/controls/events.js' */

import { Sound } from '../src/Sound.js'
import { Visualizers } from '../src/visualizers/Visualizers.js'
import { getControls } from '../src/visualizers/controls.js'
import { ChannelsList } from '../src/controls/ChannelsList.js'
import { Player } from '../src/controls/Player.js'
import { Workspace } from '../src/controls/Workspace.js'

const sound = new Sound()

const app = {
    async addNode(identifier, options = {}) {
        // construct node
        const constructor = window[identifier]
        if (!constructor) throw new Error(`${identifier} not defined.`)
        const node = new constructor(sound.context, options)
        // get node controls
        node.controls = await getControls(node, options)
        const visualizer = workspace.visualizers[workspace.selectedVisualizer]
        visualizer.controls.querySelector('.controlsList').append(node.controls)
        // update audio graph
        player.pause()
        app.disconnect()
        visualizer.audioGraph.push(node)
        app.connect()
        player.play()
        return node
    },
    async addVisualizer(className, { width = 256, height = 128, left = 0, top = 0, fftSize = 256, smoothingTimeConstant = 0.5 } = {}) {
        const constructor = Visualizers[className]
        if (!constructor) throw new Error(`Class ${className} not implemented.`)
        const visualizer = new constructor(sound, width, height, left, top, { fftSize, smoothingTimeConstant })
        visualizer.controls = await getControls(visualizer)
        visualizer.connect()
        visualizer.draw()
        return visualizer
    },
    connect() {
        sound.connect(player.source)
        for (const key in workspace.visualizers) {
            const visualizer = workspace.visualizers[key]
            visualizer.connect()
            visualizer.draw()
        }
    },
    disconnect() {
        sound.disconnect()
        for (const key in workspace.visualizers) {
            const visualizer = workspace.visualizers[key]
            visualizer.stop()
            visualizer.disconnect()
        }
    },
    async showAddNode(identifier) {
        const resp = await fetch(`./controls/addNode?identifier=${identifier}`)
        const html = await resp.text()
        //document.body.firstElementChild.insertAdjacentHTML('afterend', html)
        workspace.element.insertAdjacentHTML('beforeend', html)
        const addNode = workspace.element.querySelector('.addNode')
        addEvents(addNode, identifier)
        addNode.addEventListener('add', function (event) {
            app.addNode(identifier, event.detail)
        })
    }
}

const channelsList = new ChannelsList(document.querySelector('#channelsList'))
channelsList.on('select', function (event) {
    channelsList.selectedChannel = event.detail.channelId
    console.log(channelsList.selectedChannel)
})

const player = new Player(document.querySelector('#player'))
sound.connect(player.source)
player.on('timeupdate', async function (event) {
    if (event.timeStamp >= player.lastRequest + 2000 && !player.requesting) {
        player.requesting = true
        const response = await fetch(`./currentTrack?channelId=${channelsList.selectedChannel}`)
        if (response.status === 200) {
            const trackInfo = await response.json()
            const { artwork } = trackInfo
            if (artwork) {
                player.trackImage.src = artwork
            } else {
                player.trackImage.src = 'views/images/no-image-64.png'
            }
            player.currentTrack.innerText = `${trackInfo.artistCredits} - ${trackInfo.title}`
            player.lastRequest = event.timeStamp
        } else {
            console.log(response)
        }
        player.requesting = false
    }
})

const workspace = new Workspace(document.querySelector('#workspaceSection'))
workspace.on('add-visualizer', async function (event) {
    const { detail: className } = event
    const visualizer = await app.addVisualizer(className)
    workspace.addVisualizer(visualizer)
    const id = workspace.visualizersNextId - 1
    workspace.selectVisualizer(id)
    workspace.showControls(id)
})
workspace.on('select-visualizer', function (event) {
    const { detail: id } = event
    workspace.selectVisualizer(id)
    workspace.showControls(id)
})
workspace.on('del-visualizer', function () {
    const visualizer = workspace.visualizers[workspace.selectedVisualizer]
    workspace.delVisualizer(visualizer)
    workspace.clearControls()
    delete workspace.visualizers[workspace.selectedVisualizer]
})
workspace.on('add-node', function (event) {
    console.log(event)
})
workspace.on('del-node', async function (event) {
    const { detail: className } = event
    await app.addNode(className, {})
    console.log(event)
})

// TODO : make own classes for the app related objects

// app
//  - source
//  - sound
//const channelsList = document.querySelector('#channelsList')
//  - player
/* const currentTrack = document.querySelector('#currentTrack')
const trackImage = document.querySelector('#trackImage')
const player = document.querySelector('#player') */
//  - workspace
//      - menu
//      - controls
/* const workspace = (window.workspace = document.querySelector('#workspace'))
const controls = document.querySelector('#controls') */

// channels

//channelsList.channels = JSON.parse(channelsList.dataset.channels)
/* channelsList.addEventListener('click', function (event) {
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
}) */
/* const selectedChannelButton = channelsList.querySelector('.selectedChannel')
selectedChannelButton.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }) */

// player
/* let requesting = false
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
}) */

// workspace
/* workspace.dataset.selectedVisualizer = ''
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
workspace.showControls = function (identifier) {
    controls.textContent = ''
    controls.append(workspace.visualizers[identifier].controls)
}

// controls
controls.dataset.selectedNode = ''
controls.selectNode = function (identifier) {
    const selectedVisualizer = workspace.visualizers[workspace.dataset.selectedVisualizer]
    const selectedNode = selectedVisualizer.controls.querySelector('.selectedNode')
    if (selectedNode) selectedNode.classList.remove('selectedNode')
    const control = selectedVisualizer.controls.querySelector(`#${identifier}`)
    control.classList.add('selectedNode')
    controls.dataset.selectedNode = identifier
} */

// app
const app2 = (window.app2 = {
    //sound: new Sound(),
    async addNode(identifier, options = {}) {
        // construct node
        const constructor = window[identifier]
        if (!constructor) throw new Error(`${identifier} not defined.`)
        const node = new constructor(app.sound.context, options)
        // get node controls
        node.controls = await getControls(node, options)
        const visualizer = workspace.visualizers[workspace.dataset.selectedVisualizer]
        visualizer.controls.querySelector('.controlsList').append(node.controls)
        // update audio graph
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
    deleteNode(identifier) {
        // remove control
        const visualizer = workspace.visualizers[workspace.dataset.selectedVisualizer]
        const control = visualizer.controls.querySelector(`#${identifier}`)
        visualizer.controls.querySelector('.controlsList').removeChild(control)
        // update audio graph
        const extractor = /([a-z]*)([0-9]*)/i
        const [match, className, count] = extractor.exec(identifier)
        console.log(className, count)
        let counter = 0
        const index = visualizer.audioGraph.reduce(function (accu, curr, index) {
            console.log(curr.constructor.name, className)
            if (curr.constructor.name === className) {
                counter++
                if (counter === parseInt(count)) return index
            }
            return accu
        }, -1)
        console.log(index)

        /* player.pause()
        app.disconnect()
        visualizer.audioGraph.splice(index, 1)
        app.connect()
        player.play() */
    },
    disconnect() {
        app.sound.disconnect()
        for (const key in workspace.visualizers) {
            const visualizer = workspace.visualizers[key]
            visualizer.stop()
            visualizer.disconnect()
        }
    },
    async showAddNode(identifier) {
        const resp = await fetch(`./controls/addNode?identifier=${identifier}`)
        const html = await resp.text()
        //document.body.firstElementChild.insertAdjacentHTML('afterend', html)
        workspace.insertAdjacentHTML('beforeend', html)
        const addNode = workspace.querySelector('.addNode')
        addEvents(addNode, identifier)
        addNode.addEventListener('add', function (event) {
            app.addNode(identifier, event.detail)
        })
    },
    async setup() {
        // connect
        app.sound.connect(player)
        // setup event handlers
        const menu = document.getElementById('menu')
        menu.addEventListener('click', function (event) {
            if (event.target.hasAttribute('data-action')) {
                event.preventDefault()
                const { action } = event.target.dataset
                const [name, type, identifier] = action.split('-')
                //console.log(name, type, identifier)
                switch (name) {
                    case 'add':
                        if (type === 'visualizer') app.addVisualizer(identifier)
                        if (type === 'node') app.showAddNode(identifier)
                        break
                    case 'del':
                        // delete selected visualizer
                        if (type === 'visualizer') workspace.removeVisualizer(workspace.dataset.selectedVisualizer)
                        if (type === 'node') {
                            app.deleteNode(controls.dataset.selectedNode)
                        }
                        break
                }
            }
        })
        workspace.addEventListener('click', function (event) {
            if (event.target.hasAttribute('data-action')) {
                event.preventDefault()
                const { action } = event.target.dataset
                const [name, type, identifier] = action.split('-')
                //console.log(name, type, identifier)
                switch (name) {
                    case 'click':
                        workspace.showControls(identifier)
                        workspace.selectVisualizer(identifier)
                        break
                }
            }
        })
        controls.addEventListener('click', function (event) {
            if (event.target.hasAttribute('data-action')) {
                event.preventDefault()
                const { action } = event.target.dataset
                const [name, visualizer, identifier] = action.split('-')
                //console.log(name, type, identifier)
                switch (name) {
                    case 'click':
                        controls.selectNode(identifier)
                        break
                }
            }
        })
    }
})

async function main() {
    await app.setup()
    /* await app.addVisualizer('STFT', { width: 512, height: 256, fftSize: 1024 })
    await app.addVisualizer('FFT', { top: 256 })
    await app.addVisualizer('Meter', { left: 256, top: 256 })
    workspace.showControls(0)
    workspace.selectVisualizer(0) */
    //player.play()
}

// startup
/* main().catch(function (err) {
    console.error(err)
}) */
