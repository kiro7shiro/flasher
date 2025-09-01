// TODO : AudioSource
// [ ]  : how to handle different api's for getting track infos?
// [ ]  : list all available sources: files, radio streams
// [ ]  : parse files, blobs and stream objects into an AudioSource class

// An audio source is an audio file, blob or a stream api module.
// It provides the src attribute for the audio player
// and defines an interface for receiving track information from an api.
// source comes either as a string pointing to a file in /public/music
// or as an object representing a stream containing a "url" property
// or as a blob from an uploaded file, that will be stored on the server( requires custom server)

export async function getMusicFiles() {
    const resp = await fetch('./music')
    const text = await resp.text()
    if (resp.status !== 200) throw new Error(text)
    const container = document.createElement('div')
    container.insertAdjacentHTML('afterbegin', text)
    const sources = await Promise.all(
        Array.from(container.querySelectorAll('.icon-mp3, .icon-js')).map(async function (item) {
            let source = null
            if (item.title.includes('.js')) {
                // this is a radio stream api
                const module = await import(item.href)
                source = new AudioSource(module)
                source.channels = await source.getChannels()
            } else {
                source = new AudioSource(item.href)
            }
            return source
        })
    )
    return sources
}

export async function getMusicFiles2({ path = './music' } = {}) {
    const url = new URL(path, window.location.origin)
    const resp = await fetch(url)
    if (!resp.ok) {
        const errorText = await resp.text()
        throw new Error(`Failed to fetch ${url.pathname}: ${resp.statusText} - ${errorText}.`)
    }
    const json = await resp.json()
    const sources = []
    for (let sCnt = 0; sCnt < json.length; sCnt++) {
        const file = json[sCnt]
        const fileUrl = new URL(file, window.location.origin)
        let source = null
        if (file.includes('.js')) {
            // this is a radio stream api
            const module = await import(fileUrl.href)
            source = new AudioSource(module)
            source.channels = await source.getChannels()
        } else {
            source = new AudioSource(fileUrl)
        }
        sources.push(source)
    }
    return sources
}

export class AudioSource {
    static TYPES = {
        FILE: 'FILE',
        STREAM: 'STREAM',
        BLOB: 'BLOB'
    }
    constructor(source) {
        this.type = null
        this.ref = null
        switch (true) {
            case typeof source === 'string' || source instanceof URL:
                // source string is a url pointing to a file on the server
                if (typeof source === 'string') source = new URL(source)
                this.ref = source
                this.type = AudioSource.TYPES.FILE
                break

            case typeof source === 'object':
                // stream object
                if (typeof source.getChannel !== 'function') throw new Error(`source object must provide getChannel() function`)
                if (typeof source.getChannels !== 'function') throw new Error(`source object must provide getChannels() function`)
                if (typeof source.getTrackInfo !== 'function') throw new Error(`source object must provide getTrackInfo() function`)
                this.ref = source
                this.type = AudioSource.TYPES.STREAM
                break

            case source instanceof Blob:
                // blob from an uploaded file
                this.ref = URL.createObjectURL(source)
                this.type = AudioSource.TYPES.BLOB
                break

            default:
                throw new Error(`source type not implemented: ${typeof source}`)
        }
    }
    get name() {
        switch (true) {
            case this.type === AudioSource.TYPES.FILE:
                return decodeURIComponent(...this.ref.pathname.split('/').slice(-1))

            case this.type === AudioSource.TYPES.STREAM:
                return this.ref.name

            case this.type === AudioSource.TYPES.BLOB:
                throw new Error('get name() for type "Blob" not implemented')
        }
    }
    getChannel(id) {}
    async getChannels() {
        if (this.type !== AudioSource.TYPES.STREAM) return
        const channels = await this.ref.getChannels()
        return channels
    }
    getTrackInfo({ channelId = null } = {}) {
        switch (true) {
            case this.type === AudioSource.TYPES.FILE:
                // try jsmediatags to read information about the file
                return null

            case this.type === AudioSource.TYPES.STREAM:
                // stream objects provide a dedicated getTrackInfo() function
                return this.ref.getTrackInfo(channelId)

            case this.type === AudioSource.TYPES.BLOB:
                return null
        }
    }
}
