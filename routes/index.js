const data = require('../data.json')
const express = require('express')
const router = express.Router()
const fluxfm = require('../src/flux-fm.js')
const fs = require('fs/promises')
const path = require('path')

router.get('/', async function (req, res) {
    const channels = await fluxfm.channels()
    const { lastChannel } = data
    const channel = channels.find(function (ch) {
        return ch.displayName === lastChannel
    })
    console.log(`${channel.displayName}`)
    res.render('index', { lastChannel: channel, channels })
})

router.get('/channels', async function (req, res) {
    const channels = await fluxfm.channels()
    res.json(channels)
})

router.get('/currentTrack', async function (req, res) {
    const { channelId } = req.query
    const trackInfo = await fluxfm.currentTrack(channelId)
    res.json(trackInfo)
})

router.post('/selectedChannel', async function (req, res) {
    let { channel } = req.query
    channel = JSON.parse(channel)
    data.lastChannel = channel.displayName
    try {
        await fs.writeFile(path.resolve(__dirname, '../data.json'), JSON.stringify(data, null, 4))
        res.sendStatus(200)
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }
})

const visualizers = {}

router.get('/controls', function (req, res) {
    console.log(req.query)
    const { visualizer, audioGraph: temp } = req.query
    // increase count
    if (!visualizers[visualizer]) visualizers[visualizer] = 0
    visualizers[visualizer]++
    const id = `${visualizer}${visualizers[visualizer]}`
    // parse audioGraph
    const audioGraph = JSON.parse(temp)
    // render controls
    res.render(`controls/${visualizer}`, { id, audioGraph, layout: false })
})

module.exports = router
