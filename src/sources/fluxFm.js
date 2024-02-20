/**
 * API for interacting with fluxfm radio channels
 * @returns {Object}
 */

const memory = {
    channels: null
}

async function channel(identifier) {
    if (!memory.channels) await channels()
    return memory.channels.find(function (channel) {
        return identifier === channel.name || identifier === channel.displayName || identifier === channel.channelId
    })
}

async function channels() {
    if (!memory.channels) {
        const response = await fetch('https://fluxmusic.api.radiosphere.io/channels')
        const json = await response.json()
        memory.channels = json.items
    }
    return memory.channels
}

async function currentTrack(channelId) {
    const now = Date.now()
    const response = await fetch(`https://fluxmusic.api.radiosphere.io/channels/${channelId}/current-track?time=${now}`)
    let result = response.status
    if (response.status === 200) {
        const json = await response.json()
        result = json.trackInfo
    }
    return result
}


//if (module) module.exports = { channel, channels, currentTrack }
export { channel, channels, currentTrack }