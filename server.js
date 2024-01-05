const http = require('http')
const cors = require('cors')
const express = require('express')
const path = require('path')

const logger = require('./logger.js')

// load enviorement config
require('dotenv').config()

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
    app.use(require('express-ejs-layouts'))
    app.use('/ejs', express.static(path.join(__dirname, 'node_modules/ejs')))
    // static
    app.use('/bin', express.static(path.join(__dirname, 'bin')))
    app.use('/src', express.static(path.join(__dirname, 'src')))
    app.use('/views', express.static(path.join(__dirname, 'views')))
    app.use('/client', express.static(path.join(__dirname, 'client')))
    // routes
    app.use('/', require('./routes/index.js'))
    app.use('/controls', require('./routes/controls.js'))
    // startup server
    const httpServer = http.createServer(app)
    httpServer.listen(process.env.PORT, function () {
        logger.info(`HTTP Server running on port: ${process.env.PORT}`)
    })
    // process manager
    async function terminate() {
        httpServer.close(function () {
            logger.info(`HTTP server closed`)
            process.exit(0)
        })
    }
    process.on('SIGINT', terminate)
    process.on('SIGTERM', terminate)
}

// startup
main().catch(function (err) {
    return logger.error(err)
})
