import { Sound, construct, getMusicFiles } from '../src/index.js'
import * as visualizers from '../src/visualizers/index.js'
import * as nodes from '../src/nodes/index.js'
import * as fluxfm from '../src/sources/fluxFm.js'

class Application {
    constructor() {
        this.visualizers = []
        this.selectedVisualizer = null
    }
    connect(sound) {
        this.visualizers.map(function (visualizer) {
            visualizers.connect(sound, visualizer)
        })
    }
    disconnect() {
        this.visualizers.map(function (visualizer) {
            visualizers.disconnect(visualizer)
        })
    }
    select(visualizer) {
        this.selectedVisualizer = visualizer
        visualizer.element.classList.add('selected-visualizer')
    }
    deselect(visualizer) {
        this.selectedVisualizer = null
        visualizer.element.classList.remove('selected-visualizer')
    }
}

const app = (window.app = new Application())
const sound = new Sound()

async function setup() {
    // overlay, sidebar, addFilterMenu
    const overlay = await construct(document.getElementById('overlay'))
    const sidebar = await construct(document.getElementById('sidebar'))
    const addFilterMenu = await construct('AddFilterMenu')
    addFilterMenu.hide()
    addFilterMenu.on('close', function () {
        addFilterMenu.hide()
        overlay.hide()
    })
    document.body.insertAdjacentElement('afterbegin', addFilterMenu.element)
    sidebar.on('sidebar-close', function () {
        sidebar.hide()
        overlay.hide()
    })
    // player
    const player = await construct('Player')
    sound.connect(player.audio)
    const playerContainer = document.getElementById('player-container')
    playerContainer.children[0].after(player.element)
    if (player.history.length) {
        const last = player.history.last()
        player.play(last.source)
    }
    player.on('ended', function (event) {
        // TODO : playlist next track
        console.log('next track : not implemented')
    })
    // sources
    const musicFiles = await getMusicFiles()
    const sources = await construct('Sources', { musicFiles })
    sources.on('select', function (event) {
        const { detail: fileName } = event
        player.pause()
        player.play(`./music/${fileName}`)
    })
    const sourcesContainer = document.getElementById('sources-container')
    sourcesContainer.append(sources.element)
    // appMenu
    const appMenu = await construct(document.getElementById('app-menu'))
    appMenu.on('sidebar-open', function () {
        if (!sidebar.visible) {
            overlay.show()
            sidebar.show()
        } else {
            sidebar.hide()
            overlay.hide()
        }
    })
    // visualizers
    const visualizersMenu = await construct('VisualizersMenu', {
        visualizers: visualizers.selectable(),
        nodes: nodes.selectable()
    })
    const visualizersContainer = document.getElementById('visualizers-container')
    visualizersMenu.on('add-visualizer', async function (event) {
        // TODO : add visualizer menu
        const visualizer = await construct(`visualizers/${event.detail}`, {
            sound,
            width: 512,
            height: 256,
            fftSize: 1024,
            rows: 16,
            cols: 32
        })
        visualizersContainer.append(visualizer.element)
        visualizers.connect(sound, visualizer)
        app.visualizers.push(visualizer)
        if (app.selectedVisualizer === null) app.select(visualizer)
        visualizer.control.on('click', function () {
            if (app.selectedVisualizer !== null) app.deselect(app.selectedVisualizer)
            app.select(visualizer)
        })
    })
    visualizersMenu.on('add-node', async function (event) {
        if (app.selectedVisualizer === null) return
        const nodeName = event.detail
        switch (nodeName) {
            case 'BiquadFilterNode':
                overlay.show()
                addFilterMenu.show()
                const addHandler = async function (e) {
                    player.pause()
                    sound.disconnect()
                    app.disconnect()
                    addFilterMenu.hide()
                    overlay.hide()
                    addFilterMenu.off('add', addHandler)
                    //
                    const options = JSON.parse(JSON.stringify(e.target.dataset))
                    const node = visualizers.addNode(app.selectedVisualizer, nodeName, options)
                    const nodeControls = await construct(`nodes/${nodeName}`, options)
                    nodes.addEvents(node, nodeControls)
                    visualizers.appendNodeControls(app.selectedVisualizer, nodeControls)
                    //
                    sound.connect(player.audio)
                    app.connect(sound)
                    player.play()
                }
                addFilterMenu.on('add', addHandler)
                break

            default:
                player.pause()
                sound.disconnect()
                app.disconnect()
                //
                const node = visualizers.addNode(app.selectedVisualizer, nodeName)
                const nodeControls = await construct(`nodes/${nodeName}`)
                nodes.addEvents(node, nodeControls)
                visualizers.appendNodeControls(app.selectedVisualizer, nodeControls)
                //
                sound.connect(player.audio)
                app.connect(sound)
                player.play()
                break
        }
    })
    const visualizersMenuContainer = document.getElementById('visualizers-menu-container')
    visualizersMenuContainer.append(visualizersMenu.element)
}

setup().catch(function (err) {
    console.error(err)
})
