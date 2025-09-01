const fs = require('fs')
const path = require('path')

class Flasher {
    constructor(file) {
        this.path = path.resolve(file)
        this.data = JSON.parse(fs.readFileSync(this.path, 'utf8'))
    }
    get(property) {
        if (this.data[property] === undefined) return false
        return this.data[property]
    }
    set(property, value) {
        if (this.data[property] === undefined) return false
        this.data[property] = value
        this.write()
        return true
    }
    write({ json = null } = {}) {
        if (json === null) {
            json = JSON.stringify(this.data, null, 4)
        } else {
            if (typeof json === 'object') {
                json = JSON.stringify(json, null, 4)
            }
        }
        try {
            fs.writeFileSync(this.path, json)
        } catch (error) {
            console.error(error)
        }
        // reload data
        this.data = JSON.parse(fs.readFileSync(this.path, 'utf8'))
    }
}

module.exports = { Flasher }
