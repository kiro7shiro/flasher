// An audio source is a audio file, blob or stream.
// It provides the src attribute for the audio player
// and defines a interface for receiving track information.
// source comes either as a string pointing to a file in /public/music
// or as an object representing a stream containing a "url" property
// or as a blob from an uploaded file, that will be stored on the server( requires custom server)

async function getMusicFiles() {
    const resp = await fetch('./music')
    const text = await resp.text()
    if (resp.status !== 200) throw new Error(text)
    const container = document.createElement('div')
    container.insertAdjacentHTML('afterbegin', text)
    const files = Array.from(container.querySelectorAll('.icon-mp3')).map(function (item) {
        return item.title
    })
    return files
}

class AudioSource {
    constructor(source) {
        // TODO : source blob
        switch (true) {
            case typeof source === 'string':
                // source string pointing to a file
                this.source = source
                break

            case typeof source === 'object':
                // stream object
                break

            default:
                break
        }
    }
    getTrackInfo() {
        // TODO : how to handle different api's for getting track infos?
    }
}

export { AudioSource, getMusicFiles }
