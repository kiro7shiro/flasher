const express = require('express')
const router = express.Router()
const fluxfm = require('../src/flux-fm.js')

router.get('/', async function (req, res) {
    const channels = await fluxfm.channels()
    const { lastChannel } = require('../data.json')
    console.log(`channels: ${channels.length}`)
    const channel = channels.find(function (ch) {
        return ch.displayName === lastChannel
    })
    console.log(`${channel.displayName}`)
    res.render('index', {
        displayName: channel.displayName,
        stream: channel.streams[0].url
    })
})

router.get('/controls', function (req, res) {
    console.log(req.query)
    const { visualizer, id, audioGraph } = req.query
    const temp = audioGraph?.split(',')
    console.log(temp)
    res.render(`controls/${visualizer}`, { id, audioGraph: temp, layout: false })
})

module.exports = router
