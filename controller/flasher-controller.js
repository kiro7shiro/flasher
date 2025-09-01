const express = require('express')
const router = express.Router({ mergeParams: true })
const { Flasher } = require('../models/Flasher.js')

const controller = new Flasher('./data/flasher.json')

router.get(['/flasher', '/flasher/:property'], function (req, res) {
    const { property } = req.params
    if (property === undefined || property === null) {
        res.json(controller.data)
    } else {
        const value = controller.get(property)
        if (value === false) {
            res.sendStatus(404).end()
        } else {
            res.json(Object.defineProperty({}, property, { value: value, writable: true, enumerable: true, configurable: true }))
        }
    }
})

router.post(['/flasher', '/flasher/:property/:value'], function (req, res) {
    const { property, value } = req.params
    if (property === undefined || property === null) {
        if (req.body === undefined) return
        controller.write({ json: req.body })
        res.sendStatus(200)
    } else {
        const resp = controller.set(property, value)
        if (resp === false) {
            res.sendStatus(404).end()
        } else {
            res.sendStatus(200)
        }
    }
})

module.exports = router
