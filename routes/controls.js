// handles construction of controls for classes
// manages ids of objects

const express = require('express')
const router = express.Router()
const logger = require('../logger.js')

const visualizers = {}
router.get('/', function (req, res) {
    const { instance, isAudioNode } = req.query
    logger.info(`Constructing controls for: ${instance}`)
    // increase count
    if (!visualizers[instance]) visualizers[instance] = 0
    visualizers[instance]++
    const id = `${instance}${visualizers[instance]}`
    // render controls
    const locals = Object.assign({ id, layout: false }, req.query)
    if (isAudioNode === 'false') {
        res.render(`controls/visualizers/${instance}`, locals)
    } else {
        res.render(`controls/nodes/${instance}`, locals)
    }
})

router.get('/addNode', function (req, res) {
    const { identifier } = req.query
    res.render('controls/addNode/AddNode', { identifier, layout: false })
})

module.exports = router
