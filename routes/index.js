const data = require('../data.json')
const express = require('express')
const router = express.Router()
const fluxfm = require('../src/flux-fm.js')
const fs = require('fs/promises')
const path = require('path')
const logger = require('../logger.js')

router.get('/', async function (req, res) {
    // get viusalizer classes and filter out unwanted files
    const filter = /(^[A-Z].*)(\.e?js)/
    const blacklist = ['AnalyzerNode.ejs', 'Visualizers.js', 'Visualizer.js']
    const visualizerNames = (await fs.readdir(path.resolve(__dirname, '../src/visualizers'))).reduce(function (accu, curr) {
        if (blacklist.includes(curr)) return accu
        const matches = filter.exec(curr)
        if (!matches) return accu
        accu.push(matches[1])
        return accu
    }, [])
    // get node classes and filter out unwanted files
    const nodeNames = (await fs.readdir(path.resolve(__dirname, '../views/controls/nodes'))).reduce(function (accu, curr) {
        if (blacklist.includes(curr)) return accu
        const matches = filter.exec(curr)
        if (!matches) return accu
        accu.push(matches[1])
        return accu
    }, [])
    // load fluxfm channels
    req.app.locals.channels = await fluxfm.channels()
    const { lastChannel } = data
    const channel = await fluxfm.channel(lastChannel)
    // render page
    res.render('index', { lastChannel: channel, visualizers: visualizerNames, nodes: nodeNames })
})

router.get('/channels', async function (req, res) {
    const channels = await fluxfm.channels()
    res.json(channels)
})

router.get('/currentTrack', async function (req, res) {
    const { channelId } = req.query
    const trackInfo = await fluxfm.currentTrack(channelId)
    if (isNaN(trackInfo)) {
        res.json(trackInfo)
    } else {
        res.sendStatus(trackInfo)
    }
})

router.post('/selectedChannel', async function (req, res) {
    let { channelId } = req.query
    const channel = await fluxfm.channel(channelId)
    logger.info(`Selected channel: ${channel.displayName}`)
    // save to json file
    data.lastChannel = channel.displayName
    try {
        await fs.writeFile(path.resolve(__dirname, '../data.json'), JSON.stringify(data, null, 4))
        res.sendStatus(200)
    } catch (error) {
        logger.error(error)
        res.sendStatus(500)
    }
})

module.exports = router
