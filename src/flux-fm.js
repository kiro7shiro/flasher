async function channels() {
    const response = await fetch('https://fluxmusic.api.radiosphere.io/channels')
    const json = await response.json()
    return json.items
}

async function currentTrack(channel) {
    const now = Date.now()
    const response = await fetch(`https://fluxmusic.api.radiosphere.io/channels/${channel.channelId}/current-track?time=${now}`)
    const json = await response.json()
    return json.trackInfo
}

module.exports = { channels, currentTrack }
