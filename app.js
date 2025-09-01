#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const express = require('express')

function create(options = {}) {
    const app = express()
    const crudRouter = express.Router()
    const musicRouter = express.Router()
    const musicPath = options.musicPath || path.join(process.cwd(), 'public', 'music')
    const appController = require('./controller/flasher-controller.js')

    /**
     * Recursively list all files in a directory
     *
     * @param {string} directory
     * @returns {string[]}
     */
    function listFiles(directory) {
        const result = []
        const files = fs.readdirSync(directory)
        for (let fCnt = 0; fCnt < files.length; fCnt++) {
            const file = path.join(directory, files[fCnt])
            if (fs.statSync(file).isDirectory()) {
                result.push(...listFiles(file))
            } else {
                result.push(file.replace(musicPath, '\\music'))
            }
        }
        return result
    }

    crudRouter.use('/read', appController)
    crudRouter.use('/update', appController)

    musicRouter.get('/', function (req, res, next) {
        if (req.baseUrl === '/music') {
            const files = listFiles(musicPath)
            res.send(files)
            return
        }
        next()
    })

    app.use('/src', express.static(path.join(__dirname, 'src')))
    app.use('/music', express.static(musicPath), musicRouter)
    app.use('/', express.static(path.join(__dirname, 'public')), crudRouter)

    return app
}

module.exports = create
