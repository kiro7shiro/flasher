/**
 * Main handles setup and top level error handling
 */

import { compileOptions, preload } from '/src/templates.js'
import { getMusicFiles2 } from '../src/sources/AudioSource.js'
import { Application } from '../src/Application.js'

// TODO : use my fancy own templates script ;)

async function setup() {
    // setup templates for sync rendering
    compileOptions.async = false
    await preload()
    // setup application
    // 1. load saved music sources from the server
    
    const app = new Application()
    await app.preload()

    console.log(app)

    const { player, playlist } = app
    const sources = await getMusicFiles2()
    playlist.add(sources)

    console.log(player)
    console.log(playlist)

    playlist.repeat = true
    if (app.resume) player.play(app.lastPlayed)

    window.app = app

}

setup().catch(function (err) {
    console.error(err)
})
