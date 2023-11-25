const http = require('http')
const cors = require('cors')
const express = require('express')
const os = require('os')
const path = require('path')

// load enviorement config
require('dotenv').config()

// application
function log(msg) {
    const prefix = `[${os.hostname()}]`
    console.log(`${prefix} ${msg}`)
}
const app = express()

// logic
async function main() {
    // cors
    app.use(cors())
    // bodyParser
    app.use(express.urlencoded({ extended: false }))
    // EJS
    app.set('view engine', 'ejs')
    app.use(require('express-ejs-layouts'))
    app.use('/ejs', express.static(path.join(__dirname, 'node_modules/ejs')))
    // static
    app.use('/src', express.static(path.join(__dirname, 'src')))
    app.use('/views', express.static(path.join(__dirname, 'views')))
    // routes
    app.use('/', require('./routes/index.js'))
    // startup server
    const httpServer = http.createServer(app)
    httpServer.listen(process.env.PORT, function () {
        log(`HTTP Server running on port: ${process.env.PORT}`)
    })
    // process manager
    async function terminate() {
        httpServer.close(function () {
            log(`HTTP server closed`)
            process.exit(0)
        })
    }
    process.on('SIGINT', terminate)
    process.on('SIGTERM', terminate)
}

// startup
main().catch(function (err) {
    return console.error(err)
})

module.exports = { log }
