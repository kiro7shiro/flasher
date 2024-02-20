#!/usr/bin/env node
const cors = require('cors')
const express = require('express')
const path = require('path')
const fs = require('fs')

const PORT = 5500

// application
const app = express()
// logic
async function main() {
    // cors
    app.use(cors())
    // bodyParser
    app.use(express.urlencoded({ extended: false }))
    app.enable('json escape')
    // EJS
    app.set('view engine', 'ejs')
    app.use('/ejs', express.static(path.join(__dirname, 'node_modules/ejs')))
    // static
    app.use('/bin', express.static(path.join(__dirname, 'bin')))
    app.use('/src', express.static(path.join(__dirname, 'src')))
    app.use(
        '/views',
        function (req, res, next) {
            if (req.path === '/') {
                // TODO : ignore unwanted files
                const viewFiles = fs.readdirSync(path.join(__dirname, 'views')).map(function (name) {
                    const html = fs.readFileSync(path.join(__dirname, 'views', name), 'utf8')
                    return { name, html }
                })
                res.json(viewFiles)
                return
            }
            next()
        },
        express.static(path.join(__dirname, 'views'))
    )
    app.use('/', express.static(path.join(__dirname, 'public')))
    // routes
    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname, 'index.html'))
    })
    // startup
    const server = app.listen(PORT, function () {
        console.log(`app started on localhost:${PORT}`)
    })
    // process manager
    function terminate() {
        server.close()
        console.log(`app stopped`)
        process.exit(0)
    }
    process.on('SIGINT', terminate)
    process.on('SIGTERM', terminate)
}

// startup
main().catch(function (err) {
    // TODO : close server on error
    return console.error(err)
})
