import { Sound } from './Sound.js'
import { Player } from './Player.js'
import { Playlist } from './Playlist.js'
import { AudioSource } from './sources/AudioSource.js'
import { VisualizersMenu } from './VisualizersMenu.js'
import { Visualizers } from './visualizers/visualizers.js'
import { AudioNodes } from './nodes/nodes.js'

// TODO : the app should control the visualizers animations

export class Application {
    constructor() {
        // logic controls
        this.sound = new Sound()
        this.visualizers = []
        this.selectedVisualizer = null
        // TODO : lastPlayed: Playlists items index must be saved, too
        // TODO : lastPlayed: currentTime must be saved, too
        this.lastPlayed = null
        this.resume = true
        // ui controls
        this.player = Player.buildSync()
        this.playlist = Playlist.buildSync()
        this.visualizersMenu = VisualizersMenu.buildSync({
            data: { visualizers: Object.keys(Visualizers), nodes: Object.keys(AudioNodes).filter((node) => node !== 'AnalyserNode') }
        })
        this.visualizersTracks = document.querySelector('.visualizers-tracks')
        // connect player
        this.sound.connect(this.player.audio)
        // setup events
        const self = this
        const { player, playlist, sound, visualizersMenu, visualizersTracks } = self
        // player
        player.on('play', function () {
            self.lastPlayed = player.current
            self.save()
        })
        player.on('ended', function () {
            if (player.continue) {
                const next = playlist.next()
                if (next === null) {
                    player.pause()
                    return
                }
                player.play(next)
            }
        })
        // playlist
        playlist.on('select', function (event) {
            const { detail: target } = event
            const next = playlist.queue[target.dataset.index]
            playlist.current = target.dataset.index
            player.play(next)
        })
        // visualizers menu
        visualizersMenu.on('addVisualizer', function (event) {
            console.log(event.detail)
            const { type } = event.detail.dataset
            // get the constructor and defaults
            const constructor = Visualizers[type]
            // build the control
            // show build options if available
            const visualizer = constructor.buildSync(sound)
            self.visualizers.push(visualizer)
            Visualizers.connect2(self.sound, visualizer)
            // add control to ui
            visualizersTracks.insertAdjacentElement('afterbegin', visualizer.container)
            visualizer.draw(sound.context.currentTime * 1000)
            self.selectedVisualizer = visualizer
            console.log(visualizer)
        })
        visualizersMenu.on('addNode', function (event) {
            console.log(event.detail)
            const { type } = event.detail.dataset
            // get the constructor and defaults
            const constructor = AudioNodes[type]
            const control = constructor.buildSync(sound)
            Visualizers.disconnect(self.selectedVisualizer)
            self.selectedVisualizer.audioGraph.push(control.node)
            self.selectedVisualizer.audioNodes.insertAdjacentElement('afterbegin', control.container)
            Visualizers.connect2(sound, self.selectedVisualizer)
        })
    }
    connect() {
        for (let vCnt = 0; vCnt < this.visualizers.length; vCnt++) {
            const visualizer = this.visualizers[vCnt]
            Visualizers.connect2(this.sound, visualizer)
        }
    }
    disconnect() {
        for (let vCnt = 0; vCnt < this.visualizers.length; vCnt++) {
            const visualizer = this.visualizers[vCnt]
            Visualizers.disconnect(visualizer)
            cancelAnimationFrame(visualizer.handle)
        }
    }
    draw() {
        for (let vCnt = 0; vCnt < this.visualizers.length; vCnt++) {
            const visualizer = this.visualizers[vCnt]
            visualizer.draw(this.sound.context.currentTime * 1000)
        }
    }
    getState(control, keys) {
        const state = {}
        for (let kCnt = 0; kCnt < keys.length; kCnt++) {
            const key = keys[kCnt]
            state[key] = control[key]
        }
        return JSON.stringify(state, null, 4)
    }
    async preload({ name = 'flasher' } = {}) {
        // preload saved settings from last session if possible
        // playlist:
        // last played source
        // player:
        // last played time
        try {
            const endpoint = `/read/${name}`
            const resp = await fetch(endpoint, {
                method: 'GET'
            })
            const body = await resp.json()
            const { lastPlayed } = body
            if (lastPlayed.type === AudioSource.TYPES.STREAM) {
                const module = await import(new URL(`/music/${lastPlayed.ref.name}.js`, window.location.origin).href)
                const source = new AudioSource(module)
                source.channels = await source.getChannels()
                this.lastPlayed = source
            } else {
                this.lastPlayed = new AudioSource(lastPlayed.ref)
            }
        } catch (error) {
            console.error(error)
        }
    }
    async save({ control = null, keys = [], name = 'flasher' } = {}) {
        try {
            let body = null
            if (control === null) {
                body = this.getState(this, ['lastPlayed'])
            } else {
                body = this.getState(control, keys)
            }
            const endpoint = `/update/${name}`
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            })
        } catch (error) {
            console.error(error)
        }
    }
}
