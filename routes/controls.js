// handles construction of controls for classes
// manages ids of objects

const express = require('express')
const router = express.Router()
const logger = require('../logger.js')

const visualizers = {}
router.get('/', function (req, res) {
    console.log(req.query)
    const { instance, isAudioNode } = req.query
    logger.info(`Constructing controls for: ${instance}`)
    // increase count
    if (!visualizers[instance]) visualizers[instance] = 0
    visualizers[instance]++
    const id = `${instance}${visualizers[instance]}`
    // render controls
    if (isAudioNode === 'false') {
        res.render(`controls/visualizers/${instance}`, { id, layout: false })
    } else {
        const locals = { id, instance, layout: false }
        if (instance === 'BiquadFilterNode') locals.type = req.query.type
        res.render(`controls/nodes/${instance}`, locals)
    }
    
})

module.exports = router
